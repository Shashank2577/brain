/**
 * Google sign-in flow selection.
 *
 * - `'popup'`: open Google in a popup window; the parent polls the
 *   `desktop-exchange` endpoint to retrieve the session token. Better UX —
 *   the user stays on the current page.
 * - `'redirect'`: full-page redirect to Google. Simpler, more reliable on
 *   mobile / inside in-app browsers / inside Electron.
 * - `'auto'` (default): popup in normal browsers; redirect in Agent Native
 *   Desktop; redirect in top-level Builder preview/editor pages; popup inside
 *   Builder iframes (a redirect there hits Google's `X-Frame-Options: DENY`).
 */
export type GoogleAuthMode = "auto" | "popup" | "redirect";
/**
 * Resolve the effective sign-in flow.
 *
 * Priority: explicit option > `GOOGLE_AUTH_MODE` env var > `'auto'`.
 */
export declare function resolveGoogleAuthMode(option?: GoogleAuthMode): GoogleAuthMode;
//# sourceMappingURL=google-auth-mode.d.ts.map