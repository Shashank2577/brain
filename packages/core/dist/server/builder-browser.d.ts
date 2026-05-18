import type { H3Event } from "h3";
export declare const BUILDER_CALLBACK_PATH = "/_agent-native/builder/callback";
/**
 * Query-param name carrying the signed CSRF state on the connect→callback
 * round-trip. Prefixed with `_an_` to avoid collisions if Builder ever
 * adds standard OAuth `state` support to cli-auth. Builder preserves
 * the path/query of `redirect_url` verbatim when redirecting back, so
 * we embed `_an_state=…` inside the redirect_url query string at
 * connect time and read it back on the callback.
 */
export declare const BUILDER_STATE_PARAM = "_an_state";
export declare const BUILDER_CONNECT_PARAM = "_an_connect";
export interface BuilderBrowserStatus {
    configured: boolean;
    builderEnabled: boolean;
    branchProjectIdConfigured: boolean;
    branchProjectId?: string;
    /**
     * True when `BUILDER_PRIVATE_KEY` is set at the deployment level. This is a
     * fallback credential; signed-in users can still connect their own Builder
     * account, which takes precedence for their request.
     */
    envManaged: boolean;
    credentialSource?: "user" | "org" | "env";
    appHost: string;
    apiHost: string;
    connectUrl: string;
    publicKeyConfigured: boolean;
    privateKeyConfigured: boolean;
    userId?: string;
    orgName?: string;
    orgKind?: string;
}
export interface BrowserConnectionArgs {
    sessionId?: string;
    projectId?: string;
    branchName?: string;
    proxyOrigin?: string;
    proxyDefaultOrigin?: string;
    proxyDestination?: string;
}
/**
 * Mint a signed CSRF state token bound to the current session's email
 * and a fresh nonce. Round-trips through Builder's cli-auth flow inside
 * the redirect_url query string and is verified on the callback before
 * any keys are written.
 *
 * Why bind to email: it's the only stable, universally-available
 * identity field across all auth modes (Better Auth, BYOA, AUTH_MODE=local).
 * Binding to the session token instead would put the cookie value in a
 * URL that may end up in server logs / browser history.
 */
export declare function signBuilderCallbackState(sessionEmail: string): string;
/**
 * Verify a state token produced by `signBuilderCallbackState`. Returns
 * false on any malformed, forged, expired, or cross-session token.
 */
export declare function verifyBuilderCallbackState(token: string | null | undefined, sessionEmail: string): boolean;
export declare function signBuilderConnectToken(ownerEmail: string): string;
export declare function verifyBuilderConnectToken(token: string | null | undefined, ownerEmail: string): boolean;
export declare function appendBuilderConnectToken(connectUrl: string, ownerEmail: string): string;
export declare function getBuilderAppHost(): string;
export declare function getBuilderApiHost(): string;
export declare function getBuilderBranchProjectId(): string;
export declare function isBuilderBranchingEnabled(): boolean;
export declare function resolveBuilderBranchProjectId(): Promise<string>;
export declare function resolveIsBuilderBranchingEnabled(): Promise<boolean>;
/**
 * Build the Builder cli-auth URL for the connect popup. When a signed
 * `state` token is supplied it is embedded inside the `redirect_url`
 * query string so it survives Builder's redirect verbatim — Builder
 * preserves the redirect_url's existing query when appending p-key /
 * api-key / etc., so we don't depend on Builder echoing a top-level
 * `state` parameter (it doesn't).
 *
 * The user-facing connect entry point is `/_agent-native/builder/connect`
 * (a server-side 302). Status / chat-card responses surface that path
 * rather than the cli-auth URL directly, so the 302 handler can mint a
 * fresh state bound to the current session on every click.
 */
export declare function buildBuilderCliAuthUrl(origin: string, state?: string | null): string;
/**
 * The bare URL surfaced to clients as `connectUrl`. The status route appends
 * a short-lived signed connect token when it knows the current owner; this
 * helper stays bare so server-rendered cards can still render without a
 * request-bound owner and the connect route can fall back to Fetch Metadata.
 */
export declare function getBuilderBrowserConnectUrl(origin: string): string;
export declare function getBuilderBrowserStatus(origin: string): BuilderBrowserStatus;
export declare function getBuilderBrowserStatusForEvent(event: H3Event): BuilderBrowserStatus;
/**
 * Env vars written by the Builder CLI-auth callback. Single source of truth
 * for the connect/disconnect key set — `getBuilderCallbackEnvVars` and the
 * disconnect handler's scrub loop both derive from this list, so drift
 * (e.g. disconnect silently leaving `BUILDER_USER_ID` behind because
 * someone added a key to one site but not the other) is impossible.
 */
export declare const BUILDER_ENV_KEYS: readonly ["BUILDER_PRIVATE_KEY", "BUILDER_PUBLIC_KEY", "BUILDER_USER_ID", "BUILDER_ORG_NAME", "BUILDER_ORG_KIND"];
export type BuilderEnvKey = (typeof BUILDER_ENV_KEYS)[number];
export declare function getBuilderCallbackEnvVars(params: {
    privateKey?: string | null;
    publicKey?: string | null;
    userId?: string | null;
    orgName?: string | null;
    orgKind?: string | null;
}): {
    key: "BUILDER_PRIVATE_KEY" | "BUILDER_PUBLIC_KEY" | "BUILDER_USER_ID" | "BUILDER_ORG_NAME" | "BUILDER_ORG_KIND";
    value: string;
}[];
export declare function resolveSafePreviewUrl(previewUrl: string | null | undefined, event: H3Event): string;
export declare function createBuilderBrowserCallbackPage(previewUrl: string): string;
/**
 * HTML page rendered inside the OAuth popup when the callback handler caught
 * an error persisting the per-user Builder credentials. Without this, the
 * popup would show the success page even though the write failed — leaving
 * the parent window stuck on "Waiting for Builder…" until the 5-minute poll
 * timeout fires (Midhun reported this on 2026-04-28).
 *
 * The page does two things:
 * 1. Shows the user a clear "couldn't save credentials" message with the
 *    underlying error so they can retry or report.
 * 2. `postMessage`s the parent (same-origin opener) so the connect-flow
 *    polling stops immediately rather than waiting for the next /status
 *    poll to surface the SQL `builder-connect-error:<email>` row.
 */
export declare function createBuilderBrowserCallbackErrorPage(message: string): string;
export interface RunBuilderAgentArgs {
    prompt: string;
    projectId?: string;
    branchName?: string;
    userEmail?: string;
    userId?: string;
}
export interface RunBuilderAgentResult {
    branchName: string;
    projectId: string;
    url: string;
    status: string;
}
/**
 * POST a prompt to the Builder agents-run API. The Builder agent runs in a
 * cloud sandbox and writes code to a branch; the returned URL opens that
 * branch in the Visual Editor so the user can watch progress.
 *
 * Spec: https://www.builder.io/c/docs/agents-run-api
 */
export declare function runBuilderAgent(args: RunBuilderAgentArgs): Promise<RunBuilderAgentResult>;
export declare function requestBuilderBrowserConnection(args: BrowserConnectionArgs): Promise<Record<string, unknown>>;
//# sourceMappingURL=builder-browser.d.ts.map