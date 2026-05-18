/** Status values for an integration pending task. */
export type PendingTaskStatus = "pending" | "processing" | "completed" | "failed";
export interface PendingTask {
    id: string;
    platform: string;
    externalThreadId: string;
    payload: string;
    ownerEmail: string;
    orgId: string | null;
    status: PendingTaskStatus;
    attempts: number;
    errorMessage: string | null;
    createdAt: number;
    updatedAt: number;
    completedAt: number | null;
}
/**
 * Insert a new pending task. Returns the generated task id.
 *
 * If `externalEventKey` is supplied, the unique index on
 * `(platform, external_event_key)` will reject duplicates — callers should
 * catch the resulting constraint-violation error and treat it as
 * "already enqueued" instead of a hard failure (H3 in the webhook security
 * audit). This is the SQL-backed replacement for the in-memory dedup map.
 */
export declare function insertPendingTask(input: {
    id: string;
    platform: string;
    externalThreadId: string;
    payload: string;
    ownerEmail: string;
    orgId?: string | null;
    externalEventKey?: string | null;
}): Promise<void>;
/**
 * Returns whether a duplicate-event error from `insertPendingTask` looks
 * like a unique-constraint violation on `(platform, external_event_key)`.
 *
 * Postgres surfaces these as `error.code === "23505"`, while SQLite uses
 * a substring match on the error text. Used by the webhook handler to
 * distinguish "already enqueued" (silently OK) from genuine insert failures.
 */
export declare function isDuplicateEventError(err: unknown): boolean;
/** Fetch a pending task by id. */
export declare function getPendingTask(id: string): Promise<PendingTask | null>;
/**
 * Atomically claim a task: transition pending → processing and increment
 * attempts. Returns the updated task if the transition succeeded, otherwise
 * null (e.g. the task was already claimed by a concurrent worker).
 */
export declare function claimPendingTask(id: string): Promise<PendingTask | null>;
/** Mark a task as completed. */
export declare function markTaskCompleted(id: string): Promise<void>;
/** Mark a task as failed and stash an error message. */
export declare function markTaskFailed(id: string, errorMessage: string): Promise<void>;
//# sourceMappingURL=pending-tasks-store.d.ts.map