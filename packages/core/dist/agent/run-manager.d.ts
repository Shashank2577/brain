import type { AgentChatEvent, RunEvent, RunStatus } from "./types.js";
export interface ActiveRun {
    runId: string;
    threadId: string;
    events: RunEvent[];
    status: RunStatus;
    subscribers: Set<(event: RunEvent) => void>;
    abort: AbortController;
    abortReason?: string;
    startedAt: number;
}
/** Default run chunk budget for hosted/serverless deploys. */
export declare const DEFAULT_HOSTED_RUN_SOFT_TIMEOUT_MS = 55000;
/** Default SQL retention for completed/errored run event logs (24 hours). */
export declare const DEFAULT_COMPLETED_RUN_RETENTION_MS: number;
/**
 * How recently a terminal run must have started for `/runs/active` to surface
 * it. Reconnect after this window won't replay the run — typical real-world
 * disconnects resolve in seconds, so 10 minutes is generous while keeping us
 * from resurrecting ancient turns when the user reopens an old thread.
 */
export declare const TERMINAL_RUN_RECONNECT_WINDOW_MS: number;
export interface StartRunOptions {
    /** Optional internal run chunk budget. When reached, the framework emits an
     * auto-continuation signal instead of a user-facing timeout. Leave unset for
     * no framework-imposed run timeout. */
    softTimeoutMs?: number;
    /** Opt into the hosted/serverless default chunk budget. Only callers with
     * automatic continuation support should enable this. */
    useHostedSoftTimeoutDefault?: boolean;
}
export interface ResolveRunSoftTimeoutOptions {
    useHostedDefault?: boolean;
}
export declare function resolveRunSoftTimeoutMs(overrideMs?: number, options?: ResolveRunSoftTimeoutOptions): number;
export declare function resolveCompletedRunRetentionMs(): number;
/**
 * Start a new agent run in the background.
 * `runFn` receives a `send` callback and an `AbortSignal`.
 * The run continues even if all SSE subscribers disconnect.
 *
 * Events are persisted to SQL for cross-isolate access (Cloudflare Workers).
 */
export declare function startRun(runId: string, threadId: string, runFn: (send: (event: AgentChatEvent) => void, signal: AbortSignal) => Promise<void>, onComplete?: (run: ActiveRun) => void | Promise<void>, options?: StartRunOptions): ActiveRun;
/**
 * Subscribe to a run's events starting from `fromSeq`.
 * Returns a ReadableStream that replays buffered events then live-tails.
 * Cancelling the stream only unsubscribes — does NOT abort the agent.
 *
 * Falls back to SQL polling when the run is not in local memory
 * (cross-isolate reconnection on Workers).
 */
export declare function subscribeToRun(runId: string, fromSeq: number): ReadableStream<Uint8Array> | null;
/** Get the active run for a thread (if any) — checks memory then SQL */
export declare function getActiveRunForThread(threadId: string): ActiveRun | null;
/**
 * Async version that also checks SQL — for cross-isolate access.
 * Used by the /runs/active endpoint.
 *
 * Returns `heartbeatAt` so the client can independently decide a run is
 * dead even before the server-side stale reap has fired. Returns
 * `lastProgressAt` so the client-side stuck-detector can show a
 * user-visible "this chat looks stuck" affordance when a run is alive
 * (heartbeating) but not actually emitting events.
 */
export declare function getActiveRunForThreadAsync(threadId: string): Promise<{
    runId: string;
    threadId: string;
    status: string;
    heartbeatAt: number;
    lastProgressAt: number | null;
} | null>;
/** Get a run by ID */
export declare function getRun(runId: string): ActiveRun | null;
/** Explicitly abort a run (e.g. Stop button) */
export declare function abortRun(runId: string, reason?: string): boolean;
//# sourceMappingURL=run-manager.d.ts.map