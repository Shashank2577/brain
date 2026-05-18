/**
 * Create symlinks for all supported agent tools (Claude, Cursor, Windsurf, etc.).
 * Idempotent — skips existing correct symlinks and user-customized files.
 */
export declare function setupAgentSymlinks(targetDir: string): void;
/**
 * CLI entry point for `agent-native setup-agents`.
 * Runs in the current working directory.
 */
export declare function runSetupAgents(): void;
//# sourceMappingURL=setup-agents.d.ts.map