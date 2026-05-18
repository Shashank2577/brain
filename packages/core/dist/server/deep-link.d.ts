/** Path of the framework deep-link route, relative to the route prefix. */
export declare const OPEN_ROUTE_SUBPATH = "/open";
/** Custom URL scheme the desktop app registers (`agentnative://open?...`). */
export declare const DESKTOP_OPEN_URL = "agentnative://open";
export interface DeepLinkInput {
    /** App id (informational + multi-app/desktop routing), e.g. "mail". */
    app?: string;
    /** Target view — maps to the `navigate` command `view`. */
    view: string;
    /** Record-focus + filter params, e.g. `{ threadId }`, `{ eventId, date }`,
     *  `{ dashboardId }`. `undefined`/`null`/`""` values are dropped. */
    params?: Record<string, string | number | boolean | null | undefined>;
    /** Explicit client-side path override (must be a same-origin, leading-slash
     *  relative path — enforced by the open route). */
    to?: string;
    /** Base64url-encoded JSON compose draft (mail's `compose-{id}` contract). */
    compose?: string;
}
/**
 * Build the app-relative deep-link path:
 * `/_agent-native/open?app=mail&view=inbox&threadId=abc`.
 * Per-app `link` builders call this; never hand-format the URL.
 */
export declare function buildDeepLink(input: DeepLinkInput): string;
/**
 * Resolve a (possibly relative) deep link to an absolute web URL using the
 * inbound request origin. Absolute URLs pass through unchanged.
 */
export declare function toAbsoluteOpenUrl(urlOrPath: string, origin: string | undefined): string;
/**
 * Rewrite a deep link to the desktop `agentnative://open?...` scheme so the
 * desktop app's existing `handleDeepLink` opens it inside the app webview.
 * Accepts either an app-relative `/_agent-native/open?...` path or an absolute
 * web URL; preserves the query string.
 */
export declare function toDesktopOpenUrl(urlOrPath: string): string;
//# sourceMappingURL=deep-link.d.ts.map