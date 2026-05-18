import { jsx as _jsx, jsxs as _jsxs } from "react/jsx-runtime";
import { IconAlertTriangle, IconBrowser, IconCheck, IconDeviceDesktop, IconLoader2, IconPlugConnected, } from "@tabler/icons-react";
import { cn } from "../utils.js";
import { useToggleBuiltinCapability, } from "./use-builtin-capabilities.js";
export function BuiltinCapabilityDetail({ capability, scope, canEditOrg, }) {
    const toggle = useToggleBuiltinCapability();
    const enabled = capability.enabled[scope];
    const status = capability.status[scope];
    const canToggle = capability.available &&
        (scope === "user" || canEditOrg) &&
        !toggle.isPending;
    const isBrowser = capability.exclusiveGroup === "browser";
    const onToggle = () => {
        if (!canToggle)
            return;
        toggle.mutate({ id: capability.id, scope, enabled: !enabled });
    };
    return (_jsx("div", { className: "flex h-full flex-col overflow-y-auto", children: _jsxs("div", { className: "px-4 py-4", children: [_jsxs("div", { className: "mb-3 flex items-center gap-2", children: [isBrowser ? (_jsx(IconBrowser, { className: "h-4 w-4 text-muted-foreground" })) : (_jsx(IconDeviceDesktop, { className: "h-4 w-4 text-muted-foreground" })), _jsx("h2", { className: "min-w-0 flex-1 truncate text-[14px] font-medium text-foreground", children: capability.name }), _jsx(StatusBadge, { enabled: enabled, status: status })] }), _jsx("p", { className: "mb-4 text-[12px] leading-relaxed text-muted-foreground", children: capability.description }), _jsxs("div", { className: "mb-4 rounded-md border border-border bg-muted/30 p-3", children: [_jsxs("div", { className: "flex items-center justify-between gap-3", children: [_jsxs("div", { className: "min-w-0", children: [_jsxs("div", { className: "text-[12px] font-medium text-foreground", children: [scope === "user" ? "Personal" : "Organization", " access"] }), _jsx("p", { className: "mt-0.5 text-[11px] leading-relaxed text-muted-foreground", children: scope === "user"
                                                ? "Available only to your agent sessions."
                                                : "Available to agents in the active organization." })] }), _jsx("button", { type: "button", role: "switch", "aria-checked": enabled, disabled: !canToggle, onClick: onToggle, className: cn("relative inline-flex h-5 w-9 shrink-0 items-center rounded-full border border-transparent transition-colors", enabled ? "bg-primary" : "bg-muted-foreground/25", !canToggle && "cursor-not-allowed opacity-60"), children: _jsx("span", { className: cn("block h-4 w-4 rounded-full bg-background shadow-sm transition-transform", enabled ? "translate-x-4" : "translate-x-0.5") }) })] }), toggle.isPending && (_jsxs("div", { className: "mt-2 inline-flex items-center gap-1 text-[11px] text-muted-foreground", children: [_jsx(IconLoader2, { className: "h-3 w-3 animate-spin" }), "Updating tools\u2026"] })), toggle.error && (_jsx("div", { className: "mt-2 text-[11px] text-red-600 dark:text-red-400", children: toggle.error instanceof Error
                                ? toggle.error.message
                                : "Could not update this capability." }))] }), _jsxs("dl", { className: "space-y-3", children: [_jsx(Field, { label: "Command", children: _jsxs("code", { className: "rounded bg-muted px-1.5 py-0.5 text-[11px] text-foreground break-all", children: [capability.command, " ", capability.args.join(" ")] }) }), capability.notes && (_jsx(Field, { label: "Requirements", children: _jsx("p", { className: "text-[12px] leading-relaxed text-muted-foreground", children: capability.notes }) })), !capability.available && (_jsx(Field, { label: "Availability", children: _jsx("p", { className: "text-[12px] leading-relaxed text-red-600 dark:text-red-400", children: capability.unavailableReason ?? "Not available on this host." }) })), _jsx(Field, { label: "Tools", children: _jsx(ToolsSummary, { enabled: enabled, status: status }) })] }), capability.id === "computer-use" && (_jsx("p", { className: "mt-6 rounded-md border border-border bg-muted/40 p-2.5 text-[11px] leading-relaxed text-muted-foreground", children: "macOS may ask for Screen Recording and Accessibility permission before the tools can control local apps. The agent should still ask before taking sensitive desktop actions." })), capability.id === "browser-chrome-devtools" && (_jsx("p", { className: "mt-6 rounded-md border border-border bg-muted/40 p-2.5 text-[11px] leading-relaxed text-muted-foreground", children: "Chrome DevTools attaches to your live Chrome profile when remote debugging is available, so it can verify pages that rely on your existing login." }))] }) }));
}
function Field({ label, children, }) {
    return (_jsxs("div", { children: [_jsx("dt", { className: "mb-1 text-[10px] font-semibold uppercase tracking-wide text-muted-foreground/70", children: label }), _jsx("dd", { children: children })] }));
}
function StatusBadge({ enabled, status, }) {
    if (!enabled) {
        return (_jsx("span", { className: "inline-flex items-center gap-1 rounded-full bg-muted px-2 py-0.5 text-[10px] font-medium text-muted-foreground", children: "Off" }));
    }
    if (status?.state === "connected") {
        return (_jsxs("span", { className: "inline-flex items-center gap-1 rounded-full bg-green-500/10 px-2 py-0.5 text-[10px] font-medium text-green-600 dark:text-green-400", children: [_jsx(IconCheck, { className: "h-2.5 w-2.5" }), "Connected"] }));
    }
    if (status?.state === "error") {
        return (_jsxs("span", { className: "inline-flex items-center gap-1 rounded-full bg-red-500/10 px-2 py-0.5 text-[10px] font-medium text-red-600 dark:text-red-400", title: status.error, children: [_jsx(IconAlertTriangle, { className: "h-2.5 w-2.5" }), "Error"] }));
    }
    return (_jsxs("span", { className: "inline-flex items-center gap-1 rounded-full bg-muted px-2 py-0.5 text-[10px] font-medium text-muted-foreground", children: [_jsx(IconPlugConnected, { className: "h-2.5 w-2.5" }), "Ready"] }));
}
function ToolsSummary({ enabled, status, }) {
    if (!enabled) {
        return (_jsx("span", { className: "text-[12px] text-muted-foreground", children: "Disabled. Toggle it on to expose MCP tools to the agent." }));
    }
    if (status?.state === "connected") {
        return (_jsxs("span", { className: "text-[12px] text-foreground", children: [status.toolCount, " tool", status.toolCount === 1 ? "" : "s", " exposed"] }));
    }
    if (status?.state === "error") {
        return (_jsx("span", { className: "text-[12px] text-red-600 dark:text-red-400", children: status.error }));
    }
    return (_jsx("span", { className: "text-[12px] text-muted-foreground", children: "Enabled. Tools will appear after the MCP manager connects." }));
}
//# sourceMappingURL=BuiltinCapabilityDetail.js.map