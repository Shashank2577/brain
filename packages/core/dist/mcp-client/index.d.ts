/**
 * MCP client module — symmetric counterpart to `@agent-native/core/mcp`
 * (the MCP server). Connects to local MCP servers configured in
 * `mcp.config.json` or the `MCP_SERVERS` env var and exposes their tools
 * to the agent-chat tool-use loop.
 */
export { loadMcpConfig, autoDetectMcpConfig, type McpConfig, type McpServerConfig, } from "./config.js";
export { McpClientManager, parseMcpToolName, MCP_TOOL_PREFIX, type McpTool, type McpClientManagerOptions, } from "./manager.js";
export { listRemoteServers, addRemoteServer, removeRemoteServer, validateRemoteUrl, normalizeServerName, mergedConfigKey, parseMergedKey, hashEmail, toHttpServerConfig, toHttpServerConfigAsync, materializeHeaders, type RemoteMcpScope, type StoredRemoteMcpServer, } from "./remote-store.js";
export { BUILTIN_MCP_CAPABILITIES, getBuiltinMcpCapability, isBuiltinMcpCapabilityAvailable, normalizeBuiltinMcpCapabilityIds, toBuiltinMcpServerConfig, type BuiltinMcpCapability, type BuiltinMcpCapabilityId, } from "./builtin-capabilities.js";
export { builtinMcpCapabilitiesSettingsKey, listEnabledBuiltinMcpCapabilities, setEnabledBuiltinMcpCapabilities, setBuiltinMcpCapabilityEnabled, type StoredBuiltinMcpCapabilities, } from "./builtin-store.js";
export { mountMcpServersRoutes, buildMergedConfig, builtinMergedConfigKey, type ClientBuiltinCapability, } from "./routes.js";
export { mountMcpHubRoutes, listHubServers, getHubStatus, isHubServeEnabled, isHubConsumeEnabled, type HubServerRecord, type HubServersResponse, } from "./hub-routes.js";
export { fetchHubServers } from "./hub-client.js";
export { isMcpToolAllowedForRequest } from "./visibility.js";
/**
 * Convert MCP tools into `ActionEntry` values suitable for registration in
 * the agent's action registry. Each tool is marked `http: false` so it's
 * never auto-mounted as an HTTP endpoint — MCP tools are agent-only.
 */
import type { ActionEntry } from "../agent/production-agent.js";
import type { McpClientManager } from "./manager.js";
export declare function mcpToolsToActionEntries(manager: McpClientManager): Record<string, ActionEntry>;
/**
 * Mutate a target action dict in place so it matches the current MCP tool set:
 * - adds new `mcp__*` keys that aren't in target,
 * - removes `mcp__*` keys that no longer exist in the manager,
 * - leaves non-MCP keys untouched.
 *
 * Used by the agent-chat plugin to keep its `prodActions` / `devActions`
 * registries in sync after `McpClientManager.reconfigure()` runs.
 */
export declare function syncMcpActionEntries(manager: McpClientManager, target: Record<string, ActionEntry>): void;
//# sourceMappingURL=index.d.ts.map