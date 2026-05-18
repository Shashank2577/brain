/**
 * Per-thread chat run health, derived from the durable `last_progress_at`
 * timestamp on the server. Drives the user-visible "this chat looks stuck"
 * affordance — distinct from the silent reconnect logic in
 * `agent-chat-adapter.ts`, which keeps trying in the background. When
 * automatic recovery isn't making progress (for whatever reason), this
 * hook surfaces a Retry / Cancel button to the user instead of leaving
 * them staring at a frozen spinner.
 */
export interface RunStuckState {
    /** True when an active run hasn't emitted an event for `stuckThresholdMs`. */
    isStuck: boolean;
    /** ID of the active run, or null when nothing is in flight. */
    runId: string | null;
    /** Server-side run status ("running" / "completed" / "errored" / etc.). */
    status: string | null;
    /** Server timestamp (ms) of the last emitted event, or null if none yet. */
    lastProgressAt: number | null;
    /** Milliseconds since `lastProgressAt`, or null. */
    stuckSinceMs: number | null;
    /** Server timestamp (ms) of the last process-alive heartbeat. */
    heartbeatAt: number | null;
}
export interface UseRunStuckDetectionOptions {
    /** The thread to monitor. Pass null/undefined to disable polling. */
    threadId: string | null | undefined;
    /**
     * Threshold above which an in-flight run is considered stuck. The default
     * sits comfortably above the adapter's 75s no-progress reconnect — by then
     * automatic recovery has already had its chance.
     */
    stuckThresholdMs?: number;
    /** Poll interval. Default 5_000ms. */
    pollIntervalMs?: number;
    /** API base path. Default `/_agent-native/agent-chat`. */
    apiUrl?: string;
}
export declare function useRunStuckDetection({ threadId, stuckThresholdMs, pollIntervalMs, apiUrl, }: UseRunStuckDetectionOptions): RunStuckState;
/**
 * POST `/runs/:id/abort` so the server flips the run to "aborted" and the
 * adapter's reconnect loop exits cleanly. Returns the run id that was
 * aborted (or null on failure) so callers can correlate observability
 * events. Best-effort — failures are swallowed, since the user's intent
 * is already captured locally.
 */
export declare function useAbortRun(apiUrl?: string): (runId: string, reason?: string) => Promise<string | null>;
//# sourceMappingURL=use-run-stuck-detection.d.ts.map