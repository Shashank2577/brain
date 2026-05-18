/**
 * Pure script utilities — no Node.js dependencies.
 * Safe to import from browser bundles and Vite SSR.
 */
/**
 * Parse CLI args in --key value format.
 * Supports: --key value, --key=value, --flag (boolean true)
 */
export declare function parseArgs(args: string[]): Record<string, string>;
/**
 * Convert kebab-case keys to camelCase.
 */
export declare function camelCaseArgs(args: Record<string, string>): Record<string, string>;
//# sourceMappingURL=parse-args.d.ts.map