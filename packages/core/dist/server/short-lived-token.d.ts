/**
 * Short-lived HMAC-signed access tokens for media URLs.
 *
 * Used by clips and calls to mint a single-use bearer token after a password
 * gate passes, then bake `?t=<token>` into the video/blob URL handed to the
 * `<video>` element — instead of `?password=<plaintext>` (which ends up in
 * browser history, CDN logs, and Referer headers).
 *
 * Token shape: `<payloadB64Url>.<sigB64Url>`
 *   payload = base64url(JSON.stringify({ resourceId, viewerEmail?, exp }))
 *   sig     = base64url(HMAC-SHA256(payload, key))
 *
 * Key resolution mirrors `google-oauth.ts:getStateSigningKey`:
 *   1. OAUTH_STATE_SECRET (preferred — dedicated to short-lived signing)
 *   2. BETTER_AUTH_SECRET (already used as a server secret)
 *   3. In dev only, an ephemeral random key (per-process)
 *
 * In production, throws if neither secret is set.
 */
/**
 * Inputs for {@link signShortLivedToken}.
 */
export interface ShortLivedTokenClaims {
    /** Resource id the token authorises (recording id, call id, snippet id, …). */
    resourceId: string;
    /** Optional viewer email for audit / analytics — not used for authorisation. */
    viewerEmail?: string;
    /** Override default TTL (seconds). */
    ttlSeconds?: number;
}
/**
 * Result of {@link verifyShortLivedToken}. Discriminated by the literal
 * `ok` field so callers can `if (!result.ok) return …`.
 */
export type VerifyResult = {
    ok: true;
    viewerEmail?: string;
} | {
    ok: false;
    reason: string;
};
/**
 * Mint a signed token authorising read access to `claims.resourceId` until
 * `exp = now + ttl`. The result is safe to drop into a query string —
 * `?t=<token>` — and verified by {@link verifyShortLivedToken} on the
 * downstream route.
 */
export declare function signShortLivedToken(claims: ShortLivedTokenClaims): string;
/**
 * Verify a token previously produced by {@link signShortLivedToken}.
 *
 * Returns `{ ok: true, viewerEmail? }` only when:
 *  - the token has the expected shape (`<payload>.<sig>`),
 *  - the signature matches via constant-time comparison,
 *  - the token has not expired,
 *  - the embedded `resourceId` matches `expectedResourceId`.
 *
 * Otherwise returns `{ ok: false, reason: <error string> }`. Callers should
 * not surface the reason to viewers (it's useful for server-side logs only).
 */
export declare function verifyShortLivedToken(token: string, expectedResourceId: string): VerifyResult;
//# sourceMappingURL=short-lived-token.d.ts.map