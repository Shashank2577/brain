export interface CaptureErrorContext {
    /** The request path or logical route, when known. */
    route?: string;
    /** HTTP method, when known. */
    method?: string;
    /** Caller's `User-Agent` header, when known. */
    userAgent?: string;
    /** Searchable low-cardinality tags. */
    tags?: Record<string, string | undefined>;
    /** Structured diagnostic payload shown on the captured event. */
    extra?: Record<string, unknown>;
    /** Grouped diagnostic cards shown on the captured event. */
    contexts?: Record<string, Record<string, unknown>>;
}
export type CaptureErrorProvider = (error: unknown, context: CaptureErrorContext) => string | undefined | void;
/**
 * Register a backend for the framework-level `captureError()` utility.
 *
 * The default Sentry plugin registers itself here when a DSN is configured.
 * Keeping this registry Sentry-agnostic lets core runtime code report errors
 * without importing a Node-only SDK in edge/client-adjacent modules.
 */
export declare function registerErrorCaptureProvider(name: string, provider: CaptureErrorProvider): () => void;
/**
 * Capture an error through every configured provider. No-ops when no provider
 * is installed and never throws back into the application path.
 */
export declare function captureError(error: unknown, context?: CaptureErrorContext): string | undefined;
export declare const captureServerError: typeof captureError;
//# sourceMappingURL=capture-error.d.ts.map