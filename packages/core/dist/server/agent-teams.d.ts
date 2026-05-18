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
import type { ActionEntry } from "../agent/production-agent.js";
import type { AgentEngine } from "../agent/engine/types.js";
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
/** Send a message/update to a running sub-agent via application state */
export declare function sendToTask(taskId: string, message: string): Promise<{
    ok: boolean;
    error?: string;
}>;
/** Mark a task as errored */
export declare function markTaskErrored(taskId: string, error: string): Promise<void>;
//# sourceMappingURL=agent-teams.d.ts.map