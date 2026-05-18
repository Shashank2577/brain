/**
 * Framework-table store for the "connect external agents" feature.
 *
 * Two additive, dialect-agnostic tables back the browser **Connect** page and
 * the OAuth-style **device-code flow** a CLI drives:
 *
 *   - `mcp_connect_tokens`  — one row per minted MCP token. We never store the
 *     token value (it's a signed JWT); only its `jti` so revocation is a
 *     SQL lookup. Revoking sets `revoked_at`; the row is never deleted.
 *   - `mcp_device_codes`    — short-lived (10 min) device/user code pairs for
 *     the OAuth 2.0 device-authorization-style CLI flow. Single-use
 *     (`consumed_at`), rate-limited at creation.
 *
 * Mirrors `application-state/store.ts`: lazy `ensureTable()`, `getDbExec()`,
 * `isPostgres()` dialect branching for upserts, `isConnectionError()` swallow
 * so a transient Neon WS drop never 500s. `CREATE TABLE IF NOT EXISTS` only —
 * strictly additive, never DROP / ALTER (shared prod DB rule).
 */
/**
 * Scope claim that marks a connect-minted token (vs. an ordinary A2A
 * delegation JWT). Only tokens carrying this scope go through the revoke
 * lookup in `verifyAuth` — defined here so both `connect-route.ts` and
 * `build-server.ts` import it from the leaf store without a cycle.
 */
export declare const MCP_CONNECT_SCOPE = "mcp-connect";
/** Device codes are valid for 10 minutes. */
export declare const DEVICE_CODE_TTL_MS: number;
/** Default minted-token lifetime. Configurable per-request 1–365 days. */
export declare const DEFAULT_TOKEN_TTL_DAYS = 90;
export declare const MIN_TOKEN_TTL_DAYS = 1;
export declare const MAX_TOKEN_TTL_DAYS = 365;
/**
 * Rate limit for `device/start`: at most this many device codes may be created
 * within `DEVICE_START_WINDOW_MS`. Unauthenticated endpoint — keep it tight so
 * a hostile client can't flood the table or brute-force user codes.
 */
export declare const DEVICE_START_MAX = 20;
export declare const DEVICE_START_WINDOW_MS = 60000;
export interface MintedTokenRow {
    id: string;
    jti: string;
    ownerEmail: string;
    orgId: string | null;
    label: string | null;
    createdAt: number | null;
    lastUsedAt: number | null;
    revokedAt: number | null;
}
/**
 * Persist a record of a minted token. The token value itself (a signed JWT)
 * is NEVER stored — only its `jti`, so revocation is a cheap SQL lookup.
 */
export declare function recordMintedToken(params: {
    jti: string;
    ownerEmail: string;
    orgId?: string | null;
    label?: string | null;
}): Promise<string>;
/**
 * Returns true when the given `jti` corresponds to a token that has been
 * revoked. Fails OPEN on a store/DB error: a transient Neon WS drop must not
 * lock every connected agent out. Signature verification is unaffected — this
 * is only the post-verify revoke check (see `verifyAuth` in build-server.ts).
 */
export declare function isJtiRevoked(jti: string): Promise<boolean>;
export declare function listTokens(ownerEmail: string): Promise<MintedTokenRow[]>;
/**
 * Revoke a token, but ONLY if it is owned by `ownerEmail` (the caller). The
 * `owner_email = ?` predicate is the access scope — a caller can never revoke
 * another user's token. Idempotent: re-revoking keeps the first timestamp.
 * Returns true when a row was actually transitioned to revoked.
 */
export declare function revokeToken(ownerEmail: string, id: string): Promise<boolean>;
/**
 * Best-effort: stamp `last_used_at` for a token. Swallows all errors — this is
 * pure telemetry and must never affect the auth path.
 */
export declare function touchTokenUsed(jti: string): Promise<void>;
export interface DeviceCodeRow {
    deviceCode: string;
    userCode: string;
    ownerEmail: string | null;
    orgId: string | null;
    status: "pending" | "approved" | "minting" | "consumed" | "expired";
    tokenJti: string | null;
    createdAt: number | null;
    expiresAt: number | null;
    consumedAt: number | null;
}
/**
 * Create a new device+user code pair. Rate-limited: at most
 * `DEVICE_START_MAX` codes within `DEVICE_START_WINDOW_MS`. The window count
 * is a coarse global cap (this endpoint is unauthenticated) — enough to stop
 * table flooding / user-code brute force without per-IP plumbing.
 *
 * Throws `RATE_LIMITED` when the cap is exceeded so the route can map it to a
 * 429.
 */
export declare function createDeviceCode(): Promise<DeviceCodeRow>;
export declare function getDeviceCode(deviceCode: string): Promise<DeviceCodeRow | null>;
export declare function getDeviceCodeByUserCode(userCode: string): Promise<DeviceCodeRow | null>;
/**
 * Bind the logged-in user (email + org) to a pending device code, identified
 * by its human-typable `user_code`. Only transitions a non-expired, still
 * `pending` row. Returns the bound row, or a string error code:
 *   - `not_found`  — no such user_code
 *   - `expired`    — past its TTL
 *   - `already`    — already approved/consumed (not re-bindable)
 */
export declare function approveDeviceCode(userCode: string, ownerEmail: string, orgId: string | null): Promise<DeviceCodeRow | "not_found" | "expired" | "already">;
/**
 * Atomically transition an approved device code to consumed and stamp the
 * minted token's jti. Single-use: only succeeds when the row is currently
 * `approved` (not already consumed). Returns the pre-consume row on success,
 * or null when it could not be consumed (already consumed / not approved /
 * gone). The caller mints the token only after this returns a row.
 */
export declare function consumeDeviceCode(deviceCode: string, tokenJti: string): Promise<DeviceCodeRow | null>;
/**
 * Claim an approved device code for token minting without making it terminal.
 * If signing or token recording fails, callers release this back to approved
 * so the CLI can retry the poll instead of being stuck at "consumed".
 */
export declare function claimDeviceCodeForMint(deviceCode: string, tokenJti: string): Promise<DeviceCodeRow | null>;
export declare function finishDeviceCodeMint(deviceCode: string, tokenJti: string): Promise<boolean>;
export declare function releaseDeviceCodeMint(deviceCode: string, tokenJti: string): Promise<void>;
/**
 * Best-effort: flip an expired, still-pending/approved row to `expired` so
 * the poll endpoint can report a clean terminal state. Swallows errors.
 */
export declare function expireDeviceCode(deviceCode: string): Promise<void>;
//# sourceMappingURL=connect-store.d.ts.map