/**
 * MCP client configuration loading.
 *
 * Resolves `mcp.config.json` in the following precedence order:
 *   1. Workspace root (detected via `agent-native.workspaceCore` in package.json)
 *   2. App root (`process.cwd()`)
 *   3. `MCP_SERVERS` env var (JSON string) — for CI / production deploys
 *
 * Returns `null` when nothing is configured.
 *
 * This module is Node-only — it reads the filesystem. `loadMcpConfig()` guards
 * every fs operation with `isNode()` so a non-Node bundle simply gets `null`.
 */
/**
 * Stdio transport — spawns a local binary and speaks MCP over its stdio.
 * This is the default when no `type` field is set (backward compat).
 */
export interface McpStdioServerConfig {
    type?: "stdio";
    /** Executable or path to spawn over stdio */
    command: string;
    /** Arguments passed to the command */
    args?: string[];
    /** Extra env vars merged into process.env for the spawned server */
    env?: Record<string, string>;
    /** Optional working directory for the spawned process */
    cwd?: string;
    /** Human-readable description (optional, shown in /mcp/status) */
    description?: string;
}
/**
 * HTTP transport — connects to a remote MCP server over Streamable HTTP
 * (the transport hosted providers like Zapier / Cloudflare / Composio use).
 */
export interface McpHttpServerConfig {
    type: "http";
    /** Full URL of the remote MCP server's Streamable HTTP endpoint. */
    url: string;
    /** Extra headers to send with every request (e.g. Authorization). */
    headers?: Record<string, string>;
    /** Human-readable description (optional, shown in /mcp/status) */
    description?: string;
}
export type McpServerConfig = McpStdioServerConfig | McpHttpServerConfig;
export interface McpConfig {
    /** Map of server id → config */
    servers: Record<string, McpServerConfig>;
    /** Where the config was loaded from (workspace root path, app path, or "env") */
    source?: string;
}
/**
 * Load MCP configuration.
 *
 * @param startDir - Directory to start the upward search from (defaults to cwd)
 */
export declare function loadMcpConfig(startDir?: string): McpConfig | null;
/**
 * Auto-detect the claude-in-chrome MCP server if it's installed but no
 * config file exists. Gated by `AGENT_NATIVE_DISABLE_MCP_AUTODETECT`.
 *
 * Returns a synthesized config pointing at the detected binary, or `null`
 * when nothing is found or auto-detect is disabled.
 */
export declare function autoDetectMcpConfig(): McpConfig | null;
//# sourceMappingURL=config.d.ts.map