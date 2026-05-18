/**
 * Pure, dependency-free, deterministic demo-mode redactor.
 *
 * Replaces sensitive values (names, emails, free numbers) with stable fake
 * substitutes so a demo looks coherent — the same input always maps to the
 * same fake. Crucially, it NEVER rewrites identifiers, structural tokens, or
 * timestamps: under-redaction is safe, corrupting an ID is not. The string
 * redactor uses a protect-first strategy (mask IDs with opaque placeholders
 * before any transform runs, restore them byte-identical afterwards), and the
 * structure-aware walker additionally protects leaf values by key name.
 */
export interface RedactOptions {
    salt?: string;
}
export declare function redactDemoString(text: string, opts?: RedactOptions): string;
export declare function redactDemoData<T>(value: T, opts?: RedactOptions): T;
/**
 * Clear the stable-mapping caches. Test-only — the caches are process-global
 * (intentionally, so mappings stay stable for a tab's session), which would
 * otherwise let one test's produced fakes leak into another's assertions.
 */
export declare function __resetDemoRedactCacheForTests(): void;
//# sourceMappingURL=redact.d.ts.map