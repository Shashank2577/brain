import type { McpServerScope } from "./use-mcp-servers.js";
export type BuiltinCapabilityId = "browser-chrome-devtools" | "browser-playwright" | "computer-use";
export interface BuiltinCapability {
    id: BuiltinCapabilityId;
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
        user?: BuiltinCapabilityStatus;
        org?: BuiltinCapabilityStatus;
    };
}
export type BuiltinCapabilityStatus = {
    state: "connected";
    toolCount: number;
} | {
    state: "error";
    error: string;
} | {
    state: "unknown";
};
export interface BuiltinCapabilitiesList {
    capabilities: BuiltinCapability[];
    user: {
        enabledIds: BuiltinCapabilityId[];
    };
    org: {
        enabledIds: BuiltinCapabilityId[];
        orgId: string | null;
        role: string | null;
    };
}
export declare const BUILTIN_CAPABILITIES_KEY: readonly ["mcp-builtin-capabilities"];
export declare function useBuiltinCapabilities(): import("@tanstack/react-query").UseQueryResult<BuiltinCapabilitiesList, Error>;
export declare function useToggleBuiltinCapability(): import("@tanstack/react-query").UseMutationResult<{
    ok?: boolean;
    error?: string;
}, Error, {
    id: BuiltinCapabilityId;
    scope: McpServerScope;
    enabled: boolean;
}, unknown>;
export declare function mcpBuiltinVirtualId(scope: McpServerScope, capabilityId: string): string;
export declare function parseMcpBuiltinVirtualId(id: string): {
    scope: McpServerScope;
    capabilityId: BuiltinCapabilityId;
} | null;
//# sourceMappingURL=use-builtin-capabilities.d.ts.map