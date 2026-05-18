/**
 * MCP client module — symmetric counterpart to `@agent-native/core/mcp`
 * (the MCP server). Connects to local MCP servers configured in
 * `mcp.config.json` or the `MCP_SERVERS` env var and exposes their tools
 * to the agent-chat tool-use loop.
 */
export { loadMcpConfig, autoDetectMcpConfig, } from "./config.js";
export { McpClientManager, parseMcpToolName, MCP_TOOL_PREFIX, } from "./manager.js";
export { listRemoteServers, addRemoteServer, removeRemoteServer, validateRemoteUrl, normalizeServerName, mergedConfigKey, parseMergedKey, hashEmail, toHttpServerConfig, toHttpServerConfigAsync, materializeHeaders, } from "./remote-store.js";
export { BUILTIN_MCP_CAPABILITIES, getBuiltinMcpCapability, isBuiltinMcpCapabilityAvailable, normalizeBuiltinMcpCapabilityIds, toBuiltinMcpServerConfig, } from "./builtin-capabilities.js";
export { builtinMcpCapabilitiesSettingsKey, listEnabledBuiltinMcpCapabilities, setEnabledBuiltinMcpCapabilities, setBuiltinMcpCapabilityEnabled, } from "./builtin-store.js";
export { mountMcpServersRoutes, buildMergedConfig, builtinMergedConfigKey, } from "./routes.js";
export { mountMcpHubRoutes, listHubServers, getHubStatus, isHubServeEnabled, isHubConsumeEnabled, } from "./hub-routes.js";
export { fetchHubServers } from "./hub-client.js";
export { isMcpToolAllowedForRequest } from "./visibility.js";
import { isMcpToolAllowedForRequest } from "./visibility.js";
export function mcpToolsToActionEntries(manager) {
    const entries = {};
    for (const tool of manager.getTools()) {
        entries[tool.name] = mcpToolToActionEntry(manager, tool);
    }
    return entries;
}
/**
 * Mutate a target action dict in place so it matches the current MCP tool set:
 * - adds new `mcp__*` keys that aren't in target,
 * - removes `mcp__*` keys that no longer exist in the manager,
 * - leaves non-MCP keys untouched.
 *
 * Used by the agent-chat plugin to keep its `prodActions` / `devActions`
 * registries in sync after `McpClientManager.reconfigure()` runs.
 */
export function syncMcpActionEntries(manager, target) {
    const current = new Set();
    for (const tool of manager.getTools()) {
        current.add(tool.name);
        if (!target[tool.name]) {
            target[tool.name] = mcpToolToActionEntry(manager, tool);
        }
    }
    for (const key of Object.keys(target)) {
        if (key.startsWith("mcp__") && !current.has(key)) {
            delete target[key];
        }
    }
}
function mcpToolToActionEntry(manager, tool) {
    return {
        tool: {
            description: tool.description,
            parameters: tool.inputSchema,
        },
        http: false,
        run: async (args) => {
            // Defense-in-depth: even if a cross-scope MCP tool somehow makes it
            // into the LLM's visible tool list, reject invocation here so we never
            // execute a user's credentials on behalf of another user.
            if (!isMcpToolAllowedForRequest(tool.name)) {
                return `Error: MCP tool ${tool.name} is not available in the current request scope.`;
            }
            try {
                const result = await manager.callTool(tool.name, args);
                // MCP tool results are typically `{ content: [{ type: "text", text: ... }], isError? }`.
                // Flatten text content for the agent's string-based tool result slot.
                if (result &&
                    typeof result === "object" &&
                    Array.isArray(result.content)) {
                    const parts = result.content;
                    const text = parts
                        .map((p) => {
                        if (p?.type === "text" && typeof p.text === "string")
                            return p.text;
                        if (p?.type === "image")
                            return `[image: ${p?.mimeType ?? "unknown"}]`;
                        return JSON.stringify(p);
                    })
                        .join("\n");
                    if (result.isError)
                        return `Error: ${text}`;
                    return text || "(no output)";
                }
                return typeof result === "string" ? result : JSON.stringify(result);
            }
            catch (err) {
                return `Error calling MCP tool ${tool.name}: ${err?.message ?? err}`;
            }
        },
    };
}
//# sourceMappingURL=index.js.map