/**
 * Shared MCP client-config writers.
 *
 * Extracted so both `agent-native mcp install` (see `mcp.ts`) and
 * `agent-native connect` (see `connect.ts`) write the EXACT same on-disk
 * config file targets and formats for every supported client. `mcp.ts`
 * intentionally keeps its own hand-rolled copies of these writers (its
 * external behavior is unchanged); new code should import from here so the
 * formats never diverge.
 *
 * Supported clients and their config files:
 *   - claude-code / claude-code-cli → `.mcp.json` (project) or
 *     `~/.claude.json` (user). JSON `mcpServers[name] = entry`.
 *   - cowork                        → `~/.cowork/mcp.json`. Same JSON shape.
 *   - codex                         → `~/.codex/config.toml`.
 *     `[mcp_servers.<name>]` block.
 *
 * Node-only. No new npm deps — hand-rolled JSON merge + minimal TOML block
 * merge, mirroring `mcp.ts`.
 */
export type ClientId = "claude-code" | "claude-code-cli" | "codex" | "cowork";
export declare const CLIENTS: ClientId[];
/** The HTTP MCP server entry written into a JSON client config. */
export interface HttpMcpEntry {
    type: "http";
    url: string;
    headers?: Record<string, string>;
}
/** Build the HTTP MCP server entry for a deployed agent-native app. */
export declare function buildHttpMcpEntry(mcpUrl: string, token?: string, headers?: Record<string, string>): HttpMcpEntry;
/**
 * Cowork consumes MCP exactly like Claude Code (same JSON server-entry
 * shape). Resolved lazily so `os.homedir()` reflects the current `$HOME`.
 */
export declare function coworkConfigPath(): string;
export declare function claudeCodeProjectConfig(baseDir: string): string;
export declare function claudeCodeUserConfig(): string;
export declare function codexConfigPath(): string;
/**
 * Resolve the on-disk config path for a client.
 *
 * `scope` only affects Claude Code / Claude Code CLI: `"user"` → the global
 * `~/.claude.json`, anything else → the project-local `.mcp.json` rooted at
 * `baseDir`.
 */
export declare function configPathFor(client: ClientId, baseDir: string, scope: string | undefined): string;
/**
 * Idempotently write `mcpServers[name] = entry` into a JSON config file.
 * Pass `entry === null` to delete the named entry. Re-running with the same
 * name replaces the existing entry in place — never duplicates.
 */
export declare function writeJsonMcpEntry(file: string, name: string, entry: Record<string, unknown> | null): void;
export declare function hasJsonMcpEntry(file: string, name: string): boolean;
/** Build a `[mcp_servers.<name>]` block for an HTTP-type MCP server. */
export declare function buildCodexHttpBlock(name: string, mcpUrl: string, token?: string, headers?: Record<string, string>): string;
/**
 * Replace (or append) the `[mcp_servers.<name>]` block in a TOML file
 * without disturbing other content. A block is the header line plus every
 * following line until the next top-level `[` table header or EOF. Pass
 * `block === null` to remove the block. Identical algorithm to `mcp.ts`'s
 * `writeCodexBlock` so the two never diverge.
 */
export declare function writeCodexBlock(file: string, name: string, block: string | null): void;
export declare function codexHasBlock(file: string, name: string): boolean;
/**
 * Idempotently write the HTTP MCP server entry for `serverName` into the
 * given client's config file and return the file path that was written.
 * Re-running replaces the same named entry — never duplicates.
 */
export declare function writeHttpEntryForClient(client: ClientId, serverName: string, mcpUrl: string, token: string | undefined, baseDir: string, scope: string | undefined, headers?: Record<string, string>): string;
//# sourceMappingURL=mcp-config-writers.d.ts.map