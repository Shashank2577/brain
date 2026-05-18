/**
 * Application state helpers for use in scripts and actions.
 *
 * The session ID determines which user's application state is read/written.
 * Resolution order:
 *   1. Per-request context (AsyncLocalStorage) — set by the HTTP handler
 *   2. AGENT_USER_EMAIL env var — CLI scripts only
 *
 * The per-request context is critical in multi-user deployments: the env var
 * is process-global and gets overwritten by concurrent requests, so it cannot
 * reliably identify the caller. Only CLI scripts (single-user, no HTTP
 * context) should fall through to the env var.
 */
export declare function readAppState(key: string): Promise<Record<string, unknown> | null>;
export declare function writeAppState(key: string, value: Record<string, unknown>): Promise<void>;
export declare function deleteAppState(key: string): Promise<boolean>;
export declare function listAppState(prefix: string): Promise<Array<{
    key: string;
    value: Record<string, unknown>;
}>>;
export declare function deleteAppStateByPrefix(prefix: string): Promise<number>;
//# sourceMappingURL=script-helpers.d.ts.map