import { jsx as _jsx, jsxs as _jsxs, Fragment as _Fragment } from "react/jsx-runtime";
import { useState } from "react";
import { NavLink, useLocation } from "react-router";
import { AgentSidebar, FeedbackButton, appBasePath, appPath, useActionQuery, } from "@agent-native/core/client";
import { ExtensionsSidebarSection } from "@agent-native/core/client/extensions";
import { InvitationBanner, OrgSwitcher } from "@agent-native/core/client/org";
import { IconArrowUpRight, IconApps, IconChartBar, IconBrandTelegram, IconKey, IconChevronDown, IconLayersSubtract, IconMessages, IconPlugConnected, IconBroadcast, IconFingerprint, IconHistory, IconPuzzle, IconShieldCheck, IconUsersGroup, } from "@tabler/icons-react";
import { cn } from "../../lib/utils.js";
import { Sheet, SheetContent, SheetDescription, SheetTitle, } from "../../components/ui/sheet.js";
import { Header } from "./Header.js";
import { HeaderActionsProvider } from "./HeaderActions.js";
const PRIMARY_NAV_ITEMS = [
    {
        id: "overview",
        to: "/overview",
        label: "Overview",
        icon: IconBroadcast,
        section: "primary",
    },
    {
        id: "apps",
        to: "/apps",
        label: "Apps",
        icon: IconApps,
        section: "primary",
    },
    {
        id: "metrics",
        to: "/metrics",
        label: "Metrics",
        icon: IconChartBar,
        section: "primary",
    },
    {
        id: "vault",
        to: "/vault",
        label: "Vault",
        icon: IconKey,
        section: "primary",
    },
    {
        id: "integrations",
        to: "/integrations",
        label: "Integrations",
        icon: IconPuzzle,
        section: "primary",
    },
    {
        id: "agents",
        to: "/agents",
        label: "Agents",
        icon: IconPlugConnected,
        section: "primary",
    },
];
const OPERATIONS_NAV_ITEMS = [
    {
        id: "workspace",
        to: "/workspace",
        label: "Resources",
        icon: IconLayersSubtract,
        section: "operations",
    },
    {
        id: "messaging",
        to: "/messaging",
        label: "Messaging",
        icon: IconBrandTelegram,
        section: "operations",
    },
    {
        id: "destinations",
        to: "/destinations",
        label: "Destinations",
        icon: IconArrowUpRight,
        section: "operations",
    },
    {
        id: "identities",
        to: "/identities",
        label: "Identities",
        icon: IconFingerprint,
        section: "operations",
    },
    {
        id: "approvals",
        to: "/approvals",
        label: "Approvals",
        icon: IconShieldCheck,
        section: "operations",
    },
    {
        id: "audit",
        to: "/audit",
        label: "Audit",
        icon: IconHistory,
        section: "operations",
    },
    {
        id: "thread-debug",
        to: "/thread-debug",
        label: "Thread Debug",
        icon: IconMessages,
        section: "operations",
    },
    {
        id: "team",
        to: "/team",
        label: "Team",
        icon: IconUsersGroup,
        section: "operations",
    },
];
const EMPTY_NAV_ITEMS = [];
const SIDEBAR_SUGGESTIONS = [
    "Build a workspace app for X",
    "Route Slack mentions to my analytics app",
    "Grant my OpenAI key to this app",
];
const CHROMELESS_PATHS = ["/approval"];
// Routes whose page renders its own toolbar (with NotificationsBell + AgentToggleButton).
// Layout still mounts the sidebar + AgentSidebar, but skips its own Header so
// there's no double-header.
function pageOwnsToolbar(pathname) {
    if (pathname === "/tools" || pathname.startsWith("/tools/"))
        return true;
    if (pathname === "/extensions" || pathname.startsWith("/extensions/"))
        return true;
    return false;
}
function sectionFor(item) {
    return item.section ?? "operations";
}
function navItemMatchesPath(item, pathname) {
    if (item.match) {
        try {
            if (item.match(pathname))
                return true;
        }
        catch {
            return false;
        }
    }
    return pathname === item.to || pathname.startsWith(`${item.to}/`);
}
function navItemsForSection(items, section) {
    return items.filter((item) => sectionFor(item) === section);
}
function localDispatchPath(pathname) {
    const basePath = appBasePath();
    if (!basePath)
        return pathname;
    if (pathname === basePath)
        return "/";
    if (pathname.startsWith(`${basePath}/`)) {
        return pathname.slice(basePath.length) || "/";
    }
    return pathname;
}
function dispatchNavLinkTarget(path) {
    if (typeof window === "undefined")
        return path;
    const basePath = appBasePath();
    if (!basePath)
        return path;
    // Mirror the basename calculation entry.client.tsx uses to configure the
    // router (basePath iff the current URL is under that mount, "" otherwise).
    // Reading the live URL directly avoids races with the previous check on
    // `__reactRouterContext.basename`, which could read undefined before the
    // entry script set it — that race produced /dispatch/dispatch/<route>
    // history entries that 404'd on back-button navigation.
    const pathname = window.location.pathname;
    const routerHasBasename = pathname === basePath || pathname.startsWith(`${basePath}/`);
    return routerHasBasename ? path : appPath(path);
}
export function NavContent({ onNavigate, extensions, }) {
    const location = useLocation();
    const { data: workspace } = useActionQuery("get-workspace-info", {}, { staleTime: 60_000 });
    const ws = workspace;
    const workspaceLabel = ws?.displayName ?? ws?.name ?? null;
    const extensionNavItems = extensions?.navItems ?? EMPTY_NAV_ITEMS;
    const primaryNavItems = [
        ...PRIMARY_NAV_ITEMS,
        ...navItemsForSection(extensionNavItems, "primary"),
    ];
    const operationsNavItems = [
        ...OPERATIONS_NAV_ITEMS,
        ...navItemsForSection(extensionNavItems, "operations"),
    ];
    const localPathname = localDispatchPath(location.pathname);
    const operationsOpen = operationsNavItems.some((item) => navItemMatchesPath(item, localPathname));
    const renderNavItem = (item) => {
        const Icon = item.icon;
        return (_jsx("li", { children: _jsxs(NavLink, { to: dispatchNavLinkTarget(item.to), onClick: onNavigate, className: ({ isActive }) => {
                    const active = isActive || navItemMatchesPath(item, localPathname);
                    return cn("flex h-8 w-full items-center gap-2 rounded-md px-2 text-sm", active
                        ? "bg-sidebar-accent font-medium text-sidebar-accent-foreground"
                        : "text-sidebar-foreground/70 hover:bg-sidebar-accent hover:text-sidebar-accent-foreground");
                }, children: [Icon ? (_jsx(Icon, { size: 16, className: "shrink-0" })) : (_jsx("span", { className: "h-4 w-4 shrink-0", "aria-hidden": "true" })), _jsx("span", { className: "truncate", children: item.label })] }) }, item.id));
    };
    return (_jsxs(_Fragment, { children: [_jsx("div", { className: "border-b px-4 py-3", children: _jsxs("div", { className: "flex items-center gap-3", children: [_jsxs("div", { className: "flex h-9 w-9 items-center justify-center rounded-xl border bg-card text-foreground", children: [_jsx("img", { src: appPath("/agent-native-icon-light.svg"), alt: "", "aria-hidden": "true", className: "block h-4 w-auto shrink-0 dark:hidden" }), _jsx("img", { src: appPath("/agent-native-icon-dark.svg"), alt: "", "aria-hidden": "true", className: "hidden h-4 w-auto shrink-0 dark:block" })] }), _jsxs("div", { className: "min-w-0", children: [_jsx("div", { className: "truncate text-sm font-semibold text-foreground", children: workspaceLabel ?? "Dispatch" }), _jsx("div", { className: "truncate text-xs text-muted-foreground", children: workspaceLabel
                                        ? `Workspace · ${ws?.appCount ?? 0} app${ws?.appCount === 1 ? "" : "s"}`
                                        : "Workspace control plane" })] })] }) }), _jsxs("div", { className: "flex min-h-0 flex-1 flex-col overflow-y-auto", children: [_jsx("nav", { className: "px-2 py-3", children: _jsx("ul", { className: "space-y-0.5", children: primaryNavItems.map(renderNavItem) }) }), _jsxs("div", { className: "mt-auto shrink-0", children: [_jsx("div", { className: "border-t px-2 py-2", children: _jsxs("details", { className: "group", open: operationsOpen, children: [_jsxs("summary", { className: "flex h-8 cursor-pointer list-none items-center justify-between rounded-md px-2 text-xs font-medium uppercase text-sidebar-foreground/50 hover:bg-sidebar-accent hover:text-sidebar-accent-foreground [&::-webkit-details-marker]:hidden", children: [_jsx("span", { children: "Operations" }), _jsx(IconChevronDown, { size: 14, className: "transition-transform group-open:rotate-180" })] }), _jsx("ul", { className: "mt-1 space-y-0.5", children: operationsNavItems.map(renderNavItem) })] }) }), _jsx("div", { className: "border-t px-2 py-1", children: _jsx(ExtensionsSidebarSection, {}) }), _jsx("div", { className: "border-t px-3 py-2", children: _jsx(OrgSwitcher, {}) }), _jsx("div", { className: "border-t px-3 py-2", children: _jsx(FeedbackButton, {}) })] })] })] }));
}
export function Layout({ children, extensions, }) {
    const location = useLocation();
    const [mobileOpen, setMobileOpen] = useState(false);
    if (CHROMELESS_PATHS.some((path) => location.pathname === path)) {
        return _jsx(_Fragment, { children: children });
    }
    const showHeader = !pageOwnsToolbar(location.pathname);
    const appContent = (_jsxs("div", { className: "flex h-full flex-1 flex-col overflow-hidden", children: [showHeader ? _jsx(Header, { onOpenMobile: () => setMobileOpen(true) }) : null, _jsx(InvitationBanner, {}), _jsx("main", { className: "flex-1 overflow-y-auto", children: showHeader ? (_jsx("div", { className: "mx-auto max-w-7xl space-y-10 px-4 py-6 sm:px-6", children: children })) : (children) })] }));
    return (_jsx(HeaderActionsProvider, { children: _jsxs("div", { className: "flex h-screen w-full overflow-hidden bg-background", children: [_jsx("aside", { className: "hidden lg:flex w-64 shrink-0 flex-col border-r bg-sidebar text-sidebar-foreground", children: _jsx(NavContent, { extensions: extensions }) }), _jsx(Sheet, { open: mobileOpen, onOpenChange: setMobileOpen, children: _jsxs(SheetContent, { side: "left", className: "w-72 p-0 bg-sidebar text-sidebar-foreground [&>button]:hidden", children: [_jsx(SheetTitle, { className: "sr-only", children: "Navigation" }), _jsx(SheetDescription, { className: "sr-only", children: "Workspace navigation links" }), _jsx("div", { className: "flex h-full w-full flex-col", children: _jsx(NavContent, { extensions: extensions, onNavigate: () => setMobileOpen(false) }) })] }) }), _jsx(AgentSidebar, { position: "right", defaultOpen: false, emptyStateText: "Create apps, grant keys, and route work across the workspace.", suggestions: SIDEBAR_SUGGESTIONS, children: appContent })] }) }));
}
//# sourceMappingURL=Layout.js.map