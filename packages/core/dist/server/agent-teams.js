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
import { startRun } from "../agent/run-manager.js";
import { runAgentLoop } from "../agent/production-agent.js";
import { buildAssistantMessage } from "../agent/thread-data-builder.js";
import { readAppState, writeAppState, listAppState, } from "../application-state/script-helpers.js";
import { getRequestUserEmail } from "./request-context.js";
/** Key prefix for task records: agent-task:{taskId} */
const TASK_PREFIX = "agent-task:";
/** Key prefix for thread→task reverse lookup: agent-task-thread:{threadId} */
const THREAD_PREFIX = "agent-task-thread:";
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
- Run \`search-files\` or \`list-files\` to find code
- Try to \`curl\` or access external URLs to find the app
- Use \`shell\` for exploration — only for running \`pnpm action\` commands when no direct action exists

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
    const tools = actionsToEngineTools(opts.actions);
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
            actions: opts.actions,
            send: wrappedSend,
            signal,
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
/** Send a message/update to a running sub-agent via application state */
export async function sendToTask(taskId, message) {
    const task = await loadTask(taskId);
    if (!task)
        return { ok: false, error: "Task not found" };
    if (task.status !== "running")
        return { ok: false, error: "Task is not running" };
    // Write the message to application state so the sub-agent can read it
    // on its next tool call or iteration
    try {
        const { appStatePut } = await import("../application-state/store.js");
        const sessionId = getRequestUserEmail();
        if (!sessionId) {
            return { ok: false, error: "no authenticated user" };
        }
        await appStatePut(sessionId, `task-message:${taskId}`, {
            from: "orchestrator",
            message,
            timestamp: Date.now(),
        });
    }
    catch {
        // Application state not available — best effort
    }
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
//# sourceMappingURL=agent-teams.js.map