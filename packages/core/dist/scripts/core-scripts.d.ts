/**
 * Registry of all core scripts provided by @agent-native/core.
 * The script runner falls back to these when a local script isn't found.
 */
export declare const coreScripts: Record<string, (args: string[]) => Promise<void>>;
/**
 * Returns the list of core script names for help output.
 */
export declare function getCoreScriptNames(): string[];
//# sourceMappingURL=core-scripts.d.ts.map