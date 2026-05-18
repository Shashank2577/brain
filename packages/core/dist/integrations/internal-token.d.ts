/**
 * Sign an internal token for a given task id. Format: `<timestamp>.<sig>`,
 * where sig = HMAC_SHA256(A2A_SECRET, taskId + ":" + timestamp). Tokens are
 * short-lived (5 minutes) and bound to a specific task id, so even if a
 * token leaks it can only re-trigger that one task's processor.
 */
export declare function signInternalToken(taskId: string): string;
/**
 * Verify an internal token against a task id. Returns true if the token is
 * authentic, unexpired, and bound to this task id.
 */
export declare function verifyInternalToken(taskId: string, token: string): boolean;
/**
 * Pull a Bearer token from an Authorization header value.
 * Returns null if the header is missing or malformed.
 */
export declare function extractBearerToken(authHeader: string | undefined): string | null;
//# sourceMappingURL=internal-token.d.ts.map