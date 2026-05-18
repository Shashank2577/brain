/**
 * Org-directory discovery for the generic cross-app MCP verbs
 * (`list_apps` / `ask_app` in `builtin-tools.ts`).
 *
 * Phase 3b of cross-app auto-wiring. Today the cross-app verbs resolve sibling
 * apps from *local workspace* info only (`workspace-resolve.ts`), so the mail
 * agent can only reach the calendar agent in a local dev workspace. When the
 * deployment runs against an org directory (Dispatch is also the identity hub
 * for the org), this module discovers the org's *deployed* sibling apps so the
 * same verbs work cross-app in production with ZERO manual setup.
 *
 * ## The directory request
 *
 *   GET  <directoryOrigin>/_agent-native/org/apps
 *   Auth Authorization: Bearer <org A2A token>   (same signed token A2A peers
 *        already mint — reuses `resolveA2ACallerAuth()`; the org A2A secret /
 *        global `A2A_SECRET` is loaded exactly how outgoing A2A calls load it)
 *   ⇒    { org, apps: [ { id, name, url, a2aUrl, capabilities? } ] }
 *        (allow-listed first-party apps only, prod URLs — enforced by the
 *         authority side, Phase 3a, on Dispatch)
 *
 * ## Resolution + safety model
 *
 *   - The directory origin is read from env: `AGENT_NATIVE_ORG_DIRECTORY_URL`
 *     (dedicated) or `AGENT_NATIVE_IDENTITY_HUB_URL` (Dispatch is also the
 *     identity hub). When *neither* is set the feature is simply inactive —
 *     `fetchOrgApps()` returns `[]` and nothing changes anywhere (asserted by
 *     a test). This makes the whole feature opt-in and back-compat.
 *   - On ANY error (no env, unreachable, 401, non-2xx, bad JSON, no signed
 *     token) `fetchOrgApps()` returns `[]` and NEVER throws — the cross-app
 *     verbs degrade silently to their exact current local-only behavior.
 *   - A short in-memory TTL cache (default 60s) keyed by directory origin and
 *     caller identity/org scope so sibling app lists never cross tenants.
 *     Empty authenticated results are cached too (with a shorter TTL) so a
 *     transient failure doesn't hammer the directory on every call.
 *   - No secrets are ever logged.
 *
 * Bundled alongside `mountMCP` (no Node-only top-level imports). The A2A
 * caller-auth + a2a client are dynamically imported inside `fetchOrgApps()`.
 */
export interface OrgApp {
    /** Canonical app id, e.g. `calendar`. */
    id: string;
    /** Human-readable name, e.g. `Calendar`. */
    name: string;
    /** Deployed app origin/URL, e.g. `https://calendar.acme.com`. */
    url: string;
    /**
     * A2A endpoint to route `ask_app` to. The authority side returns this; we
     * fall back to the app `url` (the A2A client appends `/_agent-native/a2a`).
     */
    a2aUrl: string;
    /** Optional capability hints the authority side may include. */
    capabilities?: string[];
}
/**
 * Resolve the org-directory origin from env. Returns `null` when neither env
 * var is set — the caller treats `null` as "feature inactive".
 *
 * `env` is injectable for tests; defaults to `process.env`.
 */
export declare function resolveOrgDirectoryOrigin(env?: NodeJS.ProcessEnv): string | null;
/**
 * Fetch the org's first-party sibling apps from the org directory.
 *
 * - Returns `[]` (never throws) on ANY failure or when the directory env is
 *   unset — the cross-app verbs then keep their exact local-only behavior.
 * - Short in-memory TTL cache so it isn't fetched on every tool call.
 * - Strips the current app from the result (compared by id and by origin) so
 *   `list_apps` / `ask_app` never offer to route to themselves.
 *
 * @param opts.selfId      Current app id (so it's stripped from the result).
 * @param opts.selfOrigin  Current app origin (so it's stripped by origin too).
 * @param opts.env         Injectable env (tests). Defaults to `process.env`.
 */
export declare function fetchOrgApps(opts?: {
    selfId?: string;
    selfOrigin?: string;
    env?: NodeJS.ProcessEnv;
}): Promise<OrgApp[]>;
/** Test-only: clear the in-memory cache between cases. */
export declare function _resetOrgDirectoryCache(): void;
//# sourceMappingURL=org-directory.d.ts.map