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
import type { AgentChatEvent } from "../agent/types.js";
import type { ActionEntry, AgentLoopFinalResponseGuard } from "../agent/production-agent.js";
import type { AgentEngine } from "../agent/engine/types.js";
import type { RunEvent } from "../agent/types.js";
import type { BackgroundAgentRun, BackgroundAgentRunStatus, BackgroundAgentTranscriptEvent } from "../code-agents/background-run.js";
import type { BackgroundAgentController } from "../code-agents/index.js";
export interface AgentTask {
    taskId: string;
    threadId: string;
    description: string;
    status: "running" | "completed" | "errored";
    preview: string;
    summary: string;
    currentStep: string;
    createdAt: number;
}
export type AgentTeamBackgroundRun = Omit<BackgroundAgentRun, "kind" | "source" | "sourceRecord" | "status" | "cwd" | "goalId" | "transcriptPath" | "artifactRoot"> & {
    kind: "agent-team";
    source: "hosted-agent-team";
    sourceRecord: {
        type: "agent-team-task";
        id: string;
        threadId: string;
    };
    status: BackgroundAgentRunStatus;
    cwd?: string;
    goalId: "agent-team";
    transcriptPath?: string;
    artifactRoot?: string;
};
export type AgentTeamBackgroundTranscriptEvent = Omit<BackgroundAgentTranscriptEvent, "kind" | "source" | "sourceRecord"> & {
    kind: "user" | "system" | "note" | "artifact" | "status";
    source: "hosted-agent-team";
    sourceRecord: {
        type: "agent-team-run-event";
        id: string;
        seq: number;
    };
};
export interface SendToAgentTeamBackgroundRunResult {
    ok: boolean;
    error?: string;
    messageId?: string;
    queuedCount?: number;
}
export interface ControlAgentTeamBackgroundRunResult {
    ok: boolean;
    error?: string;
}
export declare function createAgentTeamBackgroundAgentController(): BackgroundAgentController;
export declare const agentTeamBackgroundAgentController: BackgroundAgentController;
export interface QueuedTaskMessage {
    id: string;
    from: "orchestrator";
    message: string;
    timestamp: number;
}
declare function formatQueuedTaskMessages(messages: QueuedTaskMessage[]): string;
declare function drainQueuedTaskMessages(taskId: string): Promise<QueuedTaskMessage[]>;
declare function createMessageAwareActions(taskId: string, actions: Record<string, ActionEntry>): Record<string, ActionEntry>;
declare function createTaskMessageFinalGuard(taskId: string): AgentLoopFinalResponseGuard;
export declare function toAgentTaskBackgroundRun(task: AgentTask): AgentTeamBackgroundRun;
export declare function toAgentTaskBackgroundTranscriptEvent(runId: string, event: RunEvent): AgentTeamBackgroundTranscriptEvent | null;
export interface SpawnTaskOptions {
    /** Description of what the sub-agent should do */
    description: string;
    /** Additional instructions scoped to this sub-agent */
    instructions?: string;
    /** Model to use (e.g. "claude-haiku-4-5"). Uses default if omitted */
    model?: string;
    /** The owner email for thread creation */
    ownerEmail: string;
    /** The system prompt base for the sub-agent */
    systemPrompt: string;
    /** Available actions for the sub-agent */
    actions: Record<string, ActionEntry>;
    /** Agent engine to use. Falls back to creating an Anthropic engine with apiKey. */
    engine?: AgentEngine;
    /** API key for Anthropic (used only if engine is not provided) */
    apiKey?: string;
    /** Callback to emit events to the parent chat stream */
    parentSend: (event: AgentChatEvent) => void;
    /** Parent thread ID — used to auto-respond when the sub-agent finishes */
    parentThreadId?: string;
}
/**
 * Spawn a sub-agent task. Creates a thread, starts a background agent run,
 * and emits agent_task events to the parent chat stream.
 */
export declare function spawnTask(opts: SpawnTaskOptions): Promise<AgentTask>;
/** Get task by ID */
export declare function getTask(taskId: string): Promise<AgentTask | undefined>;
/** Get task by thread ID */
export declare function getTaskByThread(threadId: string): Promise<AgentTask | undefined>;
/** List all tasks (most recent first) */
export declare function listTasks(): Promise<AgentTask[]>;
export declare function listAgentTeamBackgroundRuns(): Promise<AgentTeamBackgroundRun[]>;
export declare function getAgentTeamBackgroundRun(runId: string): Promise<AgentTeamBackgroundRun | null>;
export declare function listAgentTeamBackgroundTranscriptEvents(runId: string): Promise<AgentTeamBackgroundTranscriptEvent[]>;
export declare function subscribeToAgentTeamBackgroundRun(runId: string, fromSeq?: number): ReadableStream<Uint8Array> | null;
/** Send a message/update to a running sub-agent via application state */
export declare function sendToTask(taskId: string, message: string): Promise<{
    ok: boolean;
    error?: string;
    messageId?: string;
    queuedCount?: number;
}>;
export declare function sendToAgentTeamBackgroundRun(runId: string, message: string): Promise<SendToAgentTeamBackgroundRunResult>;
export declare function stopAgentTeamBackgroundRun(runId: string, reason?: string): Promise<ControlAgentTeamBackgroundRunResult>;
/** Mark a task as errored */
export declare function markTaskErrored(taskId: string, error: string): Promise<void>;
export declare const _agentTeamsQueueForTests: {
    createMessageAwareActions: typeof createMessageAwareActions;
    createTaskMessageFinalGuard: typeof createTaskMessageFinalGuard;
    drainQueuedTaskMessages: typeof drainQueuedTaskMessages;
    formatQueuedTaskMessages: typeof formatQueuedTaskMessages;
};
export {};
//# sourceMappingURL=agent-teams.d.ts.map