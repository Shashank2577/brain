/**
 * Shared Google OAuth utilities for all templates.
 *
 * Handles platform detection (desktop/mobile), state encoding,
 * session token creation, and deep-link responses — the logic
 * that was previously copy-pasted across every template's
 * google-auth.ts handler.
 */
import { type H3Event } from "h3";
/**
 * Detect requests from the Agent Native desktop app specifically.
 *
 * The desktop app appends `AgentNativeDesktop/<version>` to its user-agent
 * (see `packages/desktop-app/src/main/index.ts`). We check for that marker
 * rather than matching generic `Electron`, which would also match other
 * Electron-based webviews like Builder.io's Fusion, Slack desktop, Discord,
 * etc. Falsely treating those as "the desktop app" sends users to the
 * `agentnative://oauth-complete` deep-link success page after Google sign-in,
 * where the protocol handler can't fire and the "Open Agent Native" button
 * does nothing.
 *
 * Kept exported as `isElectron` for backwards compatibility with consumers.
 */
export declare function isElectron(event: H3Event): boolean;
/** Detect requests from a mobile browser (iOS/Android). */
export declare function isMobile(event: H3Event): boolean;
/**
 * Get the origin from forwarded headers or Host.
 *
 * Defends against Host-header injection: in production we require the resolved
 * origin to match `APP_URL` / `BETTER_AUTH_URL` / `WORKSPACE_GATEWAY_URL`,
 * falling back to those values when inbound headers are missing or don't match.
 * In dev we accept inbound `Host` so localhost / ngrok / preview hosts keep
 * working without configuration, except workspace OAuth requests from loopback
 * or Builder preview hosts use the configured gateway origin when one exists.
 * The protocol defaults to `https` in production (so a TLS-terminating proxy
 * that drops `x-forwarded-proto` doesn't downgrade us to plain HTTP).
 */
export declare function getOrigin(event: H3Event): string;
/** App mount prefix, if the template is served under APP_BASE_PATH. */
export declare function getAppBasePath(): string;
/** Build an absolute same-origin URL that preserves APP_BASE_PATH. */
export declare function getAppUrl(event: H3Event, path?: string): string;
/**
 * Validate a user-supplied `redirect_uri` for OAuth flows.
 *
 * Defends against authorization-code interception (RFC 6819 §4.4.1.7):
 * even though the upstream provider (Google/Atlassian/Zoom) refuses
 * unregistered redirect URIs, prefix-style registrations and side
 * registrations on the same host let a malicious caller swap in an
 * attacker-controlled URI that the provider still accepts. We reject any
 * candidate that isn't on this server's own origin AND under the
 * framework's `/_agent-native/` namespace. Returns the validated URI on
 * success, or `undefined` on rejection — callers must treat `undefined`
 * as a 400.
 *
 * The intentional shape is exact-prefix:
 *   - Origin must equal `getOrigin(event)` — no Host-header injection
 *     reusing somebody else's registered redirect URI.
 *   - Path must start with `${appBasePath}/_agent-native/` so we never
 *     hand auth codes to a public marketing or open-redirect endpoint
 *     on the same registered host.
 *
 * For desktop / native flows that need ephemeral `http://127.0.0.1:<port>`
 * loopback URIs, callers should validate those at the template level
 * with a dedicated allowlist — this helper rejects them by design.
 */
export declare function isAllowedOAuthRedirectUri(candidate: string, event: H3Event): boolean;
/**
 * Resolve the `redirect_uri` for an outbound OAuth `auth-url` request.
 *
 * Reads `?redirect_uri=` from the query and validates it via
 * `isAllowedOAuthRedirectUri`. Returns:
 *   - the validated URI when supplied and allowed, OR
 *   - the framework default when no override was supplied, OR
 *   - `null` when an override was supplied but rejected — callers must
 *     respond with 400 in that case.
 *
 * Templates that need a non-default redirect path can pass it via
 * `defaultPath` (e.g. `"/_agent-native/google/desktop-callback"` for
 * desktop flows).
 */
export declare function resolveOAuthRedirectUri(event: H3Event, defaultPath?: string): string | null;
export interface OAuthStatePayload {
    redirectUri: string;
    owner?: string;
    desktop?: boolean;
    addAccount?: boolean;
    app?: string;
    /**
     * Same-origin path to redirect to after a successful web-flow sign-in.
     * Threaded through the (HMAC-signed) state so it survives the round trip
     * to Google. Validated again on decode via safeReturnPath as defence in
     * depth. Has no effect on desktop / mobile / add-account flows, which
     * use their own deep-link / close-tab handling.
     */
    returnUrl?: string;
    flowId?: string;
}
/**
 * Options for the named-argument form of {@link encodeOAuthState}.
 * Prefer this form — the positional overload is easy to misuse (the mail
 * and calendar templates historically passed `flowId` in the `returnUrl`
 * slot, smuggling state into a defence-in-depth path).
 */
export interface EncodeOAuthStateOptions {
    redirectUri: string;
    owner?: string;
    desktop?: boolean;
    addAccount?: boolean;
    app?: string;
    returnUrl?: string;
    flowId?: string;
}
/**
 * Encode OAuth state into a signed base64url string.
 * The state is HMAC-signed so the callback can verify it wasn't forged,
 * preventing CSRF attacks on the OAuth flow.
 *
 * Two call shapes are supported:
 *   - Recommended: pass an options object — clear, mismatch-proof.
 *     `encodeOAuthState({ redirectUri, owner, desktop, ... })`
 *   - Legacy positional form (kept working for backward compatibility):
 *     `encodeOAuthState(redirectUri, owner, desktop, addAccount, app, returnUrl, flowId)`.
 *     Callers should migrate to the options form — see the audit on
 *     templates/mail and templates/calendar where the positional shape
 *     led to `flowId` being smuggled in via the `returnUrl` slot.
 */
export declare function encodeOAuthState(opts: EncodeOAuthStateOptions): string;
export declare function encodeOAuthState(redirectUri: string, owner?: string, desktop?: boolean, addAccount?: boolean, app?: string, returnUrl?: string, flowId?: string): string;
/**
 * Decode and verify OAuth state from the callback's state query parameter.
 * Rejects forged or tampered state by checking the HMAC signature.
 * Falls back to the provided URI if decoding or verification fails.
 */
export declare function decodeOAuthState(stateParam: string | undefined, fallbackUri: string): OAuthStatePayload;
export interface OAuthOwnerResult {
    owner: string | undefined;
    hasProductionSession: boolean;
}
/**
 * Determine the token owner from the current session and OAuth state.
 * Call this BEFORE exchangeCode to get the owner parameter.
 */
export declare function resolveOAuthOwner(event: H3Event, stateOwner?: string): Promise<OAuthOwnerResult>;
export interface OAuthSessionResult {
    sessionToken: string | undefined;
}
/**
 * Create a session token after a successful OAuth exchange.
 *
 * Desktop and mobile apps have separate cookie jars from the system
 * browser, so they always get a fresh session token (even if the browser
 * already has one). The token is then passed via deep link so the native
 * app can inject it.
 */
export declare function createOAuthSession(event: H3Event, email: string, opts: {
    hasProductionSession: boolean;
    desktop?: boolean;
}): Promise<OAuthSessionResult>;
/**
 * Return the appropriate response after a successful OAuth callback.
 *
 * Handles mobile deep links, desktop deep links, add-account close-tab
 * pages, and plain web redirects — so templates don't have to.
 */
export declare function oauthCallbackResponse(event: H3Event, email: string, opts: {
    sessionToken?: string;
    desktop?: boolean;
    addAccount?: boolean;
    /**
     * Same-origin path to return the viewer to after a successful web
     * sign-in. Validated via safeReturnPath; falls back to "/" for any
     * shape that escapes same-origin. Has no effect on desktop / mobile
     * / add-account flows — those use their own deep-link handling.
     */
    returnUrl?: string;
    flowId?: string;
    appName?: string;
}): Response | string | unknown | Promise<Response | string | unknown>;
/** HTML error page for OAuth failures. The message is HTML-escaped — most
 *  callers pass `error.message` from a token-exchange or userinfo failure,
 *  which can echo upstream provider strings (and historically attacker-
 *  controlled query params via the `error_description` field). */
export declare function oauthErrorPage(message: string): Response;
export declare function oauthDesktopExchangePage(message?: string): Response;
//# sourceMappingURL=google-oauth.d.ts.map