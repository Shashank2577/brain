/**
 * Install the demo-mode fetch interceptor and start polling demo status.
 * Idempotent and browser-only — safe to call from any hook that runs in
 * every template root (we call it from `useDbSync`). A no-op until demo
 * mode is actually on.
 */
export declare function ensureDemoModeFetchInterceptor(): void;
//# sourceMappingURL=fetch-interceptor.d.ts.map