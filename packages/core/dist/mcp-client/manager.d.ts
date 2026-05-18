/**
 * McpClientManager — connects to configured MCP servers (stdio or remote
 * Streamable HTTP), enumerates their tools, and exposes a flat tool registry
 * prefixed with `mcp__<server-id>__` so the agent's tool-use loop can call them.
 *
 * Stdio servers are a strict no-op in non-Node runtimes (Cloudflare Workers,
 * browsers). HTTP servers work in any runtime with `fetch`; `reconfigure()`
 * lets callers add or remove servers at runtime without restarting the process.
 */
import type { McpConfig } from "./config.js";
export declare const MCP_TOOL_PREFIX = "mcp__";
export interface McpTool {
    /** Server id the tool belongs to */
    source: string;
    /** Prefixed tool name (e.g. "mcp__claude-in-chrome__navigate") */
    name: string;
    /** Original name as reported by the MCP server */
    originalName: string;
    /** Human-readable description */
    description: string;
    /** JSON-Schema input spec forwarded verbatim from the server */
    inputSchema: Record<string, unknown>;
}
/**
 * Parse a prefixed tool name back into its server id and original tool name.
 * Returns `null` if the name doesn't match the MCP prefix convention.
 */
export declare function parseMcpToolName(prefixedName: string): {
    serverId: string;
    toolName: string;
} | null;
export interface McpClientManagerOptions {
    /** Emit debug logs on startup */
    debug?: boolean;
}
export declare class McpClientManager {
    private readonly servers;
    private readonly debug;
    private started;
    private config;
    private sdk;
    private readonly listeners;
    /** Serialises reconfigure()/start() — two concurrent callers would
     * otherwise race on `this.config` and on connect/disconnect ordering. */
    private reconfigureQueue;
    constructor(config: McpConfig | null, options?: McpClientManagerOptions);
    /** True when the manager has any configured servers. */
    get enabled(): boolean;
    /** Return the current config (read-only snapshot for callers that need to
     *  merge new servers into the existing set before calling reconfigure). */
    getConfig(): McpConfig | null;
    /** List of configured server ids (whether or not they're connected). */
    get configuredServers(): string[];
    /** List of server ids that successfully connected and enumerated tools. */
    get connectedServers(): string[];
    /**
     * Load MCP SDK modules lazily so non-Node bundles don't pull them in.
     * Stdio transport is only loaded when a stdio server is actually configured.
     */
    private loadSdk;
    /**
     * Subscribe to tool-set changes (e.g. after `reconfigure()` adds/removes
     * servers). The listener is called *after* connect/disconnect completes.
     * Returns an unsubscribe function.
     */
    onChange(listener: () => void): () => void;
    private emitChange;
    /**
     * Connect to each configured MCP server (stdio or http) and enumerate tools.
     * Individual server failures are logged and skipped — the manager stays
     * usable with whichever servers did come up.
     *
     * Queued against `reconfigure()` so a `reconfigure` that lands before
     * `start()` finishes can't race on `this.started` / `this.servers`.
     */
    start(): Promise<void>;
    private startInternal;
    /**
     * Create a new ServerEntry and attempt to connect. Logs and records errors
     * on the entry rather than throwing — callers iterate many servers.
     */
    private addServer;
    private connectServer;
    /**
     * Replace the configured server set. Servers that appear in the new config
     * under a different shape are reconnected; unchanged entries stay live;
     * removed entries are disconnected. Safe to call while `start()` is in
     * flight or after it has completed.
     *
     * Serialised against `start()` and any other `reconfigure()` call via the
     * internal queue — two concurrent mutations would otherwise interleave on
     * `this.config` and on connect/disconnect ordering.
     *
     * Returns a summary describing what happened for logging / UI feedback.
     */
    reconfigure(newConfig: McpConfig | null): Promise<{
        added: string[];
        removed: string[];
        unchanged: string[];
        reconnected: string[];
    }>;
    private reconfigureInternal;
    /** Flattened tool list across all connected servers. */
    getTools(): McpTool[];
    /**
     * Invoke an MCP tool by prefixed name. Routes to the owning server based on
     * the `mcp__<serverId>__` prefix.
     */
    callTool(prefixedName: string, args: unknown): Promise<unknown>;
    /** Cleanly close all MCP clients and child processes. */
    stop(): Promise<void>;
    /** Diagnostic snapshot used by `/_agent-native/mcp/status`. */
    getStatus(): {
        configuredServers: string[];
        connectedServers: string[];
        totalTools: number;
        tools: Array<{
            source: string;
            name: string;
            description: string;
        }>;
        errors: Record<string, string>;
    };
}
//# sourceMappingURL=manager.d.ts.map