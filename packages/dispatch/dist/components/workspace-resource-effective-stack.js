import { jsx as _jsx, jsxs as _jsxs, Fragment as _Fragment } from "react/jsx-runtime";
import { useActionQuery } from "@agent-native/core/client";
import { Badge } from "../components/ui/badge.js";
import { cn } from "../lib/utils.js";
export function appAvailabilityLabel(value) {
    switch (value) {
        case "all-apps":
            return "Inherited by all apps";
        case "selected-granted":
            return "Granted to this app";
        case "selected-not-granted":
            return "Not granted";
        case "selected-no-app":
            return "Select app";
        case "path-not-managed":
            return "Not managed";
        default:
            return "Checking";
    }
}
export function appLayerState(layer) {
    if (layer.effective) {
        return {
            label: "Wins",
            className: "border-green-500/30 bg-green-500/10 text-green-700",
        };
    }
    if (layer.overridden) {
        return {
            label: "Overridden",
            className: "border-amber-500/30 bg-amber-500/10 text-amber-700",
        };
    }
    return {
        label: "Missing",
        className: "text-muted-foreground",
    };
}
export function formatResourceTimestamp(value) {
    if (!value)
        return "not present";
    return new Date(value).toLocaleString();
}
export function AppResourceEffectiveStack({ appId, resource, }) {
    const { data: context, isLoading } = useActionQuery("get-workspace-resource-effective-context", { resourceId: resource.id, appId }, { enabled: !!resource.id });
    const layers = (context?.layers ?? []);
    const active = context?.effectiveResource;
    const availability = context?.availability;
    if (isLoading && !context) {
        return (_jsxs("div", { className: "mt-3 rounded-lg border bg-muted/20 p-3", children: [_jsx("div", { className: "h-3 w-44 animate-pulse rounded bg-muted-foreground/10" }), _jsxs("div", { className: "mt-3 grid gap-2 sm:grid-cols-3", children: [_jsx("div", { className: "h-20 animate-pulse rounded-md bg-muted-foreground/10" }), _jsx("div", { className: "h-20 animate-pulse rounded-md bg-muted-foreground/10" }), _jsx("div", { className: "h-20 animate-pulse rounded-md bg-muted-foreground/10" })] })] }));
    }
    return (_jsxs("div", { className: "mt-3 rounded-lg border bg-muted/20 p-3", children: [_jsxs("div", { className: "flex flex-wrap items-start justify-between gap-2", children: [_jsxs("div", { className: "min-w-0", children: [_jsx("div", { className: "text-xs font-semibold uppercase text-muted-foreground", children: "Effective context stack" }), _jsx("div", { className: "mt-1 truncate font-mono text-[11px] text-muted-foreground", children: resource.path })] }), _jsx(Badge, { variant: "outline", children: appAvailabilityLabel(availability) })] }), _jsx("div", { className: "mt-3 grid gap-2 sm:grid-cols-3", children: layers.map((layer) => {
                    const state = appLayerState(layer);
                    return (_jsxs("div", { className: cn("rounded-md border bg-background/70 p-2", {
                            "border-green-500/30 bg-green-500/10": layer.effective,
                        }), children: [_jsxs("div", { className: "flex items-start justify-between gap-2", children: [_jsx("span", { className: "text-xs font-medium text-foreground", children: layer.label }), _jsx(Badge, { variant: "outline", className: state.className, children: state.label })] }), _jsx("div", { className: "mt-1 truncate font-mono text-[10px] text-muted-foreground", children: layer.owner }), layer.resource ? (_jsxs("div", { className: "mt-2 text-[11px] text-muted-foreground", children: ["Updated ", formatResourceTimestamp(layer.resource.updatedAt)] })) : (_jsx("div", { className: "mt-2 text-[11px] text-muted-foreground", children: "No file at this layer" }))] }, layer.scope));
                }) }), _jsx("div", { className: "mt-3 rounded-md bg-background/70 px-3 py-2 text-xs text-muted-foreground", children: active ? (_jsxs(_Fragment, { children: ["Winning layer:", " ", _jsxs("span", { className: "font-mono text-foreground", children: [active.owner, "/", active.path] })] })) : ("No active resource exists for this path yet.") })] }));
}
//# sourceMappingURL=workspace-resource-effective-stack.js.map