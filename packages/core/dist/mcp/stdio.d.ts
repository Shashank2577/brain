/**
 * MCP **stdio** transport for the `agent-native mcp serve` command.
 *
 * This is the binary external coding agents (Claude Code, Claude Cowork,
 * Codex) actually launch — they speak MCP over a child process's stdio, not
 * HTTP. We expose the agent-native app's MCP surface over stdio in two modes:
 *
 *   - **proxy (default)** — connect an MCP `Client` over
 *     `StreamableHTTPClientTransport` to the *already-running* local app's
 *     `http://127.0.0.1:<port>/_agent-native/mcp`, and run a stdio `Server`
 *     that forwards `tools/list` + `tools/call` to it. The live app is the
 *     single source of truth: HMR'd actions, the real registry, correct
 *     per-request deep links, and tenant scoping all come for free. If the
 *     app isn't running, we wait briefly for it (the workspace gateway boots
 *     it lazily on first request).
 *
 *   - **standalone (`--standalone`)** — no running server, no HMR. Build the
 *     MCP server in-process from `autoDiscoverActions(cwd)` +
 *     `createMCPServerForRequest`, connected straight to a
 *     `StdioServerTransport`. Useful in CI / when nothing is serving.
 *
 * Node-only: imports `node:*` and the SDK stdio/http transports. Never part
 * of the serverless bundle.
 */
export interface RunMCPStdioOptions {
    /** App id to bridge to (workspace). Optional in a single-app project. */
    appId?: string;
    /** Explicit port of the running app's dev server. Overrides discovery. */
    port?: number;
    /** Skip the HTTP proxy and build the server in-process from disk. */
    standalone?: boolean;
    /** Working directory (defaults to process.cwd()). */
    cwd?: string;
    /** Env (defaults to process.env). */
    env?: NodeJS.ProcessEnv;
    /** Max ms to wait for the running app before failing (proxy mode). */
    waitForAppMs?: number;
}
/**
 * Entry point for `agent-native mcp serve`. Defaults to proxy mode; pass
 * `standalone: true` to build the server from disk with no running app.
 */
export declare function runMCPStdio(opts?: RunMCPStdioOptions): Promise<void>;
//# sourceMappingURL=stdio.d.ts.map