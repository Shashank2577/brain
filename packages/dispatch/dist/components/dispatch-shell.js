import { jsx as _jsx, jsxs as _jsxs, Fragment as _Fragment } from "react/jsx-runtime";
import { Popover, PopoverContent, PopoverTrigger, } from "../components/ui/popover.js";
import { IconInfoCircle } from "@tabler/icons-react";
import { useSetPageTitle } from "../components/layout/HeaderActions.js";
/**
 * DispatchShell renders the per-page title (with an optional click-to-open
 * description popover) into the global header via the HeaderActions store.
 * The actual chrome (sidebar, AgentSidebar, header bar with AgentToggleButton)
 * is provided by `Layout` mounted in `root.tsx`.
 */
export function DispatchShell({ title, description, children, }) {
    useSetPageTitle(_jsxs("div", { className: "flex items-center gap-2 min-w-0", children: [_jsx("h1", { className: "text-lg font-semibold tracking-tight truncate text-foreground", children: title }), description ? (_jsxs(Popover, { children: [_jsx(PopoverTrigger, { asChild: true, children: _jsx("button", { type: "button", className: "inline-flex h-6 w-6 items-center justify-center rounded-md text-muted-foreground/70 hover:bg-accent hover:text-foreground cursor-pointer", "aria-label": `About ${title}`, children: _jsx(IconInfoCircle, { className: "h-3.5 w-3.5" }) }) }), _jsx(PopoverContent, { side: "bottom", align: "start", className: "max-w-72 text-xs leading-relaxed", children: description })] })) : null] }));
    return _jsx(_Fragment, { children: children });
}
//# sourceMappingURL=dispatch-shell.js.map