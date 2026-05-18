export const BUILTIN_MCP_CAPABILITIES = [
    {
        id: "browser-chrome-devtools",
        serverId: "chrome-devtools",
        name: "Chrome DevTools",
        description: "Attach to a live Chrome browser through Chrome DevTools MCP.",
        command: "npx",
        args: [
            "-y",
            "chrome-devtools-mcp@0.26.0",
            "--autoConnect",
            "--no-usage-statistics",
        ],
        exclusiveGroup: "browser",
        notes: "Uses --autoConnect and requires Chrome 144+ with remote debugging enabled.",
    },
    {
        id: "browser-playwright",
        serverId: "playwright",
        name: "Playwright Browser",
        description: "Launch and control a Playwright-managed browser.",
        command: "npx",
        args: ["-y", "@playwright/mcp@0.0.75"],
        exclusiveGroup: "browser",
    },
    {
        id: "computer-use",
        serverId: "computer-use",
        name: "Computer Use",
        description: "Control local macOS apps through the Computer Use MCP server.",
        command: "npx",
        args: ["-y", "computer-use-mcp@1.8.0"],
        platforms: ["darwin"],
    },
];
const CAPABILITY_BY_ID = new Map(BUILTIN_MCP_CAPABILITIES.map((capability) => [capability.id, capability]));
export function getBuiltinMcpCapability(id) {
    return CAPABILITY_BY_ID.get(id) ?? null;
}
export function isBuiltinMcpCapabilityId(id) {
    return CAPABILITY_BY_ID.has(id);
}
export function isBuiltinMcpCapabilityAvailable(capability, platform = process.platform) {
    return !capability.platforms || capability.platforms.includes(platform);
}
export function normalizeBuiltinMcpCapabilityIds(ids) {
    const enabled = [];
    for (const rawId of ids) {
        const capability = getBuiltinMcpCapability(rawId);
        if (!capability)
            continue;
        if (capability.exclusiveGroup) {
            for (let i = enabled.length - 1; i >= 0; i--) {
                const existing = getBuiltinMcpCapability(enabled[i]);
                if (existing?.exclusiveGroup === capability.exclusiveGroup) {
                    enabled.splice(i, 1);
                }
            }
        }
        else if (enabled.includes(capability.id)) {
            continue;
        }
        enabled.push(capability.id);
    }
    return enabled;
}
export function toBuiltinMcpServerConfig(capability) {
    return {
        type: "stdio",
        command: capability.command,
        args: capability.args,
        description: capability.description,
    };
}
//# sourceMappingURL=builtin-capabilities.js.map