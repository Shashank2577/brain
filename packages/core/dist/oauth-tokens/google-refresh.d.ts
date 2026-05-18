/**
 * Proactive Google OAuth token refresh.
 *
 * Templates already refresh tokens reactively in their `getValidAccessToken`
 * helpers — but that only runs when an action makes an API call. If the user
 * is idle for an hour, the next call pays the refresh latency, and any error
 * surfaces as a user-facing failure.
 *
 * This module scans the `oauth_tokens` table on a timer and refreshes any
 * token that's within `expiryBufferMs` of expiring. Templates opt in via a
 * server plugin (see `templates/mail/server/plugins/oauth-refresh.ts`).
 */
/**
 * Scan all stored Google tokens and refresh any expiring within `bufferMs`.
 * Errors per-account are logged and swallowed so one bad token doesn't block
 * the rest.
 */
export declare function refreshExpiringGoogleTokens(opts?: {
    bufferMs?: number;
}): Promise<void>;
/**
 * Start the refresh loop. Idempotent — calling more than once is a no-op,
 * so multiple plugins/templates loading this in the same process are safe.
 */
export declare function startGoogleTokenRefreshLoop(opts?: {
    /** How often to scan. Default: 20 minutes. */
    intervalMs?: number;
    /** Refresh tokens expiring within this window. Default: 15 minutes. */
    bufferMs?: number;
}): void;
//# sourceMappingURL=google-refresh.d.ts.map