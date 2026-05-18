/**
 * Framework-table store for the cross-app SSO ("Sign in with Agent-Native")
 * CLIENT side. Backs two pieces of the federated login round-trip:
 *
 *   - `identity_sso_state` — short-lived (10 min), single-use, crypto-random
 *     CSRF `state` values. Minted at `/_agent-native/identity/login`,
 *     consumed exactly once at `/_agent-native/identity/callback`. Carries an
 *     optional same-origin `return` path so the user lands back where they
 *     started after federated sign-in.
 *   - `identity_sso_jti` — replayed-token guard. The hub-issued identity JWT
 *     carries a random `jti`; the first callback that verifies a given `jti`
 *     records it here, and any later callback that presents the same `jti`
 *     is rejected. Best-effort: a DB blip never widens the trust boundary
 *     (signature + exp + scope + single-use state are still enforced), it
 *     only relaxes the extra replay gate.
 *
 * Mirrors `mcp/connect-store.ts`: lazy `ensureTable()`, `getDbExec()`,
 * dialect-agnostic SQL via `intType()`, `isConnectionError()` swallow so a
 * transient Neon WS drop never 500s. `CREATE TABLE IF NOT EXISTS` only —
 * strictly additive, never DROP / ALTER (shared prod DB rule).
 *
 * Node-only (crypto), bundled alongside the other framework auth modules.
 */
/**
 * Read + normalise `AGENT_NATIVE_IDENTITY_HUB_URL`. Returns `undefined`
 * (feature OFF) unless it is set to a syntactically valid http(s) URL. A
 * malformed value is treated as OFF rather than throwing, so a typo can
 * never brick an app's login — it just behaves as if SSO were unconfigured.
 */
export declare function getIdentityHubUrl(): string | undefined;
/**
 * Whether the federated-SSO client is active. When false, NOTHING in the
 * SSO module has any effect: the route 404s, the guard bypass is inert, the
 * login button is not rendered. This is the single switch the
 * env-unset-no-op invariant is asserted against.
 */
export declare function isIdentitySsoEnabled(): boolean;
/**
 * The conditional "Sign in with Agent-Native" entry injected into the login
 * page — ONLY when the feature is enabled. Returns an empty string when
 * disabled so the login HTML is byte-for-byte identical to today's output
 * with the env unset (asserted by the env-unset-no-op regression test). Pure
 * string builder, no I/O — safe to call during HTML render. Lives in this
 * leaf module so `onboarding-html.ts` can import it without creating an
 * `auth.ts` ↔ `identity-sso.ts` import cycle.
 */
export declare function identitySsoLoginButtonHtml(): string;
/** CSRF state values are valid for 10 minutes. */
export declare const SSO_STATE_TTL_MS: number;
/**
 * Rate limit for `identity/login`: at most this many state rows may be
 * created within `SSO_LOGIN_WINDOW_MS`. The endpoint is reachable without a
 * session (it's the entry point), so keep a coarse global cap to stop table
 * flooding without per-IP plumbing.
 */
export declare const SSO_LOGIN_MAX = 60;
export declare const SSO_LOGIN_WINDOW_MS = 60000;
/**
 * Mint a fresh crypto-random `state` value, persist it with an optional
 * same-origin return path, and return it. Rate-limited at creation: at most
 * `SSO_LOGIN_MAX` rows within `SSO_LOGIN_WINDOW_MS`. Throws `RATE_LIMITED`
 * when the cap is exceeded so the route can map it to a 429.
 */
export declare function createSsoState(returnPath: string | null): Promise<string>;
export interface SsoStateConsumeResult {
    ok: boolean;
    returnPath: string | null;
}
/**
 * Atomically consume a `state` value. Returns `{ ok: true, returnPath }` only
 * when the state existed, had not expired, and had not been consumed before —
 * and this call is the one that transitioned it to consumed (single-use,
 * enforced via a conditional UPDATE so a double callback can't both pass).
 * Any other condition returns `{ ok: false }`.
 */
export declare function consumeSsoState(state: string): Promise<SsoStateConsumeResult>;
/**
 * Returns true when the given identity-token `jti` has already been seen
 * (i.e. this is a replay). On the first sighting, records the `jti` and
 * returns false. Best-effort: a store/DB error returns `false` (not a
 * replay) so a transient Neon WS drop never blocks a legitimate first-time
 * sign-in — signature + exp + scope + single-use CSRF state remain the hard
 * gates; this only adds defence in depth against token replay.
 */
export declare function isJtiReplayed(jti: string | undefined): Promise<boolean>;
//# sourceMappingURL=identity-sso-store.d.ts.map