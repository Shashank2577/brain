/**
 * Agent Teams — sub-agent orchestration for agent-native.
 *
 * The main agent chat acts as an orchestrator. It spawns sub-agents
 * for individual tasks, which run in their own threads. Sub-agents
 * appear as rich preview cards (chips) inline in the main chat.
 *
 * This module provides the server-side infrastructure:
 * - Creating sub-agent threads and running them in background
 * - Tracking task status and results
 * - Emitting SSE events for live preview cards
 * - Bidirectional messaging between main agent and sub-agents
 *
 * Task state is persisted in application_state (SQL) so it survives
 * serverless cold starts and works across multiple processes.
 */
import { actionsToEngineTools } from "../agent/production-agent.js";
import { createAnthropicEngine } from "../agent/engine/anthropic-engine.js";
import { createThread } from "../chat-threads/store.js";
import { abortRun, getRun, startRun, subscribeToRun, } from "../agent/run-manager.js";
import { getRunEventsSince } from "../agent/run-store.js";
import { runAgentLoop } from "../agent/production-agent.js";
import { buildAssistantMessage } from "../agent/thread-data-builder.js";
import { readAppState, writeAppState, listAppState, deleteAppState, } from "../application-state/script-helpers.js";
import { getRequestUserEmail } from "./request-context.js";
export function createAgentTeamBackgroundAgentController() {
    return {
        async list(options) {
            if (options?.goalId && options.goalId !== "agent-team")
                return [];
            return listAgentTeamBackgroundRuns();
        },
        get: getAgentTeamBackgroundRun,
        transcript: listAgentTeamBackgroundTranscriptEvents,
        sendFollowUp: sendAgentTeamBackgroundAgentFollowUp,
        control: controlAgentTeamBackgroundAgentRun,
    };
}
export const agentTeamBackgroundAgentController = createAgentTeamBackgroundAgentController();
/** Key prefix for task records: agent-task:{taskId} */
const TASK_PREFIX = "agent-task:";
/** Key prefix for thread→task reverse lookup: agent-task-thread:{threadId} */
const THREAD_PREFIX = "agent-task-thread:";
/** Key prefix for queued orchestrator→sub-agent messages. */
const TASK_MESSAGE_PREFIX = "task-message:";
function taskMessageQueuePrefix(taskId) {
    return `${TASK_MESSAGE_PREFIX}${taskId}:`;
}
function generateTaskMessageId() {
    return `msg-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;
}
function normalizeQueuedTaskMessage(value, fallbackId) {
    if (typeof value.message !== "string" || value.message.trim().length === 0) {
        return null;
    }
    const timestamp = typeof value.timestamp === "number" && Number.isFinite(value.timestamp)
        ? value.timestamp
        : Date.now();
    return {
        id: typeof value.id === "string" ? value.id : fallbackId,
        from: "orchestrator",
        message: value.message,
        timestamp,
    };
}
function formatQueuedTaskMessages(messages) {
    const label = messages.length === 1
        ? "Orchestrator message received while you were working"
        : "Orchestrator messages received while you were working";
    const body = messages
        .map((message) => {
        const sentAt = new Date(message.timestamp).toISOString();
        return `[${sentAt}] ${message.message}`;
    })
        .join("\n\n");
    return `${label}:\n\n${body}\n\nAdjust your next steps to account for this update.`;
}
const taskMessageDrainLocks = new Map();
async function withTaskMessageDrainLock(taskId, fn) {
    const previous = taskMessageDrainLocks.get(taskId) ?? Promise.resolve();
    let release;
    const current = new Promise((resolve) => (release = resolve));
    taskMessageDrainLocks.set(taskId, current);
    await previous.catch(() => { });
    try {
        return await fn();
    }
    finally {
        release();
        if (taskMessageDrainLocks.get(taskId) === current) {
            taskMessageDrainLocks.delete(taskId);
        }
    }
}
async function listQueuedTaskMessages(taskId) {
    const queuePrefix = taskMessageQueuePrefix(taskId);
    const entries = await listAppState(queuePrefix);
    const messages = entries
        .map((entry) => {
        const id = entry.key.slice(queuePrefix.length);
        const message = normalizeQueuedTaskMessage(entry.value, id);
        return message ? { key: entry.key, message } : null;
    })
        .filter((entry) => Boolean(entry));
    // Backward compatibility for messages queued by the old implementation.
    const legacyKey = `${TASK_MESSAGE_PREFIX}${taskId}`;
    const legacy = await readAppState(legacyKey);
    const legacyMessage = legacy
        ? normalizeQueuedTaskMessage(legacy, "legacy")
        : null;
    if (legacyMessage) {
        messages.push({ key: legacyKey, message: legacyMessage });
    }
    return messages.sort((a, b) => {
        const byTimestamp = a.message.timestamp - b.message.timestamp;
        return byTimestamp || a.message.id.localeCompare(b.message.id);
    });
}
async function drainQueuedTaskMessages(taskId) {
    return withTaskMessageDrainLock(taskId, async () => {
        const entries = await listQueuedTaskMessages(taskId);
        if (entries.length === 0)
            return [];
        for (const entry of entries) {
            await deleteAppState(entry.key);
        }
        return entries.map((entry) => entry.message);
    });
}
async function appendQueuedTaskMessage(taskId, message) {
    const messageId = generateTaskMessageId();
    await writeAppState(`${taskMessageQueuePrefix(taskId)}${messageId}`, {
        id: messageId,
        from: "orchestrator",
        message,
        timestamp: Date.now(),
    });
    const queuedCount = (await listQueuedTaskMessages(taskId)).length;
    return { messageId, queuedCount };
}
function createMessageAwareActions(taskId, actions) {
    return Object.fromEntries(Object.entries(actions).map(([name, entry]) => [
        name,
        {
            ...entry,
            run: async (args, context) => {
                const result = await entry.run(args, context);
                const queuedMessages = await drainQueuedTaskMessages(taskId);
                if (queuedMessages.length === 0)
                    return result;
                // Tool results are already the next safe model-visible boundary:
                // the loop records all tool output, then asks the model to continue.
                // Attaching queued updates here avoids mutating message history while
                // an assistant tool-call turn is still being resolved.
                const formatted = formatQueuedTaskMessages(queuedMessages);
                const resultText = typeof result === "string"
                    ? result
                    : JSON.stringify(result, null, 2);
                return `${resultText}\n\n${formatted}`;
            },
        },
    ]));
}
function createTaskMessageFinalGuard(taskId) {
    return async () => {
        const queuedMessages = await drainQueuedTaskMessages(taskId);
        if (queuedMessages.length === 0)
            return null;
        // This is queued delivery, not a live interrupt: if the sub-agent is
        // already producing a final answer, the guard asks the loop for one more
        // continuation that includes the orchestrator update as a fresh user turn.
        return {
            retryMessage: formatQueuedTaskMessages(queuedMessages),
            fallbackMessage: "I received an orchestrator update while finishing, but could not continue from it. Please check the task status and send the update again if needed.",
        };
    };
}
async function saveTask(task) {
    await writeAppState(`${TASK_PREFIX}${task.taskId}`, task);
    await writeAppState(`${THREAD_PREFIX}${task.threadId}`, {
        taskId: task.taskId,
    });
}
async function loadTask(taskId) {
    const data = await readAppState(`${TASK_PREFIX}${taskId}`);
    return data ? data : null;
}
async function loadTaskByThread(threadId) {
    const ref = await readAppState(`${THREAD_PREFIX}${threadId}`);
    if (!ref || !ref.taskId)
        return null;
    return loadTask(ref.taskId);
}
function generateTaskId() {
    return `task-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;
}
function taskRunId(taskId) {
    return `run-task-${taskId}`;
}
function taskIdFromBackgroundRunId(runId) {
    return runId.startsWith("run-task-")
        ? runId.slice("run-task-".length)
        : runId;
}
function mapTaskStatusToBackgroundStatus(status) {
    return status;
}
function taskTimestampToIso(timestamp) {
    const date = new Date(timestamp);
    return Number.isFinite(date.getTime())
        ? date.toISOString()
        : new Date(0).toISOString();
}
function latestTaskText(task) {
    return task.summary || task.preview || task.currentStep || undefined;
}
export function toAgentTaskBackgroundRun(task) {
    const createdAt = taskTimestampToIso(task.createdAt);
    return {
        schemaVersion: 1,
        id: taskRunId(task.taskId),
        kind: "agent-team",
        source: "hosted-agent-team",
        sourceLabel: "Agent Teams",
        sourceRecord: {
            type: "agent-team-task",
            id: task.taskId,
            threadId: task.threadId,
        },
        title: task.description,
        subtitle: task.currentStep || undefined,
        status: mapTaskStatusToBackgroundStatus(task.status),
        phase: task.currentStep || task.status,
        createdAt,
        updatedAt: createdAt,
        goalId: "agent-team",
        needsInput: false,
        needsApproval: false,
        details: [
            { label: "Task", value: task.taskId },
            { label: "Thread", value: task.threadId },
        ],
        surfaceUrl: `agent-native://threads/${task.threadId}`,
        metadata: {
            taskId: task.taskId,
            threadId: task.threadId,
            description: task.description,
            preview: task.preview,
            summary: task.summary,
            currentStep: task.currentStep,
            latestText: latestTaskText(task),
        },
    };
}
function summarizeAgentChatEvent(event) {
    const payload = event.event;
    switch (payload.type) {
        case "text":
            return { kind: "note", message: payload.text };
        case "activity":
            return {
                kind: "status",
                message: payload.label,
                metadata: payload.tool ? { tool: payload.tool } : undefined,
            };
        case "tool_start":
            return {
                kind: "status",
                message: `Running ${payload.tool}`,
                metadata: { tool: payload.tool, input: payload.input },
            };
        case "tool_done":
            return {
                kind: "artifact",
                message: payload.result,
                metadata: { tool: payload.tool },
            };
        case "agent_task":
            return {
                kind: "status",
                message: `${payload.description} (${payload.status})`,
                metadata: {
                    taskId: payload.taskId,
                    threadId: payload.threadId,
                    status: payload.status,
                },
            };
        case "agent_task_update":
            return {
                kind: "status",
                message: payload.preview || payload.currentStep || "Task updated",
                metadata: {
                    taskId: payload.taskId,
                    currentStep: payload.currentStep,
                },
            };
        case "agent_task_complete":
            return {
                kind: "status",
                message: payload.summary,
                metadata: { taskId: payload.taskId },
            };
        case "error":
            return {
                kind: "status",
                message: payload.error,
                metadata: {
                    errorCode: payload.errorCode,
                    upgradeUrl: payload.upgradeUrl,
                },
            };
        case "missing_api_key":
            return {
                kind: "status",
                message: "Missing API key",
            };
        case "done":
            return { kind: "status", message: "Run completed" };
        case "loop_limit":
            return { kind: "status", message: "Run stopped at the loop limit" };
        case "auto_continue":
            return {
                kind: "status",
                message: "Run reached its continuation boundary",
                metadata: { reason: payload.reason },
            };
        case "clear":
            return null;
        case "agent_call":
            return {
                kind: "status",
                message: `${payload.agent} ${payload.status}`,
                metadata: { agent: payload.agent, status: payload.status },
            };
        case "agent_call_text":
            return {
                kind: "note",
                message: payload.text,
                metadata: { agent: payload.agent },
            };
        default:
            return null;
    }
}
export function toAgentTaskBackgroundTranscriptEvent(runId, event) {
    const summary = summarizeAgentChatEvent(event);
    if (!summary)
        return null;
    return {
        schemaVersion: 1,
        id: `${runId}:${event.seq}`,
        runId,
        kind: summary.kind,
        source: "hosted-agent-team",
        sourceRecord: {
            type: "agent-team-run-event",
            id: `${runId}:${event.seq}`,
            seq: event.seq,
        },
        message: summary.message,
        createdAt: new Date().toISOString(),
        metadata: summary.metadata,
    };
}
/**
 * Spawn a sub-agent task. Creates a thread, starts a background agent run,
 * and emits agent_task events to the parent chat stream.
 */
export async function spawnTask(opts) {
    const taskId = generateTaskId();
    // Create a dedicated thread for the sub-agent with the task as the first message
    const thread = await createThread(opts.ownerEmail, {
        title: opts.description.slice(0, 100),
    });
    // Save the initial user message to thread data so the tab shows content
    // immediately. Shape must match assistant-ui's ExportedMessageRepository —
    // each entry carries an explicit `parentId` so the runtime threads messages
    // into a linked list; without it, later assistant messages render as
    // orphaned siblings and only the one under `headId` is shown.
    const userMsgId = `msg-${taskId}-user`;
    try {
        const { updateThreadData } = await import("../chat-threads/store.js");
        const threadData = JSON.stringify({
            headId: userMsgId,
            messages: [
                {
                    message: {
                        id: userMsgId,
                        role: "user",
                        content: [{ type: "text", text: opts.description }],
                        metadata: {},
                    },
                    parentId: null,
                },
            ],
        });
        await updateThreadData(thread.id, threadData, opts.description.slice(0, 100), opts.description.slice(0, 200), 1);
    }
    catch {
        // Best effort — thread will still work without persisted messages
    }
    const task = {
        taskId,
        threadId: thread.id,
        description: opts.description,
        status: "running",
        preview: "",
        summary: "",
        currentStep: "",
        createdAt: Date.now(),
    };
    await saveTask(task);
    // Notify parent chat that a sub-agent was spawned
    opts.parentSend({
        type: "agent_task",
        taskId,
        threadId: thread.id,
        description: opts.description,
        status: "running",
    });
    // Build scoped system prompt
    // Prepend a clear "you are a sub-agent" reminder so the agent doesn't
    // start exploring the file system or database before using its actions.
    const actionNames = Object.keys(opts.actions).join(", ");
    const subAgentPreamble = `## You Are a Sub-Agent

You are a focused sub-agent with a specific task. You have been given a curated set of actions that connect directly to the app's database and services.

**Start immediately with your task. Do NOT:**
- Run \`db-schema\` to explore the database structure
- Run \`bash\` just to search/list files
- Try to \`curl\` or access external URLs to find the app
- Use \`bash\` for exploration — only for running \`pnpm action\` commands when no direct action exists

**Your available actions (${actionNames}) work directly. Use them.**

`;
    let systemPrompt = subAgentPreamble + opts.systemPrompt;
    if (opts.instructions) {
        systemPrompt += `\n\n## Task-Specific Instructions\n\n${opts.instructions}`;
    }
    // Resolve the engine — prefer the passed engine, fall back to Anthropic with apiKey
    const engine = opts.engine ?? createAnthropicEngine({ apiKey: opts.apiKey });
    const model = opts.model ?? engine.defaultModel;
    // Build tools from actions using the normalized EngineTool format
    const messageAwareActions = createMessageAwareActions(taskId, opts.actions);
    const tools = actionsToEngineTools(messageAwareActions);
    const messages = [
        { role: "user", content: [{ type: "text", text: opts.description }] },
    ];
    // Start the agent run in background
    const runId = `run-task-${taskId}`;
    let accumulatedText = "";
    let lastPreviewSent = 0;
    const PREVIEW_INTERVAL_MS = 300; // Throttle preview updates to every 300ms
    // Gate to prevent sendPreviewUpdate from overwriting terminal status
    let runFinished = false;
    startRun(runId, thread.id, async (send, signal) => {
        const sendPreviewUpdate = async (force = false) => {
            if (runFinished)
                return; // Don't overwrite completed/errored status
            const now = Date.now();
            if (!force && now - lastPreviewSent < PREVIEW_INTERVAL_MS)
                return;
            lastPreviewSent = now;
            task.preview = accumulatedText.slice(-800);
            // Persist to SQL so status checks from other processes see live state
            await saveTask(task);
            opts.parentSend({
                type: "agent_task_update",
                taskId,
                preview: task.preview,
                currentStep: task.currentStep,
            });
        };
        // Wrap the send function to also emit preview updates to parent
        const wrappedSend = (event) => {
            send(event);
            if (event.type === "text") {
                accumulatedText += event.text;
                sendPreviewUpdate();
            }
            else if (event.type === "tool_start") {
                task.currentStep = `Running ${event.tool}...`;
                sendPreviewUpdate(true);
            }
            else if (event.type === "tool_done") {
                task.currentStep = "";
                sendPreviewUpdate(true);
            }
        };
        await runAgentLoop({
            engine,
            model,
            systemPrompt,
            tools,
            messages,
            actions: messageAwareActions,
            send: wrappedSend,
            signal,
            finalResponseGuard: createTaskMessageFinalGuard(taskId),
        });
    }, 
    // onComplete callback — called when the run finishes (success or error)
    async (run) => {
        // Prevent any in-flight sendPreviewUpdate from overwriting terminal status
        runFinished = true;
        if (run.status === "errored") {
            task.status = "errored";
            task.summary = accumulatedText.slice(-500) || "Task failed.";
            await saveTask(task);
            // Emit error as agent_task_complete with errored status
            opts.parentSend({
                type: "agent_task",
                taskId,
                threadId: thread.id,
                description: task.description,
                status: "errored",
            });
        }
        else {
            task.status = "completed";
            task.summary =
                accumulatedText.slice(-1000) || "Task completed successfully.";
            await saveTask(task);
            opts.parentSend({
                type: "agent_task_complete",
                taskId,
                summary: task.summary,
            });
        }
        // Persist the full conversation to threadData so the sub-agent tab
        // can restore it later (after the in-memory run is cleaned up).
        // Rebuild from run.events via buildAssistantMessage so partial text
        // streamed in an interrupted final iteration is preserved — the
        // EngineMessage[] array only picks up a turn after runAgentLoop
        // finishes pushing, so an aborted mid-stream would otherwise be lost.
        try {
            const { updateThreadData } = await import("../chat-threads/store.js");
            const userMsg = {
                id: `msg-${taskId}-user`,
                role: "user",
                content: [{ type: "text", text: opts.description }],
                metadata: {},
            };
            const assistantMsg = buildAssistantMessage(run.events ?? [], `task-${taskId}`);
            // Chain assistant → user via parentId so assistant-ui renders them
            // as a linked conversation, not orphaned siblings. headId points to
            // the leaf (assistant if present, otherwise the user message).
            const messages = [{ message: userMsg, parentId: null }];
            if (assistantMsg) {
                messages.push({
                    message: {
                        ...assistantMsg,
                        status: { type: "complete", reason: "stop" },
                    },
                    parentId: userMsg.id,
                });
            }
            const headId = assistantMsg?.id ?? userMsg.id;
            const repo = { headId, messages };
            const title = opts.description.slice(0, 100);
            const preview = accumulatedText.slice(0, 200);
            await updateThreadData(thread.id, JSON.stringify(repo), title, preview, repo.messages.length);
        }
        catch {
            // Best effort — the in-memory replay path still works
        }
        // ─── Auto-follow-up on parent thread ────────────────────────────
        // When the sub-agent finishes, start a short agent run on the
        // parent thread so the user sees a recap without having to scroll
        // up or manually check the sub-agent card.
        if (opts.parentThreadId) {
            try {
                const { getActiveRunForThread } = await import("../agent/run-manager.js");
                // Only auto-respond if the parent thread is idle — don't
                // interrupt an ongoing conversation.
                const activeRun = getActiveRunForThread(opts.parentThreadId);
                if (!activeRun || activeRun.status !== "running") {
                    const followUpEngine = opts.engine ?? createAnthropicEngine({ apiKey: opts.apiKey });
                    const followUpModel = opts.model ?? followUpEngine.defaultModel;
                    const statusEmoji = task.status === "errored" ? "!" : "done";
                    const notification = `[Sub-agent ${statusEmoji}] The sub-agent task "${task.description}" has ${task.status === "errored" ? "failed" : "completed"}.\n\n` +
                        `Summary of what it did:\n${task.summary}\n\n` +
                        `Briefly let the user know the sub-agent finished and highlight any key results. Be concise — 1-2 sentences.`;
                    const followUpRunId = `run-followup-${taskId}`;
                    startRun(followUpRunId, opts.parentThreadId, async (send, signal) => {
                        await runAgentLoop({
                            engine: followUpEngine,
                            model: followUpModel,
                            systemPrompt: opts.systemPrompt,
                            tools: [], // No tools needed for a recap
                            messages: [
                                {
                                    role: "user",
                                    content: [{ type: "text", text: notification }],
                                },
                            ],
                            actions: {},
                            send,
                            signal,
                        });
                    });
                }
            }
            catch {
                // Best effort — don't break the sub-agent completion
            }
        }
    });
    return task;
}
/** Get task by ID */
export async function getTask(taskId) {
    const task = await loadTask(taskId);
    return task ?? undefined;
}
/** Get task by thread ID */
export async function getTaskByThread(threadId) {
    const task = await loadTaskByThread(threadId);
    return task ?? undefined;
}
/** List all tasks (most recent first) */
export async function listTasks() {
    const entries = await listAppState(TASK_PREFIX);
    const tasks = entries.map((e) => e.value);
    return tasks.sort((a, b) => b.createdAt - a.createdAt);
}
export async function listAgentTeamBackgroundRuns() {
    return (await listTasks()).map(toAgentTaskBackgroundRun);
}
export async function getAgentTeamBackgroundRun(runId) {
    const task = await loadTask(taskIdFromBackgroundRunId(runId));
    return task ? toAgentTaskBackgroundRun(task) : null;
}
export async function listAgentTeamBackgroundTranscriptEvents(runId) {
    const normalizedRunId = taskRunId(taskIdFromBackgroundRunId(runId));
    const activeRun = getRun(normalizedRunId);
    const events = activeRun
        ? activeRun.events
        : await getPersistedRunEvents(normalizedRunId);
    return events
        .map((event) => toAgentTaskBackgroundTranscriptEvent(normalizedRunId, event))
        .filter((event) => Boolean(event));
}
export function subscribeToAgentTeamBackgroundRun(runId, fromSeq = 0) {
    return subscribeToRun(taskRunId(taskIdFromBackgroundRunId(runId)), fromSeq);
}
async function getPersistedRunEvents(runId) {
    const rows = await getRunEventsSince(runId, 0);
    return rows
        .map((row) => {
        try {
            return {
                seq: row.seq,
                event: JSON.parse(row.eventData),
            };
        }
        catch {
            return null;
        }
    })
        .filter((event) => Boolean(event));
}
/** Send a message/update to a running sub-agent via application state */
export async function sendToTask(taskId, message) {
    const task = await loadTask(taskId);
    if (!task)
        return { ok: false, error: "Task not found" };
    if (task.status !== "running")
        return { ok: false, error: "Task is not running" };
    if (message.trim().length === 0)
        return { ok: false, error: "Message is required" };
    // Append to a durable per-task queue. Running sub-agents drain this queue
    // after tool batches and immediately before a final response. This does not
    // interrupt an in-flight model stream or tool call; it guarantees the next
    // safe continuation sees the update.
    try {
        const queued = await appendQueuedTaskMessage(taskId, message);
        return { ok: true, ...queued };
    }
    catch {
        const sessionId = getRequestUserEmail();
        if (!sessionId)
            return { ok: false, error: "no authenticated user" };
        return { ok: false, error: "Unable to queue message" };
    }
}
export async function sendToAgentTeamBackgroundRun(runId, message) {
    return sendToTask(taskIdFromBackgroundRunId(runId), message);
}
async function sendAgentTeamBackgroundAgentFollowUp(input) {
    const prompt = input.prompt.trim();
    if (!prompt) {
        return {
            ok: false,
            runId: input.runId,
            run: await getAgentTeamBackgroundRun(input.runId),
            error: "Follow-up prompt is required.",
        };
    }
    const result = await sendToAgentTeamBackgroundRun(input.runId, prompt);
    return {
        ok: result.ok,
        runId: input.runId,
        run: await getAgentTeamBackgroundRun(input.runId),
        queued: result.ok,
        message: result.ok
            ? "Follow-up queued for the Agent Teams background run."
            : undefined,
        error: result.error,
    };
}
async function controlAgentTeamBackgroundAgentRun(input) {
    if (input.command !== "stop") {
        return {
            ok: false,
            runId: input.runId,
            run: await getAgentTeamBackgroundRun(input.runId),
            error: "Agent Teams background runs currently support stop through the shared controller.",
        };
    }
    const result = await stopAgentTeamBackgroundRun(input.runId);
    return {
        ok: result.ok,
        runId: input.runId,
        run: await getAgentTeamBackgroundRun(input.runId),
        message: result.ok ? "Agent Teams background run stopped." : undefined,
        error: result.error,
    };
}
export async function stopAgentTeamBackgroundRun(runId, reason = "user") {
    const taskId = taskIdFromBackgroundRunId(runId);
    const task = await loadTask(taskId);
    if (!task)
        return { ok: false, error: "Task not found" };
    if (task.status !== "running") {
        return { ok: false, error: "Task is not running" };
    }
    abortRun(taskRunId(taskId), reason);
    task.status = "errored";
    task.summary =
        reason === "user" ? "Task stopped." : `Task stopped: ${reason}`;
    await saveTask(task);
    return { ok: true };
}
/** Mark a task as errored */
export async function markTaskErrored(taskId, error) {
    const task = await loadTask(taskId);
    if (task) {
        task.status = "errored";
        task.summary = error;
        await saveTask(task);
    }
}
export const _agentTeamsQueueForTests = {
    createMessageAwareActions,
    createTaskMessageFinalGuard,
    drainQueuedTaskMessages,
    formatQueuedTaskMessages,
};
//# sourceMappingURL=agent-teams.js.map