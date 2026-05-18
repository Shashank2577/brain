import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { agentNativePath } from "../api-path.js";
const ENDPOINT = agentNativePath("/_agent-native/mcp/builtin");
export const BUILTIN_CAPABILITIES_KEY = ["mcp-builtin-capabilities"];
export function useBuiltinCapabilities() {
    return useQuery({
        queryKey: BUILTIN_CAPABILITIES_KEY,
        queryFn: async () => {
            const res = await fetch(ENDPOINT, { credentials: "include" });
            if (!res.ok)
                throw new Error(`Failed to load (${res.status})`);
            return (await res.json());
        },
        staleTime: 10_000,
    });
}
export function useToggleBuiltinCapability() {
    const qc = useQueryClient();
    return useMutation({
        mutationFn: async (args) => {
            const res = await fetch(ENDPOINT, {
                method: "POST",
                credentials: "include",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify(args),
            });
            const body = (await res.json().catch(() => ({})));
            if (!res.ok || !body.ok) {
                throw new Error(body.error || `Update failed (${res.status})`);
            }
            return body;
        },
        onSuccess: () => {
            qc.invalidateQueries({ queryKey: BUILTIN_CAPABILITIES_KEY });
            qc.invalidateQueries({ queryKey: ["mcp-servers"] });
        },
    });
}
export function mcpBuiltinVirtualId(scope, capabilityId) {
    return `mcp-builtin:${scope}:${capabilityId}`;
}
export function parseMcpBuiltinVirtualId(id) {
    const m = /^mcp-builtin:(user|org):(.+)$/.exec(id);
    if (!m)
        return null;
    const capabilityId = m[2];
    if (capabilityId !== "browser-chrome-devtools" &&
        capabilityId !== "browser-playwright" &&
        capabilityId !== "computer-use") {
        return null;
    }
    return { scope: m[1], capabilityId };
}
//# sourceMappingURL=use-builtin-capabilities.js.map