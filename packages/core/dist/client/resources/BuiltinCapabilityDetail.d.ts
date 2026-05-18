import type { McpServerScope } from "./use-mcp-servers.js";
import { type BuiltinCapability } from "./use-builtin-capabilities.js";
interface BuiltinCapabilityDetailProps {
    capability: BuiltinCapability;
    scope: McpServerScope;
    canEditOrg: boolean;
}
export declare function BuiltinCapabilityDetail({ capability, scope, canEditOrg, }: BuiltinCapabilityDetailProps): import("react/jsx-runtime").JSX.Element;
export {};
//# sourceMappingURL=BuiltinCapabilityDetail.d.ts.map