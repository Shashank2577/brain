/**
 * Workspace / app resolution for the MCP stdio transport + builtin tools.
 *
 * Node-only. Never bundled into the serverless function — only the local
 * `agent-native mcp` CLI path and the in-process standalone builder use it.
 *
 * Resolution model (mirrors `cli/workspace-dev.ts`):
 *
 *   - Workspace root  = nearest ancestor whose package.json has
 *     `agent-native.workspaceCore` set, with an `apps/` dir.
 *   - Gateway         = `http://127.0.0.1:<WORKSPACE_PORT|PORT|8080>`.
 *   - Per-app ports   = the gateway's `/_workspace/apps` JSON (authoritative,
 *     accounts for port reservation when 8100+ are taken). Fallback when the
 *     gateway isn't up yet: discover `apps/*` dirs and assign `8100 + index`
 *     in the same sorted order `discoverApps` uses (dispatch first).
 *   - Standalone (no workspace) = the single app at the cwd; dev server on
 *     `PORT` (default Vite 5173 / framework dev). The app id is the package
 *     name's last path segment.
 */
export interface ResolvedApp {
    id: string;
    /** Local origin where this app's dev server listens, e.g. http://127.0.0.1:8100 */
    url: string;
    port: number;
    /** True when a TCP probe to the port succeeds. */
    running: boolean;
}
export interface ResolvedWorkspace {
    /** Workspace root dir, or the standalone app dir. */
    root: string;
    /** True when `root` is a multi-app workspace (has apps/ + workspaceCore). */
    isWorkspace: boolean;
    /** Gateway origin (workspace) — undefined for standalone single app. */
    gatewayUrl?: string;
    /** Discovered apps. For standalone this is a single entry. */
    apps: ResolvedApp[];
}
/** Walk up from `startDir` for a package.json with `agent-native.workspaceCore`. */
export declare function findWorkspaceRoot(startDir: string): string | null;
/**
 * Resolve the workspace (or standalone app) the MCP server should bridge to.
 *
 * @param cwd       Working directory (defaults to process.cwd()).
 * @param env       Env (defaults to process.env). Reads WORKSPACE_PORT / PORT.
 */
export declare function resolveWorkspace(cwd?: string, env?: NodeJS.ProcessEnv): Promise<ResolvedWorkspace>;
/**
 * Resolve the local app the stdio proxy should connect its MCP HTTP client
 * to. Honours an explicit `--app` / appId and `--port` / explicit port.
 * Returns the chosen app's origin (where `/_agent-native/mcp` is mounted).
 *
 * Order of precedence:
 *   1. explicit `port` → http://127.0.0.1:<port>
 *   2. explicit `appId` matched against resolved apps
 *   3. workspace default (dispatch if present, else first app)
 *   4. standalone single app
 */
export declare function resolveLocalAppOrigin(opts: {
    cwd?: string;
    env?: NodeJS.ProcessEnv;
    appId?: string;
    port?: number;
}): Promise<{
    origin: string;
    appId: string;
    ws: ResolvedWorkspace;
}>;
//# sourceMappingURL=workspace-resolve.d.ts.map