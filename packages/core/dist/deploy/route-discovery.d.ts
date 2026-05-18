/**
 * Map a Nitro-style route file path to { method, route }.
 *
 * Examples:
 *   api/emails/index.get.ts      → GET  /api/emails
 *   api/emails/[id].get.ts       → GET  /api/emails/:id
 *   api/emails/[id]/star.patch.ts→ PATCH /api/emails/:id/star
 *   api/events.get.ts            → GET  /api/events
 */
export declare function parseRouteFile(relPath: string): {
    method: string;
    route: string;
} | null;
/**
 * Recursively discover all .ts files under a directory.
 */
export declare function discoverFiles(dir: string, prefix?: string): Promise<string[]>;
export interface DiscoveredRoute {
    method: string;
    route: string;
    /** Relative path from server/routes/ */
    filePath: string;
    /** Absolute path on disk */
    absPath: string;
}
/**
 * Discover all API routes in a project's server/routes/ directory.
 */
export declare function discoverApiRoutes(cwd: string): Promise<DiscoveredRoute[]>;
/**
 * Discover all server plugins in a project's server/plugins/ directory.
 */
export declare function discoverPlugins(cwd: string): Promise<string[]>;
/**
 * Default plugins that auto-mount when not provided by the template.
 * Key = filename stem, value = export name from @agent-native/core/server.
 */
export declare const DEFAULT_PLUGIN_REGISTRY: Record<string, string>;
export interface DiscoveredAction {
    /** Action name (filename without extension) */
    name: string;
    /** Absolute path to the action file */
    absPath: string;
    /** HTTP method (from defineAction's http config, default POST) */
    method: string;
}
/**
 * Discover action files in the actions/ directory.
 *
 * When a workspace core is present in the ancestor chain, its actions/
 * directory is also scanned and its actions are merged in after the
 * template's — with template actions winning on name collision.
 *
 * These become `/_agent-native/actions/:name` HTTP endpoints.
 */
export declare function discoverActionFiles(cwd: string): Promise<DiscoveredAction[]>;
/**
 * Returns the stems of default plugins that are missing from the project.
 */
export declare function getMissingDefaultPlugins(cwd: string): Promise<string[]>;
//# sourceMappingURL=route-discovery.d.ts.map