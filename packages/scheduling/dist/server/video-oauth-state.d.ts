/**
 * Mint a fresh signed state value bound to the current authenticated user
 * and the requested OAuth `kind`.
 */
export declare function signVideoOAuthState(opts: {
    kind: string;
    userEmail: string;
}): string;
/**
 * Verify a state value returned from the OAuth provider matches one
 * minted by `signVideoOAuthState` for the same authenticated user.
 *
 * Returns `true` only when:
 *   1. The state has the expected shape
 *   2. The HMAC matches (kind + user-email + secret)
 *   3. The state is not older than STATE_TTL_MS
 *
 * Uses `crypto.timingSafeEqual` to prevent timing-based recovery of the
 * signature.
 */
export declare function verifyVideoOAuthState(opts: {
    state: string | undefined | null;
    kind: string;
    userEmail: string;
    /** Override default 10-minute TTL (for tests). */
    ttlMs?: number;
}): boolean;
//# sourceMappingURL=video-oauth-state.d.ts.map