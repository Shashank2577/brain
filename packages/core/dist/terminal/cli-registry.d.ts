/**
 * CLI Registry — known AI coding CLIs and their metadata.
 * Used by the embedded terminal in the agent panel.
 */
export interface CliEntry {
    /** Human-readable display name */
    label: string;
    /** npm package name for npx fallback */
    installPackage: string;
    /** Env vars to strip when spawning (prevents nesting) */
    stripEnv: string[];
}
export declare const CLI_REGISTRY: Record<string, CliEntry>;
/** Check if a command name is in the CLI_REGISTRY allowlist */
export declare function isAllowedCommand(cmd: string): boolean;
/** Check if a CLI command exists on PATH (safe — no shell interpolation) */
export declare function commandExists(cmd: string): Promise<boolean>;
//# sourceMappingURL=cli-registry.d.ts.map