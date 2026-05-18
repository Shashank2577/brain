import type { McpStdioServerConfig } from "./config.js";
export type BuiltinMcpCapabilityId = "browser-chrome-devtools" | "browser-playwright" | "computer-use";
export interface BuiltinMcpCapability {
    id: BuiltinMcpCapabilityId;
    serverId: string;
    name: string;
    description: string;
    command: string;
    args: string[];
    exclusiveGroup?: "browser";
    platforms?: NodeJS.Platform[];
    notes?: string;
}
export declare const BUILTIN_MCP_CAPABILITIES: BuiltinMcpCapability[];
export declare function getBuiltinMcpCapability(id: string): BuiltinMcpCapability | null;
export declare function isBuiltinMcpCapabilityId(id: string): id is BuiltinMcpCapabilityId;
export declare function isBuiltinMcpCapabilityAvailable(capability: BuiltinMcpCapability, platform?: NodeJS.Platform): boolean;
export declare function normalizeBuiltinMcpCapabilityIds(ids: readonly string[]): BuiltinMcpCapabilityId[];
export declare function toBuiltinMcpServerConfig(capability: BuiltinMcpCapability): McpStdioServerConfig;
//# sourceMappingURL=builtin-capabilities.d.ts.map