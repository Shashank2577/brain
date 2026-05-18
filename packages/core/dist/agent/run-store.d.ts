/**
 * Max time without a heartbeat before a "running" run is considered dead.
 * The run-manager heartbeats every 1.5s, so 6s tolerates 3 missed writes.
 * Short window is what makes reload recovery feel instant instead of
 * stranding the user on "Thinking..." for up to 90s after a process death.
 */
export declare const RUN_STALE_MS = 6000;
export declare const STALE_RUN_ERROR_EVENT: {
    readonly type: "error";
    readonly error: "The agent stopped before it could finish. It may have hit a server timeout or the worker may have been interrupted.";
    readonly errorCode: "stale_run";
    readonly recoverable: true;
    readonly details: "The run heartbeat stopped while the run was still marked running. Partial output and tool calls were preserved when available.";
};
export declare function insertRun(id: string, threadId: string): Promise<void>;
/** Update the run's liveness heartbeat. Called periodically by run-manager. */
export declare function updateRunHeartbeat(runId: string): Promise<void>;
/**
 * Bump `last_progress_at` — call this whenever the agent actually emits an
 * event (token, tool call, message). Distinct from `heartbeat_at` so the
 * stuck-detector can tell "process alive but nothing happening" from
 * "process dead." Callers should throttle (run-manager debounces to ~1/s).
 */
export declare function bumpRunProgress(runId: string): Promise<void>;
/**
 * If the given run is marked "running" in SQL but its heartbeat is stale
 * (producer likely crashed), flip it to "errored" so watchers stop waiting.
 * Returns true if the row was reaped.
 */
export declare function reapIfStale(runId: string, maxStaleMs?: number): Promise<boolean>;
export declare function updateRunStatus(runId: string, status: "completed" | "errored" | "aborted"): Promise<void>;
export declare function markRunAborted(runId: string, reason?: string): Promise<void>;
export declare function isRunAborted(runId: string): Promise<boolean>;
export declare function getRunAbortState(runId: string): Promise<{
    aborted: boolean;
    reason?: string;
}>;
export declare function insertRunEvent(runId: string, seq: number, eventData: string): Promise<void>;
export declare function getRunEventsSince(runId: string, fromSeq: number): Promise<Array<{
    seq: number;
    eventData: string;
}>>;
export declare function getRunById(runId: string): Promise<{
    id: string;
    threadId: string;
    status: string;
    startedAt: number;
} | null>;
export declare function getRunByThread(threadId: string, options?: {
    includeTerminal?: boolean;
}): Promise<{
    id: string;
    threadId: string;
    status: string;
    startedAt: number;
    heartbeatAt: number | null;
    completedAt: number | null;
    lastProgressAt: number | null;
} | null>;
/**
 * Expire any "running" rows whose heartbeat is stale — producer died.
 * Safe to call at server startup on multi-isolate deployments: only rows
 * without a fresh heartbeat get reaped, so runs owned by OTHER live
 * isolates (which keep heartbeating) are left alone.
 */
export declare function reapAllStaleRuns(): Promise<number>;
/** Delete completed/errored runs older than the given threshold,
 *  and expire stale "running" rows that haven't had activity
 *  (e.g. worker crashed before updating status). */
export declare function cleanupOldRuns(olderThanMs: number): Promise<void>;
/**
 * Idempotently append a terminal event to a run's event stream. No-op if the
 * stream already ends in a terminal event. Used by reapers AND by SSE
 * reconnect paths that discover an `errored` run row with no terminal event
 * (e.g. an earlier reaper's silent `.catch(() => {})` swallowed the append).
 *
 * Persisting from the reconnect path is what keeps the system self-healing:
 * subsequent reconnects replay the proper terminal event from SQL instead of
 * synthesizing a fresh one each time.
 */
export declare function ensureTerminalRunEvent(runId: string, event: Record<string, unknown>): Promise<void>;
//# sourceMappingURL=run-store.d.ts.map