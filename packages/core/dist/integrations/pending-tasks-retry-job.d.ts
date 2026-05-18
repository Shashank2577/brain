/**
 * One pass: find stuck tasks and re-fire the processor for each.
 * Exported for tests and for manual triggers.
 */
export declare function retryStuckPendingTasks(webhookBaseUrl?: string): Promise<void>;
/**
 * Start the periodic retry loop. Safe to call multiple times — second call
 * is a no-op.
 */
export declare function startPendingTasksRetryJob(options?: {
    webhookBaseUrl?: string;
}): void;
/** Stop the retry loop. */
export declare function stopPendingTasksRetryJob(): void;
//# sourceMappingURL=pending-tasks-retry-job.d.ts.map