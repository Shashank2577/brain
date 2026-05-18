/** Mirrors DEFAULT_PLUGIN_REGISTRY's slot names. */
export type PluginSlot = "agent-chat" | "auth" | "core-routes" | "integrations" | "org" | "resources" | "sentry" | "terminal";
export interface WorkspaceCoreExports {
    /** Absolute path of the monorepo root (the dir containing the root package.json). */
    workspaceRoot: string;
    /** Resolved package name — e.g. "@my-company/shared". */
    packageName: string;
    /** Absolute path to the workspace core package's root directory. */
    packageDir: string;
    /** Plugin slot → export name (if the workspace core declares an override for that slot). */
    plugins: Partial<Record<PluginSlot, string>>;
    /** Absolute path to the workspace core's actions/ directory, or null if it doesn't have one. */
    actionsDir: string | null;
    /** Absolute path to the workspace core's skills/ directory, or null. */
    skillsDir: string | null;
    /** Absolute path to the workspace core's AGENTS.md, or null. */
    agentsMdPath: string | null;
}
/**
 * Main entry point. Discovers the workspace core for the given cwd (defaults
 * to process.cwd()) and returns its layout. Returns null if there's no
 * workspace core in the ancestor chain. Result is cached per-cwd so repeated
 * calls during a single build are cheap.
 */
export declare function getWorkspaceCoreExports(cwd?: string): Promise<WorkspaceCoreExports | null>;
/** Reset the internal cache. Exposed only for tests. */
export declare function _resetWorkspaceCoreCache(): void;
//# sourceMappingURL=workspace-core.d.ts.map