import { jsx as _jsx, jsxs as _jsxs } from "react/jsx-runtime";
import { useActionQuery } from "@agent-native/core/client";
import { DispatchShell } from "../../components/dispatch-shell.js";
export function meta() {
    return [{ title: "Audit — Dispatch" }];
}
export default function AuditRoute() {
    const { data } = useActionQuery("list-dispatch-audit", { limit: 100 });
    return (_jsx(DispatchShell, { title: "Audit", description: "Change history for routes, settings, and approvals.", children: _jsx("section", { className: "rounded-2xl border bg-card p-5", children: _jsxs("div", { className: "space-y-3", children: [(data || []).map((event) => (_jsxs("div", { className: "rounded-xl border bg-muted/30 px-4 py-3", children: [_jsx("div", { className: "text-sm font-medium text-foreground", children: event.summary }), _jsxs("div", { className: "mt-1 text-xs text-muted-foreground", children: [event.actor, " \u00B7 ", event.action, " \u00B7", " ", new Date(event.createdAt).toLocaleString()] })] }, event.id))), (data?.length || 0) === 0 && (_jsx("div", { className: "rounded-xl border border-dashed px-4 py-6 text-sm text-muted-foreground", children: "No audit entries yet." }))] }) }) }));
}
//# sourceMappingURL=audit.js.map