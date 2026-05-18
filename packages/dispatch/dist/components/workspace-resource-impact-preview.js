import { jsx as _jsx, jsxs as _jsxs } from "react/jsx-runtime";
import { useActionQuery } from "@agent-native/core/client";
import { Badge } from "../components/ui/badge.js";
import { Skeleton } from "../components/ui/skeleton.js";
import { formatResourceTimestamp } from "./workspace-resource-effective-stack.js";
function isApprovalRequest(result) {
    return (result?.status === "pending" &&
        typeof result?.changeType === "string" &&
        result.changeType.startsWith("workspace-resource."));
}
export function workspaceResourceMutationMessage(result, fallback) {
    return isApprovalRequest(result) ? "Approval requested" : fallback;
}
export function ImpactPreview({ operation, resourceId, path, scope, enabled = true, }) {
    const { data: impact, isLoading } = useActionQuery("preview-workspace-resource-change", {
        operation,
        resourceId,
        path,
        scope,
    }, { enabled: enabled && Boolean(resourceId || path) });
    if (!enabled || (!resourceId && !path))
        return null;
    if (isLoading) {
        return (_jsxs("div", { className: "rounded-lg border bg-muted/30 p-3", children: [_jsx(Skeleton, { className: "h-4 w-40" }), _jsx(Skeleton, { className: "mt-2 h-3 w-72" })] }));
    }
    const data = impact;
    if (!data)
        return null;
    const affectsAllApps = data.affectsAllApps === true;
    const appCount = data.affectedApps?.count;
    const overrides = data.overrides ?? { count: 0, items: [] };
    const willRequestApproval = data.approval?.willRequestApproval === true;
    return (_jsxs("div", { className: "rounded-lg border bg-muted/30 p-3 text-xs", children: [_jsxs("div", { className: "flex flex-wrap items-center gap-2", children: [_jsx(Badge, { variant: affectsAllApps ? "secondary" : "outline", children: affectsAllApps ? "All apps impact" : "Selected only" }), willRequestApproval ? (_jsx(Badge, { variant: "outline", className: "border-amber-500/30 bg-amber-500/10 text-amber-700 dark:text-amber-300", children: "Approval required" })) : null, overrides.count > 0 ? (_jsxs(Badge, { variant: "outline", children: [overrides.count, " override", overrides.count === 1 ? "" : "s"] })) : null] }), _jsxs("p", { className: "mt-2 leading-relaxed text-muted-foreground", children: [affectsAllApps
                        ? `This change applies to every workspace app${typeof appCount === "number" ? ` (${appCount} discovered)` : ""}.`
                        : "This change only applies to explicitly granted apps.", " ", willRequestApproval
                        ? "It will be queued for approval before it takes effect."
                        : "It will take effect immediately when saved."] }), overrides.count > 0 ? (_jsxs("div", { className: "mt-2 space-y-1", children: [overrides.items.slice(0, 4).map((override) => (_jsxs("div", { className: "flex items-center justify-between gap-3 rounded-md border bg-background px-2 py-1.5", children: [_jsx("span", { className: "min-w-0 truncate text-muted-foreground", children: override.label }), _jsx("span", { className: "shrink-0 font-mono text-[11px] text-muted-foreground", children: formatResourceTimestamp(override.updatedAt) })] }, `${override.scope}:${override.owner}`))), overrides.count > 4 ? (_jsxs("div", { className: "text-muted-foreground", children: ["+", overrides.count - 4, " more override", overrides.count - 4 === 1 ? "" : "s"] })) : null] })) : null] }));
}
//# sourceMappingURL=workspace-resource-impact-preview.js.map