import type { AuthSession } from "./auth.js";
/**
 * Initialize server-side Sentry. Idempotent — safe to call from multiple
 * plugin entrypoints. Returns `true` if initialization actually happened
 * (DSN was set), `false` if Sentry is disabled (no DSN).
 *
 * No DSN is hardcoded: unlike the CLI (a published binary that always wants
 * to phone home crashes), the server runs in customer environments. Operators
 * set `SENTRY_SERVER_DSN` or the common `SENTRY_DSN` when they want their own
 * Sentry project to receive these events; without one the module no-ops.
 */
export declare function initServerSentry(): boolean;
/**
 * `true` once `initServerSentry()` has succeeded with a DSN. Plugins that
 * want to skip work when Sentry is disabled can check this before calling
 * the helpers below.
 */
export declare function isServerSentryEnabled(): boolean;
/**
 * Attach the current request's user to Sentry's isolation scope so any
 * `captureException` triggered later in the request carries the right
 * `user.id` / `user.email` / `user.username` and `orgId` tag.
 *
 * Sentry node 10 uses Node's AsyncLocalStorage to give each async context
 * its own isolation scope, so setting on `getIsolationScope()` here only
 * affects events emitted while this request's async context is active.
 *
 * No-ops gracefully when Sentry isn't initialized or no session exists —
 * never throws into the request path.
 */
export declare function setSentryUserForRequest(session: AuthSession | null): void;
/**
 * Pin a user/org onto the current isolation scope from a lighter
 * `RequestContext`-shaped payload. Used by the request-context observer so
 * action handlers, agent-chat runs, and integration webhook processors —
 * all of which already wrap their work in `runWithRequestContext({ userEmail,
 * orgId, ... })` — automatically tag Sentry events with the right user even
 * when the Nitro `request` hook didn't see a cookie (e.g. webhook delivery,
 * A2A calls, internal background runs).
 *
 * Skips overwriting a richer user identity already set by
 * `setSentryUserForRequest` — the cookie-resolved session has
 * userId/username on top of email, which we shouldn't clobber.
 */
export declare function setSentryRequestContext(ctx: {
    userEmail?: string;
    orgId?: string;
}): void;
/**
 * Capture an error from one of the auth attempt routes (login / signup)
 * with the email pinned to the event so support can filter by user. Sets
 * Sentry level to `warning` (not `error`) — bad-password attempts aren't
 * actionable, but a sustained spike of warnings on a route IS the signal
 * we care about.
 *
 * Caller should still return their normal HTTP response (401/409/etc.);
 * this just records the error for observability.
 */
export declare function captureAuthError(error: unknown, context: {
    route: "login" | "signup" | "logout";
    email?: string;
}): string | undefined;
export interface RouteErrorContext {
    /** The full request path (e.g. `/_agent-native/agent-chat`). */
    route?: string;
    /** HTTP method (e.g. `GET`, `POST`). */
    method?: string;
    /** Caller's `User-Agent` header. */
    userAgent?: string;
    /** Free-form extra tags to add to the event (low-cardinality). */
    tags?: Record<string, string | undefined>;
    /**
     * High-cardinality / structured payload — not searchable but visible in
     * the Sentry event detail (recording IDs, byte counts, compression
     * metadata, response body tails, etc.).
     */
    extra?: Record<string, unknown>;
    /**
     * Grouped contexts shown as separate cards in the Sentry event UI.
     */
    contexts?: Record<string, Record<string, unknown>>;
}
/**
 * Capture an exception that surfaced in a Nitro route handler with the
 * request's route/method/userAgent attached as searchable Sentry tags.
 *
 * Non-throwing: if Sentry isn't initialized or the underlying capture
 * fails, this is a no-op. Returns the Sentry event ID when capture
 * succeeded, otherwise `undefined`.
 */
export declare function captureRouteError(error: unknown, context?: RouteErrorContext): string | undefined;
//# sourceMappingURL=sentry.d.ts.map