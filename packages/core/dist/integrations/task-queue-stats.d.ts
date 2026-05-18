export interface RecentFailure {
    id: string;
    platform: string;
    error: string;
    attempts: number;
}
export interface TaskQueueStats {
    pending: number;
    processing: number;
    completed_last_hour: number;
    failed_last_hour: number;
    oldest_pending_age_seconds: number;
    recent_failures: RecentFailure[];
}
/**
 * Get a snapshot of the integration task queue health.
 *
 * Returns zeros if the table doesn't exist yet — safe to call before the
 * pending-tasks store has initialised the schema.
 */
export declare function getTaskQueueStats(): Promise<TaskQueueStats>;
//# sourceMappingURL=task-queue-stats.d.ts.map