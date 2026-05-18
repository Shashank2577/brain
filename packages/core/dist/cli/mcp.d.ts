/**
 * `agent-native mcp <subcommand>` — connect external coding agents (Claude
 * Code desktop & CLI, Claude Cowork, Codex) to this agent-native app/workspace
 * over MCP.
 *
 *   serve      Run the MCP stdio transport (this is what client configs spawn).
 *   install    Provision a token + write the client's MCP config idempotently.
 *   uninstall  Remove the named entry from a client's MCP config.
 *   status     Print resolved MCP URL/port, token state, and per-client entries.
 *   token      Print or rotate the local ACCESS_TOKEN in the workspace .env.
 *
 * Node-only CLI module. Hand-rolled `.env` upsert + minimal TOML block merge
 * keep this dependency-free (no new npm deps).
 */
export declare function runMcp(args: string[]): Promise<void>;
//# sourceMappingURL=mcp.d.ts.map