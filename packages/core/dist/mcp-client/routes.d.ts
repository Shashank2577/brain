/**
 * HTTP routes for user- and org-scope remote MCP server management.
 *
 * Mounted under `/_agent-native/mcp/servers` by `agent-chat-plugin` —
 * requires a reference to the running `McpClientManager` so mutations can
 * hot-reload the configured server set.
 *
 *   GET    /_agent-native/mcp/servers           list user + org servers
 *   POST   /_agent-native/mcp/servers           add a server
 *   DELETE /_agent-native/mcp/servers/:id       remove a server (scope via ?scope=)
 *   POST   /_agent-native/mcp/servers/:id/test  dry-run connect (no persist)
 *   POST   /_agent-native/mcp/servers/test      dry-run a URL before persisting
 *   GET    /_agent-native/mcp/builtin           list built-in capability toggles
 *   POST   /_agent-native/mcp/builtin           update built-in capability toggles
 */
import type { McpClientManager } from "./manager.js";
import type { McpConfig } from "./config.js";
import { type BuiltinMcpCapability, type BuiltinMcpCapabilityId } from "./builtin-capabilities.js";
import { type RemoteMcpScope } from "./remote-store.js";
export { formatMcpConnectError } from "./errors.js";
export interface ClientServer {
    id: string;
    scope: RemoteMcpScope;
    name: string;
    url: string;
    headers?: Record<string, {
        set: true;
    }>;
    description?: string;
    createdAt: number;
    /** The key under which this server is registered in the running MCP manager. */
    mergedId: string;
    status: ServerStatus;
}
export interface ClientBuiltinCapability {
    id: BuiltinMcpCapabilityId;
    serverId: string;
    name: string;
    description: string;
    command: string;
    args: string[];
    exclusiveGroup?: string;
    available: boolean;
    unavailableReason?: string;
    notes?: string;
    enabled: {
        user: boolean;
        org: boolean;
    };
    mergedIds: {
        user?: string;
        org?: string;
    };
    status: {
        user?: ServerStatus;
        org?: ServerStatus;
    };
}
type ServerStatus = {
    state: "connected";
    toolCount: number;
} | {
    state: "error";
    error: string;
} | {
    state: "unknown";
};
export declare function builtinMergedConfigKey(scope: RemoteMcpScope, capability: BuiltinMcpCapability, ownerId: string): string;
/**
 * Build the merged MCP config the manager should run with: file/env config
 * plus **every** user-scope and org-scope remote server persisted in the
 * settings store. Scanning all scopes means a mutation from one user's
 * session never drops another user's servers from the running manager.
 *
 * Each persisted server's merged key includes its owner discriminator
 * (`user_<emailhash>_<name>` or `org_<orgId>_<name>`) so two users' servers
 * with the same name coexist; the request-time gate in
 * `isMcpToolAllowedForRequest` then scopes tool visibility back down to the
 * calling user.
 */
export declare function buildMergedConfig(): Promise<McpConfig | null>;
export declare function mountMcpServersRoutes(nitroApp: any, manager: McpClientManager): void;
//# sourceMappingURL=routes.d.ts.map