import type { CliAdapter, CliResult } from "./types.js";
export interface ShellCliAdapterOptions {
    /** The CLI binary name or path (e.g. "gh", "/usr/local/bin/ffmpeg"). */
    command: string;
    /** Human-readable description for agent discovery. */
    description: string;
    /**
     * Optional display name. Defaults to `command`.
     * Use this when the binary name differs from how you want to reference it
     * (e.g. command: "python3", name: "python").
     */
    name?: string;
    /** Environment variables to pass to the CLI process. Merged with process.env. */
    env?: Record<string, string>;
    /** Working directory for the CLI process. Defaults to process.cwd(). */
    cwd?: string;
    /** Timeout in milliseconds. Default: 30000 (30s). */
    timeoutMs?: number;
}
/**
 * Generic adapter that wraps any CLI binary. Use this to quickly register
 * a CLI without writing a custom adapter class.
 *
 * ```ts
 * const gh = new ShellCliAdapter({
 *   command: "gh",
 *   description: "GitHub CLI for repos, PRs, issues, and releases",
 * });
 * ```
 */
export declare class ShellCliAdapter implements CliAdapter {
    readonly name: string;
    readonly description: string;
    private command;
    private env;
    private cwd;
    private timeoutMs;
    constructor(options: ShellCliAdapterOptions);
    isAvailable(): Promise<boolean>;
    execute(args: string[]): Promise<CliResult>;
}
//# sourceMappingURL=shell-adapter.d.ts.map