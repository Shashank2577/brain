import type { Task, Message, TaskState, Artifact } from "./types.js";
export declare function createTask(message: Message, contextId?: string, metadata?: Record<string, unknown>, ownerEmail?: string | null): Promise<Task>;
/**
 * Fetch the verified owner email recorded against a task at creation time.
 * Returns null when the task has no owner (legacy rows or unauthenticated
 * deployments) or when the task is missing.
 *
 * Used by `handleGet` / `handleCancel` to reject IDOR access — the JWT-
 * verified caller's email must match `owner_email` to read or cancel.
 */
export declare function getTaskOwner(id: string): Promise<string | null>;
/**
 * Atomically claim a task for processing. Only succeeds when the task is in
 * state 'submitted' or 'working' — flipping it to 'processing' so concurrent
 * processors can't pick it up twice. Returns the task if claimed, null if it
 * was already claimed/completed/missing.
 *
 * Used by the cross-platform async processor (`_process-task` route) to avoid
 * duplicate handler runs when retries fire.
 */
export declare function claimA2ATaskForProcessing(id: string): Promise<Task | null>;
export declare function getA2ATaskDispatchState(id: string): Promise<{
    id: string;
    statusState: string;
    metadata: Record<string, unknown> | undefined;
    updatedAt: number;
} | null>;
export declare function touchQueuedA2ATaskDispatch(id: string): Promise<boolean>;
export declare function touchProcessingA2ATask(id: string): Promise<boolean>;
export declare function resetStuckA2ATaskForRetry(id: string, processingCutoff: number): Promise<boolean>;
export declare function failStuckA2ATask(id: string, processingCutoff: number, reason: string): Promise<boolean>;
export declare function getTask(id: string): Promise<Task | null>;
export declare function updateTask(id: string, update: {
    state?: TaskState;
    message?: Message;
    artifacts?: Artifact[];
}): Promise<Task | null>;
export declare function updateTaskStatusMessage(id: string, message: Message): Promise<void>;
export declare function listTasks(contextId?: string): Promise<Task[]>;
//# sourceMappingURL=task-store.d.ts.map