/** Deployment-wide force (hosted demo site). Zero cost — no I/O. */
export declare function isDemoModeForced(): boolean;
/**
 * Whether demo-mode redaction should run for the current request/user.
 * Cheap by design — safe to call before every action result; the expensive
 * walk only happens when this is true.
 */
export declare function isDemoModeEnabled(): Promise<boolean>;
//# sourceMappingURL=config.d.ts.map