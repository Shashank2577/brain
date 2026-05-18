/**
 * React-query hooks for remote MCP servers surfaced inside the Workspace
 * tab as a virtual `mcp-servers/` folder.
 *
 * MCP servers live in the settings store (user- and org-scope), not the
 * resources table. These hooks wrap the existing `/_agent-native/mcp/servers`
 * endpoints so the Workspace UI can list, create, and delete them with the
 * same keys/invalidations the old Settings panel used.
 */
export type McpServerScope = "user" | "org";
export interface McpServer {
    id: string;
    scope: McpServerScope;
    name: string;
    url: string;
    headers?: Record<string, {
        set: true;
    }>;
    description?: string;
    createdAt: number;
    mergedId: string;
    status: {
        state: "connected";
        toolCount: number;
    } | {
        state: "error";
        error: string;
    } | {
        state: "unknown";
    };
}
export interface McpServersList {
    user: McpServer[];
    org: McpServer[];
    orgId: string | null;
    role: string | null;
}
export declare function useMcpServers(): import("@tanstack/react-query").UseQueryResult<McpServersList, Error>;
export interface CreateMcpServerArgs {
    scope: McpServerScope;
    name: string;
    url: string;
    headers?: Record<string, string>;
    description?: string;
}
export declare function useCreateMcpServer(): import("@tanstack/react-query").UseMutationResult<McpServer, Error, CreateMcpServerArgs, unknown>;
export declare function useDeleteMcpServer(): import("@tanstack/react-query").UseMutationResult<void, Error, {
    id: string;
    scope: McpServerScope;
}, unknown>;
export interface TestMcpUrlResult {
    ok: boolean;
    error?: string;
    toolCount?: number;
    tools?: string[];
}
export declare function getMcpUrlValidationError(rawUrl: string): string | null;
export declare function formatMcpServerError(error: unknown): string;
export declare function testMcpServerUrl(url: string, headers?: Record<string, string>): Promise<TestMcpUrlResult>;
/**
 * Virtual tree-node id used when a server is surfaced in the Workspace tree.
 * Shape: `mcp:<scope>:<serverId>`. Not a real resource row; purely a handle
 * the panel uses to route clicks/delete back to the MCP endpoints.
 */
export declare function mcpVirtualId(scope: McpServerScope, serverId: string): string;
export declare function parseMcpVirtualId(id: string): {
    scope: McpServerScope;
    serverId: string;
} | null;
//# sourceMappingURL=use-mcp-servers.d.ts.map