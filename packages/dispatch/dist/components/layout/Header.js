import { jsx as _jsx, jsxs as _jsxs } from "react/jsx-runtime";
import { useLocation } from "react-router";
import { useHeaderTitle, useHeaderActions } from "./HeaderActions.js";
import { AgentToggleButton } from "@agent-native/core/client";
import { Button } from "../../components/ui/button.js";
import { IconLayoutSidebar } from "@tabler/icons-react";
const pageTitles = {
    "/": "Overview",
    "/overview": "Overview",
    "/vault": "Vault",
    "/integrations": "Integrations",
    "/workspace": "Resources",
    "/messaging": "Messaging",
    "/agents": "Agents",
    "/destinations": "Destinations",
    "/identities": "Identities",
    "/approvals": "Approvals",
    "/audit": "Audit",
    "/team": "Team",
};
function resolveTitle(pathname) {
    if (pageTitles[pathname])
        return pageTitles[pathname];
    if (pathname.startsWith("/extensions"))
        return "Extensions";
    return "Dispatch";
}
export function Header({ onOpenMobile, showAgentToggle = true, }) {
    const location = useLocation();
    const title = useHeaderTitle();
    const actions = useHeaderActions();
    return (_jsxs("header", { className: "flex h-12 shrink-0 items-center gap-3 border-b border-border bg-background px-4 lg:px-6", children: [onOpenMobile ? (_jsx(Button, { variant: "ghost", size: "icon", className: "h-8 w-8 lg:hidden cursor-pointer", onClick: onOpenMobile, "aria-label": "Open navigation", children: _jsx(IconLayoutSidebar, {}) })) : null, _jsx("div", { className: "flex items-center gap-3 flex-1 min-w-0", children: title ?? (_jsx("h1", { className: "text-lg font-semibold tracking-tight truncate", children: resolveTitle(location.pathname) })) }), _jsxs("div", { className: "flex items-center gap-2 shrink-0", children: [actions, showAgentToggle ? (_jsx(AgentToggleButton, { className: "h-8 w-8 rounded-md hover:bg-accent" })) : null] })] }));
}
//# sourceMappingURL=Header.js.map