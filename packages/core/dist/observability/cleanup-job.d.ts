/**
 * Observability span retention job.
 *
 * Periodically purges old `agent_trace_spans`, `agent_trace_summaries`, and
 * `agent_evals` rows so trace storage doesn't grow unbounded. Trace
 * metadata can include tool inputs that may contain sensitive values
 * (API keys, email content, file paths) when `captureToolArgs` is
 * enabled — see /tmp/security-audit/12-mcp-a2a-agent.md (MEDIUM #14).
 * Capping the storage horizon limits the blast radius of a misconfigured
 * deployment.
 *
 * Retention is configurable via the env var
 * `AGENT_NATIVE_TRACE_RETENTION_DAYS` (default: 30 days). Setting it to
 * `0` disables the cleanup (useful for dev / debugging only).
 *
 * The job runs once on startup (after a small delay so it doesn't compete
 * with bootstrap) and then on a 24-hour interval. Operators who need
 * tighter retention can shorten the env var; one daily sweep is enough
 * to keep storage bounded with day-grain granularity.
 */
/**
 * Run the trace cleanup once. Returns the per-table deletion counts.
 * Returns null if retention is disabled (`AGENT_NATIVE_TRACE_RETENTION_DAYS=0`).
 */
export declare function runTraceCleanupOnce(): Promise<{
    spans: number;
    summaries: number;
    evals: number;
} | null>;
/**
 * Start the recurring trace-cleanup job. Idempotent — calling more than
 * once is a no-op while a previous schedule is still active.
 *
 * Returns a stop function for tests / shutdown handlers.
 */
export declare function startTraceCleanupJob(): () => void;
export declare function stopTraceCleanupJob(): void;
//# sourceMappingURL=cleanup-job.d.ts.map