/**
 * Synchronous dev-only browser recovery for Vite optimized-dependency races.
 *
 * Keep this script dependency-free and non-module-safe: React Router SSR roots
 * inline it before `<Scripts />`, and the Vite plugin injects it at
 * `head-prepend` for HTML that does pass through transformIndexHtml.
 */
export declare function getViteDevRecoveryScript(): string;
export declare function shouldInlineViteDevRecoveryScript(): boolean;
//# sourceMappingURL=vite-dev-recovery-script.d.ts.map