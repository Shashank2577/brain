import { type WorkspaceAppAudience } from "../shared/workspace-app-audience.js";
export interface DiscoveredAgent {
    id: string;
    name: string;
    description: string;
    url: string;
    color: string;
}
export interface WorkspaceAppMetadataOverride {
    name?: string;
    description?: string;
    generated?: boolean;
    sourcePrompt?: string;
    updatedAt?: string;
    updatedBy?: string;
}
export interface WorkspaceAppMetadataSettings {
    apps: Record<string, WorkspaceAppMetadataOverride>;
}
export declare const WORKSPACE_APP_METADATA_SETTINGS_KEY = "workspace-app-metadata";
export interface WorkspaceAppManifestEntry {
    id: string;
    name: string;
    description: string;
    path: string;
    url?: string | null;
    isDispatch?: boolean;
    audience?: WorkspaceAppAudience;
    publicPaths?: string[];
    protectedPaths?: string[];
}
export declare function workspaceAppMetadataSettingsKey(input?: {
    orgId?: string | null;
    userEmail?: string | null;
}): string | null;
export declare function parseWorkspaceAppMetadataSettings(raw: unknown): WorkspaceAppMetadataSettings;
export declare function readWorkspaceAppMetadataSettings(): Promise<WorkspaceAppMetadataSettings>;
export declare function writeWorkspaceAppMetadataOverride(input: {
    appId: string;
    name?: string | null;
    description?: string | null;
    generated?: boolean;
    sourcePrompt?: string | null;
    updatedBy?: string | null;
}): Promise<WorkspaceAppMetadataSettings>;
export declare function applyWorkspaceAppMetadataOverride<T extends {
    id: string;
    name: string;
    description?: string | null;
}>(app: T, settings: WorkspaceAppMetadataSettings): T;
/**
 * Resolve the workspace app manifest from the same fallback chain that
 * `discoverWorkspaceAgents` uses: `AGENT_NATIVE_WORKSPACE_APPS_JSON` env →
 * `.agent-native/workspace-apps.json` (or sibling) on disk → live filesystem
 * scan of `apps/<id>/package.json` under the workspace root.
 *
 * Callers (e.g. the dispatch `/dispatch/<appId>` catch-all loader) need this
 * to behave the same in production deploys (which write the manifest file)
 * and during local dev (where new apps appear under `apps/` without an env
 * restart). Reading only the env var would silently downgrade the behavior
 * in both cases.
 */
export declare function loadWorkspaceAppsManifest(): WorkspaceAppManifestEntry[] | null;
export declare function shouldIncludeRemoteAgentManifest(manifest: {
    id?: string | null;
}, selfAppId?: string): boolean;
/**
 * Get built-in agents (static, no DB). Used as fallback and for seeding.
 */
export declare function getBuiltinAgents(selfAppId?: string): DiscoveredAgent[];
/**
 * Discover all agents: built-in + custom agents stored as resources.
 * Custom agents override built-in agents with the same ID.
 */
export declare function discoverAgents(selfAppId?: string): Promise<DiscoveredAgent[]>;
/**
 * Look up a single agent by ID or name (case-insensitive).
 */
export declare function findAgent(idOrName: string, selfAppId?: string): Promise<DiscoveredAgent | undefined>;
/**
 * Like `getBuiltinAgents`, but always returns the production URL — never the
 * env-resolved devUrl. Used by the resource seeder so that a one-time seed
 * (`ON CONFLICT DO NOTHING`) can't permanently bake a localhost URL into the
 * DB, which would override the built-in's prod URL for every later
 * production deploy.
 */
export declare const BUILTIN_AGENTS_FOR_SEEDING: DiscoveredAgent[];
//# sourceMappingURL=agent-discovery.d.ts.map