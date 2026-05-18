/**
 * Defense-in-depth CSRF check for framework state-changing routes.
 *
 * Threat model: action endpoints (`/_agent-native/actions/*`), extension
 * endpoints (`/_agent-native/extensions/*` and the legacy
 * `/_agent-native/tools/*` alias), and a handful of other state-changing
 * `/_agent-native/*` routes use the better-auth session cookie, which is
 * configured with `SameSite=None; Secure; Partitioned` so the iframe editor
 * (and other cross-site embeds) can authenticate. `SameSite=None` means the
 * browser ships the session cookie on top-level form POSTs from any origin —
 * which is exactly the precondition for classic cross-site request forgery.
 *
 * The browser still gates "non-simple" requests behind a CORS preflight, so
 * an attacker who has to send `Content-Type: application/json` is forced
 * through OPTIONS, which our CORS middleware (`create-server.ts`) rejects
 * for disallowed origins. But the simple-request bypass (`Content-Type:
 * text/plain` on a `<form enctype="text/plain">` POST, or `multipart/form-data`)
 * never preflights — the browser delivers it cross-origin with cookies.
 *
 * Mitigation: this middleware rejects any state-changing
 * (`POST/PUT/PATCH/DELETE`) request to `/_agent-native/*` that
 *
 *   1. carries the auth-cookie pattern (any cookie at all is a heuristic
 *      good-enough proxy — we don't want to deny anonymous fetches), AND
 *   2. is NOT clearly same-origin / first-party. We trust:
 *      - `Sec-Fetch-Site: same-origin` (sent by every modern browser on
 *        same-origin fetch — Chrome/Firefox/Safari/Edge all support it).
 *      - `X-Agent-Native-CSRF` custom header. Custom headers force a
 *        preflight, so an attacker can't add one cross-origin.
 *      - `Content-Type: application/json` request body. Same logic — JSON
 *        Content-Type is a non-simple request that triggers preflight.
 *
 * Why the existing CORS check isn't enough: a simple-request POST never
 * preflights, so the browser sends it through and only blocks the *response*
 * from being readable cross-origin. The state change (delete-account, write
 * SQL, etc.) happens server-side regardless. We need a server-side check that
 * proves first-party intent before running the action.
 *
 * Opt-out marker: a handful of routes legitimately accept cross-origin POSTs
 * — webhook endpoints (Slack, Telegram, email), the public A2A endpoint
 * (`/_agent-native/a2a`), the integrations process-task self-fire, and so on.
 * Those are listed in `CSRF_ALLOWLIST_PREFIXES` below; if you add a new
 * cross-origin-callable route, add it there.
 */
/**
 * Create the framework CSRF middleware.
 *
 * Mount this BEFORE any state-changing route handler. The middleware
 *   - lets every non-state-changing method through (GET/HEAD/OPTIONS).
 *   - lets requests without cookies through (anonymous/server tools).
 *   - lets allowlisted paths through (webhooks, A2A, OAuth callbacks).
 *   - lets first-party-shaped requests through (custom header, JSON
 *     Content-Type, or `Sec-Fetch-Site: same-origin`).
 *   - rejects everything else with 403.
 */
export declare function createCsrfMiddleware(frameworkPrefix?: string): import("h3").EventHandlerWithFetch<import("h3").EventHandlerRequest, {
    error: string;
}>;
//# sourceMappingURL=csrf.d.ts.map