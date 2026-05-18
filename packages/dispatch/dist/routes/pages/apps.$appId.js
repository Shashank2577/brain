import { jsx as _jsx, jsxs as _jsxs } from "react/jsx-runtime";
import { useEffect, useMemo } from "react";
import { Link, useParams } from "react-router";
import { useActionQuery } from "@agent-native/core/client";
import { IconArrowLeft, IconArrowUpRight, IconClockHour4, } from "@tabler/icons-react";
import { DispatchShell } from "../../components/dispatch-shell.js";
import { Badge } from "../../components/ui/badge.js";
import { Button } from "../../components/ui/button.js";
import { Skeleton } from "../../components/ui/skeleton.js";
import { workspaceAppHref, } from "../../lib/workspace-apps.js";
export function meta() {
    return [{ title: "Workspace app - Dispatch" }];
}
export default function WorkspaceAppRoute() {
    const { appId } = useParams();
    const { data: apps = [], isLoading } = useActionQuery("list-workspace-apps", { includeAgentCards: false }, {
        refetchInterval: 2_000,
    });
    const app = useMemo(() => apps.find((item) => item.id === appId) ?? null, [appId, apps]);
    const href = app ? workspaceAppHref(app) : null;
    useEffect(() => {
        if (!app || app.status === "pending" || !href)
            return;
        window.location.assign(href);
    }, [app, href]);
    return (_jsx(DispatchShell, { title: app?.name || "Workspace App", description: "Open a deployed app or check the status of an app being created.", children: _jsxs("div", { className: "max-w-2xl rounded-lg border bg-card p-5", children: [_jsx(Button, { asChild: true, size: "sm", variant: "ghost", className: "-ml-2 mb-4", children: _jsxs(Link, { to: "/apps", children: [_jsx(IconArrowLeft, { size: 15, className: "mr-1.5" }), "Apps"] }) }), isLoading && !app ? (_jsxs("div", { className: "space-y-3", children: [_jsx(Skeleton, { className: "h-5 w-48" }), _jsx(Skeleton, { className: "h-4 w-full" }), _jsx(Skeleton, { className: "h-4 w-2/3" })] })) : !app ? (_jsxs("div", { className: "space-y-3", children: [_jsx("h2", { className: "text-base font-semibold text-foreground", children: "App not found" }), _jsx("p", { className: "text-sm text-muted-foreground", children: "This route is not in the workspace app list yet." })] })) : app.status === "pending" ? (_jsxs("div", { className: "space-y-4", children: [_jsxs("div", { className: "flex flex-wrap items-center gap-2", children: [_jsx("h2", { className: "text-base font-semibold text-foreground", children: app.name }), _jsxs(Badge, { variant: "outline", className: "gap-1 border-amber-500/30 bg-amber-500/10 text-amber-700 dark:text-amber-300", children: [_jsx(IconClockHour4, { size: 12 }), "Building"] })] }), _jsxs("p", { className: "text-sm text-muted-foreground", children: ["This app is being created. It will be available at", " ", _jsx("span", { className: "font-mono text-foreground", children: app.path }), " ", "after its branch is merged and the workspace deploy finishes."] }), app.branchName ? (_jsxs("p", { className: "text-xs text-muted-foreground", children: ["Branch: ", app.branchName] })) : null, app.builderUrl ? (_jsx(Button, { asChild: true, children: _jsxs("a", { href: app.builderUrl, target: "_blank", rel: "noreferrer", children: ["Open Builder branch", _jsx(IconArrowUpRight, { size: 15, className: "ml-1.5" })] }) })) : null] })) : (_jsxs("div", { className: "space-y-3", children: [_jsxs("h2", { className: "text-base font-semibold text-foreground", children: ["Opening ", app.name] }), _jsxs("p", { className: "text-sm text-muted-foreground", children: ["Redirecting to", " ", _jsx("span", { className: "font-mono text-foreground", children: app.path }), "."] }), href ? (_jsx(Button, { asChild: true, children: _jsxs("a", { href: href, children: ["Open app", _jsx(IconArrowUpRight, { size: 15, className: "ml-1.5" })] }) })) : null] }))] }) }));
}
//# sourceMappingURL=apps.$appId.js.map