declare global {
    interface Window {
        gtag?: (...args: any[]) => void;
        __AGENT_NATIVE_CONFIG__?: {
            sentryDsn?: string;
            sentryEnvironment?: string;
        };
    }
}
type GetDefaultProps = (name: string, properties: Record<string, unknown>) => Record<string, unknown>;
type SentryUser = {
    id?: string;
    email?: string;
    username?: string;
};
/**
 * Attach the current user to Sentry events from the browser. Pass `null` to
 * clear (e.g. on logout). If Sentry isn't initialized yet, the value is
 * buffered and applied once `ensureSentry()` runs.
 *
 * Pass `orgId` to also tag events with the active organization ID — useful
 * for filtering Sentry by tenant.
 */
export declare function setSentryUser(user: SentryUser | null, orgId?: string | null): void;
export interface ClientCaptureContext {
    /** Searchable Sentry tags (low-cardinality strings only). */
    tags?: Record<string, string | undefined>;
    /**
     * High-cardinality / structured payload — not searchable but visible in
     * the Sentry event detail (file sizes, request URLs, response body
     * tails, etc.).
     */
    extra?: Record<string, unknown>;
    /**
     * Grouped contexts shown as separate cards in the Sentry event UI.
     */
    contexts?: Record<string, Record<string, unknown>>;
}
/**
 * Capture an exception to Sentry from browser code without forcing the
 * caller to depend on `@sentry/browser` directly.
 *
 * Templates can route a thrown Error through here on a known failure path
 * (chunk-upload 500, thumbnail upload, etc.) to attach searchable tags and
 * structured extra context. No-ops gracefully when Sentry isn't
 * initialized — never throws back into the caller, so a Sentry hiccup
 * can't mask the original error.
 */
export declare function captureClientException(error: unknown, context?: ClientCaptureContext): string | undefined;
/**
 * Public browser-side error capture utility, mirroring `trackEvent()`:
 * templates can call `captureError(err, { tags, extra, contexts })` without
 * depending on Sentry directly. Sentry receives the event when a browser DSN
 * is configured; otherwise this is a quiet no-op.
 */
export declare function captureError(error: unknown, context?: ClientCaptureContext): string | undefined;
export declare function configureTracking(options: {
    getDefaultProps?: GetDefaultProps;
}): void;
export declare function trackEvent(name: string, params?: Record<string, unknown>): void;
export declare function trackSessionStatus(signedIn: boolean): void;
export {};
//# sourceMappingURL=analytics.d.ts.map