import { type BuiltinMcpCapabilityId } from "./builtin-capabilities.js";
import type { RemoteMcpScope } from "./remote-store.js";
export interface StoredBuiltinMcpCapabilities {
    enabledIds: BuiltinMcpCapabilityId[];
}
export declare function builtinMcpCapabilitiesSettingsKey(): string;
export declare function listEnabledBuiltinMcpCapabilities(scope: RemoteMcpScope, scopeId: string): Promise<BuiltinMcpCapabilityId[]>;
export declare function setEnabledBuiltinMcpCapabilities(scope: RemoteMcpScope, scopeId: string, ids: readonly string[]): Promise<BuiltinMcpCapabilityId[]>;
export declare function setBuiltinMcpCapabilityEnabled(scope: RemoteMcpScope, scopeId: string, id: string, enabled: boolean): Promise<BuiltinMcpCapabilityId[] | null>;
//# sourceMappingURL=builtin-store.d.ts.map