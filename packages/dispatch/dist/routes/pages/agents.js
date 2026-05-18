import { jsx as _jsx } from "react/jsx-runtime";
import { useActionQuery } from "@agent-native/core/client";
import { AgentsPanel } from "../../components/agents-panel.js";
import { DispatchShell } from "../../components/dispatch-shell.js";
export function meta() {
    return [{ title: "Agents — Dispatch" }];
}
export default function AgentsRoute() {
    const { data, refetch } = useActionQuery("list-connected-agents", {});
    return (_jsx(DispatchShell, { title: "Agents", description: "Dispatch can delegate to the built-in app suite over A2A by default. Add extra agents here only if you want to route work to apps outside that built-in set.", children: _jsx(AgentsPanel, { agents: (data || []), onRefresh: refetch }) }));
}
//# sourceMappingURL=agents.js.map