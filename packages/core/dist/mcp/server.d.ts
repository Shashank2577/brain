import type { ActionEntry } from "../agent/production-agent.js";
export interface MCPConfig {
    /** App name shown in MCP server info */
    name: string;
    /** App description */
    description: string;
    /** Version string (default "1.0.0") */
    version?: string;
    /** Action registry — same as agent chat and A2A */
    actions: Record<string, ActionEntry>;
    /** Handler for the ask-agent meta-tool — runs the full agent loop */
    askAgent?: (message: string) => Promise<string>;
}
/**
 * Mount an MCP remote server on an H3/Nitro app.
 *
 * Endpoint: `{routePrefix}/mcp` (default `/_agent-native/mcp`)
 *
 * Uses stateless Streamable HTTP transport — no in-memory sessions,
 * compatible with serverless deployments.
 *
 * Auth: Bearer token matching ACCESS_TOKEN/ACCESS_TOKENS or JWT via A2A_SECRET.
 * No auth required when neither is configured (dev mode).
 */
export declare function mountMCP(nitroApp: any, config: MCPConfig, routePrefix?: string): void;
//# sourceMappingURL=server.d.ts.map