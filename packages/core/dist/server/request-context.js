/**
 * Per-request context using AsyncLocalStorage.
 *
 * Replaces the unsafe pattern of mutating `process.env.AGENT_USER_EMAIL` /
 * `process.env.AGENT_ORG_ID` on every request. On Node.js (Netlify, self-hosted)
 * concurrent requests would overwrite each other's env vars. AsyncLocalStorage
 * gives each async call-chain its own isolated context.
 *
 * Supported on all deployment targets:
 * - Node.js (native)
 * - Cloudflare Workers (via nodejs_compat flag)
 * - Deno Deploy (via node:async_hooks compat)
 *
 * For CLI scripts that run outside a request context, the getters fall back to
 * process.env so existing `AGENT_USER_EMAIL=x pnpm action foo` invocations
 * continue to work.
 */
import { AsyncLocalStorage } from "node:async_hooks";
const GLOBAL_KEY = "__agentNativeRequestContextAls";
const OBSERVERS_KEY = "__agentNativeRequestContextObservers";
const globalRef = globalThis;
if (!globalRef[GLOBAL_KEY]) {
    globalRef[GLOBAL_KEY] = new AsyncLocalStorage();
}
if (!globalRef[OBSERVERS_KEY]) {
    globalRef[OBSERVERS_KEY] = [];
}
const als = globalRef[GLOBAL_KEY];
const observers = globalRef[OBSERVERS_KEY];
/**
 * Register a callback fired every time `runWithRequestContext` enters a new
 * scope. The hook runs INSIDE the AsyncLocalStorage scope, so observability
 * helpers that read the current isolation scope (e.g. Sentry) attach to the
 * right per-request context.
 *
 * Returned function unregisters the observer. Observers must never throw —
 * any error is swallowed so a misbehaving observer can't break the request
 * path.
 */
export function addRequestContextObserver(observer) {
    observers.push(observer);
    return () => {
        const i = observers.indexOf(observer);
        if (i !== -1)
            observers.splice(i, 1);
    };
}
/**
 * Run a callback within a per-request context. The context is available to all
 * async operations spawned from `fn` via `getRequestUserEmail()` / `getRequestOrgId()`.
 *
 * Any registered `addRequestContextObserver` callbacks fire inside the new
 * scope before `fn` runs, so observability code can pin user/org info onto
 * isolation-scoped backends (Sentry, OpenTelemetry, etc.).
 */
export function runWithRequestContext(ctx, fn) {
    return als.run(ctx, () => {
        if (observers.length > 0) {
            for (const obs of observers) {
                try {
                    obs(ctx);
                }
                catch {
                    // Observers must never break the request path.
                }
            }
        }
        return fn();
    });
}
/**
 * Return the active request context, if this call chain is running under one.
 *
 * This is intentionally distinct from `getRequestUserEmail()`: callers that
 * have an active context with no authenticated user must not fall through to
 * process-wide CLI fallbacks such as `AGENT_USER_EMAIL` or "latest session".
 */
export function getRequestContext() {
    return als.getStore();
}
/**
 * True when AsyncLocalStorage has an active context for this call chain.
 * Useful for helpers that support both HTTP requests and standalone CLI runs.
 */
export function hasRequestContext() {
    return als.getStore() !== undefined;
}
/**
 * Get the current request's user email.
 *
 * - If a request context exists (HTTP/A2A path), returns its `userEmail` —
 *   even when that value is `undefined`. The env fallback MUST NOT fire here:
 *   a stale process-wide `AGENT_USER_EMAIL` from a CLI run or previous bug
 *   would leak into an unauthenticated A2A/API call (e.g. unsigned or API-key
 *   modes where `runWithRequestContext({ userEmail: undefined })` is used).
 * - Only when there is NO request context (CLI scripts) do we fall back to
 *   `process.env.AGENT_USER_EMAIL`.
 */
export function getRequestUserEmail() {
    const store = als.getStore();
    if (store !== undefined)
        return store.userEmail;
    return process.env.AGENT_USER_EMAIL;
}
/**
 * Get the current request's display name, when the auth provider supplied one.
 *
 * The same request-context fallback rules as `getRequestUserEmail()` apply:
 * HTTP/A2A calls only read AsyncLocalStorage, while CLI scripts may opt in via
 * `AGENT_USER_NAME`.
 */
export function getRequestUserName() {
    const store = als.getStore();
    if (store !== undefined)
        return store.userName;
    return process.env.AGENT_USER_NAME;
}
/**
 * Get the current request's org ID.
 *
 * Same store-aware semantics as `getRequestUserEmail()` — env fallback is
 * CLI-only, so a request that explicitly has no org doesn't inherit a stale
 * `process.env.AGENT_ORG_ID` from a prior request on the same Lambda instance.
 */
export function getRequestOrgId() {
    const store = als.getStore();
    if (store !== undefined)
        return store.orgId;
    return process.env.AGENT_ORG_ID;
}
/**
 * Get the current request's IANA timezone (e.g. "America/Los_Angeles").
 * The UI sends this via the `x-user-timezone` header on every action call, and
 * the agent chat plugin propagates it into the request context so that
 * agent-initiated tool calls also see the user's timezone. Falls back to
 * `process.env.AGENT_USER_TIMEZONE` only for CLI scripts (no request context).
 */
export function getRequestTimezone() {
    const store = als.getStore();
    if (store !== undefined)
        return store.timezone;
    return process.env.AGENT_USER_TIMEZONE;
}
/**
 * Returns true when this request is on an integration-platform path (Slack,
 * Telegram, etc.) — i.e. we're inside the integration plugin's processor
 * function and the platform's deliver-by deadline plus the host's function
 * timeout are the binding budget. Non-integration callers (CLI, normal
 * agent chat) should treat this as `false`.
 */
export function isIntegrationCallerRequest() {
    return als.getStore()?.isIntegrationCaller === true;
}
export function getIntegrationRequestContext() {
    return als.getStore()?.integration;
}
/**
 * Convenience: returns `{ userEmail, orgId }` from the active request context,
 * suitable for passing to `resolveCredential(key, ctx)`. Returns `null` when
 * no user is associated with the call (e.g. an unauthenticated public route).
 *
 * For framework actions auto-mounted at `/_agent-native/actions/...` this is
 * always populated because action-routes wraps every invocation in
 * `runWithRequestContext`. For hand-written `/api/*` routes the calling code
 * is responsible for setting up the context (see `runWithRequestContext`).
 */
export function getCredentialContext() {
    const userEmail = getRequestUserEmail();
    if (!userEmail)
        return null;
    return { userEmail, orgId: getRequestOrgId() ?? null };
}
/**
 * Get the active request's mutable agent-run state. Returns `undefined` when
 * called outside an agent run (e.g. before `prepareRun` or in a non-agent
 * code path). Callers must tolerate the field absence; use the helper
 * `requireRequestRunContext()` if missing context is a programming error.
 */
export function getRequestRunContext() {
    const store = als.getStore();
    if (!store)
        return undefined;
    return store.run;
}
/**
 * Ensure a `RequestRunContext` exists on the active request store and
 * return it. Used by the agent-chat handler to attach run state once it
 * starts processing a chat request. Returns `undefined` if there is no
 * active request store (caller should not be invoking this outside ALS).
 */
export function ensureRequestRunContext() {
    const store = als.getStore();
    if (!store)
        return undefined;
    if (!store.run)
        store.run = {};
    return store.run;
}
//# sourceMappingURL=request-context.js.map