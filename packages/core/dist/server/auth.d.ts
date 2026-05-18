import type { H3Event } from "h3";
import type { H3AppShim } from "./framework-request-handler.js";
type H3App = H3AppShim;
import type { BetterAuthConfig } from "./better-auth-instance.js";
import type { GoogleAuthMode } from "./google-auth-mode.js";
import { type WorkspaceAppAudience } from "../shared/workspace-app-audience.js";
/**
 * Get the configured session max age. Desktop SSO broker writes from
 * OAuth flows read this so expiration stays consistent with the cookie.
 */
export declare function getSessionMaxAge(): number;
export interface AuthSession {
    email: string;
    userId?: string;
    token?: string;
    /** Display name from the auth provider, when available (Better Auth user.name). */
    name?: string;
    /** Active organization ID (from Better Auth organization plugin) */
    orgId?: string;
    /** User's role in the active organization (owner/admin/member) */
    orgRole?: string;
}
export interface AuthOptions {
    /** Session max age in seconds. Default: 30 days */
    maxAge?: number;
    /**
     * Custom getSession implementation (for BYOA — Auth.js, Clerk, etc.).
     * When provided, Better Auth is bypassed entirely.
     */
    getSession?: (event: H3Event) => Promise<AuthSession | null>;
    /**
     * Paths that are accessible without authentication.
     * Supports prefix matching: "/book" matches /book/anything.
     * Both page routes and API routes can be made public.
     */
    publicPaths?: string[];
    /**
     * Workspace-level audience for the app.
     *
     * "internal" keeps the existing behavior: every app page requires an
     * authenticated workspace member unless listed in publicPaths.
     *
     * "public" lets unauthenticated visitors load page routes, while framework
     * and API routes remain protected unless explicitly listed in publicPaths.
     */
    workspaceAppAudience?: WorkspaceAppAudience;
    /**
     * Workspace app page paths that anonymous visitors can load.
     * Uses the same prefix matching as publicPaths, but only for page routes:
     * framework, API, and .well-known routes stay protected.
     */
    workspaceAppPublicPaths?: string[];
    /**
     * Workspace app page paths that still require auth when the app audience is
     * public. Useful for public sites with login-only admin/management pages.
     */
    workspaceAppProtectedPaths?: string[];
    /**
     * Custom login page HTML. When provided, this HTML is served to
     * unauthenticated page requests instead of the built-in login form.
     * Use this for custom login flows (e.g., "Sign in with Google" button).
     */
    loginHtml?: string;
    /**
     * Hide email/password forms on the built-in login page and show only the
     * Google sign-in button. Use this for templates (mail, calendar) where
     * Google connection is required anyway. Has no effect when `loginHtml`
     * is provided.
     */
    googleOnly?: boolean;
    /**
     * Mount the framework's generic Google sign-in routes.
     *
     * Set this to false when a template owns `/_agent-native/google/auth-url`
     * and `/_agent-native/google/callback` itself because it needs broader
     * product scopes and persisted API tokens, not just identity sign-in.
     */
    mountGoogleOAuthRoutes?: boolean;
    /**
     * Additional Google OAuth scopes to request beyond the default identity
     * scopes (`openid`, `email`, `profile`). When set, Better Auth's Google
     * social provider asks for these up front, requests a refresh token
     * (`access_type=offline`), and forces the consent screen so the refresh
     * token is reissued on every sign-in.
     *
     * Tokens land in Better Auth's `account` table, and a database hook
     * mirrors them into `oauth_tokens` so template code (mail's Gmail client,
     * calendar's events fetcher, etc.) can pick them up without a separate
     * "Connect Google" round-trip.
     *
     * Example for the mail template:
     * ```ts
     * googleScopes: [
     *   "https://www.googleapis.com/auth/gmail.readonly",
     *   "https://www.googleapis.com/auth/gmail.send",
     * ],
     * ```
     */
    googleScopes?: string[];
    /**
     * Product marketing content shown alongside the sign-in form.
     * When provided, the page uses a split layout: marketing on the left,
     * sign-in form on the right.
     */
    marketing?: {
        appName: string;
        tagline: string;
        description?: string;
        features?: string[];
        runLocalCommand?: string;
    };
    /**
     * Optional host-scoped notice shown before the built-in Google sign-in
     * redirects to Google.
     */
    googleSignInNotice?: {
        host?: string;
        title: string;
        body: string | string[];
        continueLabel?: string;
        cancelLabel?: string;
    };
    /**
     * Google sign-in flow: `'popup'`, `'redirect'`, or `'auto'` (default).
     *
     * - `'auto'` — popup in normal browsers and Builder web iframes, redirect in
     *   Electron and Builder desktop preview/editor surfaces.
     * - `'popup'` — force popup everywhere.
     * - `'redirect'` — force redirect everywhere.
     *
     * Falls back to the `GOOGLE_AUTH_MODE` env var, then `'auto'`.
     */
    googleAuthMode?: GoogleAuthMode;
    /**
     * Additional Better Auth configuration (social providers, plugins, etc.)
     */
    betterAuth?: BetterAuthConfig;
}
/**
 * When set, the framework session cookie is shared across every subdomain
 * matching this domain (e.g. `.agent-native.com`). Reads `COOKIE_DOMAIN`.
 * Returns undefined when unset so cookies stay scoped to the origin host.
 */
export declare function getCookieDomain(): string | undefined;
export declare const COOKIE_NAME: string;
/**
 * Cookie domain attribute spread into every `setCookie`/`deleteCookie`.
 * Empty when `COOKIE_DOMAIN` isn't set so the cookie stays scoped to the
 * single origin (current production default for non-first-party apps).
 */
export declare function cookieDomainAttrs(): {
    domain?: string;
};
/**
 * Check if we're in a development/test environment.
 * Used for cookie security settings, not for auth bypass.
 */
export declare function isDevEnvironment(): boolean;
/**
 * Validate a `?return=` URL for the /_agent-native/sign-in entrypoint.
 *
 * Parses the candidate against a sentinel base origin; any input that
 * resolves to a different origin (network-path references, absolute URLs,
 * `data:` / `javascript:` schemes, backslash-bypass tricks WHATWG normalises
 * to `//`) gets rejected and falls back to "/". Control characters are
 * stripped up front to defend against header-injection. Returns the
 * normalised path the parser produced — never the raw input.
 *
 * Exported for unit tests.
 */
export declare function safeReturnPath(raw: string | null | undefined): string;
/**
 * Return the configured login HTML for this request, or `null` when no auth
 * guard is installed. Used by the `/_agent-native/open` deep-link route to
 * serve the same sign-in form the auth guard would — at the original deep
 * link URL — so the login form's `window.location.replace(href)` success
 * handler reloads the same URL and the (now authenticated) open route
 * proceeds. Mirrors the rawPath/getLoginHtml resolution in the auth guard.
 */
export declare function getConfiguredLoginHtml(event: H3Event): string | null;
/**
 * True only when the request originates from the local machine — the raw
 * socket peer is `127.0.0.0/8`, `::1`, or the IPv4-mapped `::ffff:127.0.0.1`
 * (an optional IPv6 zone id like `fe80::1%en0` is stripped first).
 *
 * `getRequestIP(event)` is called WITHOUT `{ xForwardedFor: true }`, so it
 * returns the real connection peer and never an attacker-controlled
 * `X-Forwarded-For` value — a remote client cannot spoof its way past this.
 * Used to scope local-only conveniences (the desktop SSO broker and the dev
 * auto-account) so a directly network-reachable dev server never exposes
 * them to a remote visitor. NOTE: a reverse proxy / tunnel that connects to
 * the dev server over localhost still appears as loopback, so this is a
 * necessary but not sufficient gate — callers pair it with NODE_ENV and,
 * for the dev account, a throwaway per-DB password.
 */
export declare function isLoopbackAddress(ip: string | undefined): boolean;
/**
 * True when the request's actual socket peer is loopback. Uses
 * `getRequestIP(event)` WITHOUT `{ xForwardedFor: true }`, so it reflects the
 * real connecting IP and a remote client cannot spoof it via the `Host` /
 * `X-Forwarded-*` headers. Use this — not a parsed `Host`-header origin — for
 * any "is this local dev?" security gate (MCP/connect dev-open).
 */
export declare function isLoopbackRequest(event: H3Event): boolean;
export declare function isExpectedAuthFailure(error: unknown): boolean;
/**
 * Create a new session in the legacy sessions table.
 * Used by google-oauth.ts for mobile deep linking.
 */
export declare function addSession(token: string, email?: string): Promise<void>;
/** Remove a session from the legacy sessions table. */
export declare function removeSession(token: string): Promise<void>;
/**
 * Look up the email associated with a legacy session token.
 * Returns null if the session doesn't exist, is expired, or has no email.
 */
export declare function getSessionEmail(token: string): Promise<string | null>;
export interface DesktopExchangeErrorPayload {
    message: string;
    code?: string;
    accountId?: string;
    existingOwner?: string;
    attemptedOwner?: string;
}
export declare function setDesktopExchange(flowId: string, token: string, email: string): void;
export declare function setDesktopExchangeError(flowId: string, error: DesktopExchangeErrorPayload): void;
/**
 * Run the auth guard on an event. Returns a Response/object to block the
 * request (login page or 401), or undefined to allow it through.
 *
 * Called by the default server middleware (server/middleware/auth.ts) to
 * enforce auth on page routes and API routes — not just framework routes.
 */
export declare function runAuthGuard(event: H3Event): Promise<Response | object | string | void>;
/**
 * Get the current auth session for a request.
 *
 * Resolution chain:
 * 1. ACCESS_TOKEN → check legacy cookie-based token sessions
 * 2. BYOA custom getSession → delegate to template callback
 * 3. Bearer legacy session → check Authorization: Bearer against sessions
 * 4. Better Auth → check session via Better Auth API (cookie or Bearer)
 * 5. Legacy cookie → check an_session cookie in legacy sessions table
 * 6. Desktop SSO broker (Electron loopback only)
 * 7. Mobile _session query param → promote to cookie
 *
 * Returns `null` for unauthenticated requests. There is no dev-mode bypass:
 * local development uses the same Better Auth signup flow as production. The
 * onboarding/sign-in page is served by `runAuthGuard` for any unauthenticated
 * page load.
 */
export declare function getSession(event: H3Event): Promise<AuthSession | null>;
export declare function setFrameworkSessionCookie(event: H3Event, token: string): void;
/**
 * Automatically configure auth based on environment and configuration:
 *
 * - **BYOA (custom getSession)**: Template-provided auth callback handles everything.
 * - **ACCESS_TOKEN/ACCESS_TOKENS**: Simple token-based auth.
 * - **Default**: Better Auth with email/password, social providers, organizations, and JWT.
 *   Users see an onboarding page to create an account on first visit.
 *
 * Local development uses the same Better Auth flow as production. Email
 * verification is automatically skipped in dev/test environments and when
 * no email provider is configured (see `shouldSkipEmailVerification`), so a
 * fresh local clone only needs an email + password to get started.
 *
 * Returns true if auth was mounted, false if skipped.
 */
export declare function autoMountAuth(app: H3App, options?: AuthOptions): Promise<boolean>;
/**
 * @deprecated Use `autoMountAuth(app, options?)` instead.
 */
export declare function mountAuthMiddleware(app: H3App, accessToken: string): void;
export {};
//# sourceMappingURL=auth.d.ts.map