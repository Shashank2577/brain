import { jsx as _jsx, jsxs as _jsxs, Fragment as _Fragment } from "react/jsx-runtime";
import { useState } from "react";
import { useActionMutation, useActionQuery } from "@agent-native/core/client";
import { IconApps, IconBrush, IconCalendarMonth, IconChartBar, IconClipboardList, IconEyeOff, IconFileText, IconLoader2, IconMail, IconPlus, IconPresentation, IconScreenShare, IconSparkles, IconStack3, IconVideo, } from "@tabler/icons-react";
import { toast } from "sonner";
import { CreateAppPopover } from "../../components/create-app-popover.js";
import { DispatchShell } from "../../components/dispatch-shell.js";
import { WorkspaceAppCard } from "../../components/workspace-app-card.js";
import { Button } from "../../components/ui/button.js";
export function meta() {
    return [{ title: "Apps — Dispatch" }];
}
const TEMPLATE_ICONS = {
    Mail: IconMail,
    CalendarMonth: IconCalendarMonth,
    FileText: IconFileText,
    Presentation: IconPresentation,
    ScreenShare: IconScreenShare,
    ChartBar: IconChartBar,
    ClipboardList: IconClipboardList,
    Brush: IconBrush,
    Video: IconVideo,
};
export default function AppsRoute() {
    const [showHidden, setShowHidden] = useState(false);
    const { data: apps = [] } = useActionQuery("list-workspace-apps", { includeAgentCards: false, includeArchived: true }, {
        refetchInterval: 2_000,
    });
    const { data: workspace } = useActionQuery("get-workspace-info", {}, { staleTime: 60_000 });
    const { data: templates = [] } = useActionQuery("list-available-workspace-templates", {}, { refetchInterval: 5_000 });
    const ws = workspace;
    const workspaceLabel = ws?.displayName ?? ws?.name ?? null;
    const allApps = apps.filter((app) => !app.isDispatch);
    const visibleApps = allApps.filter((app) => !app.archived);
    const archivedApps = allApps.filter((app) => app.archived);
    const typedTemplates = templates;
    return (_jsx(DispatchShell, { title: "Apps", description: workspaceLabel
            ? `Apps in the "${workspaceLabel}" workspace. Each app gets its own route under this workspace and shares its database, auth, and agent chat.`
            : "Open workspace apps and start new app creation from Dispatch.", children: _jsxs("div", { className: "space-y-6", children: [_jsxs("section", { className: "space-y-3", children: [_jsxs("div", { className: "flex items-center justify-between gap-3", children: [_jsxs("div", { className: "flex items-center gap-2", children: [_jsx(IconApps, { size: 16, className: "text-muted-foreground" }), _jsx("h2", { className: "text-sm font-semibold text-foreground", children: workspaceLabel
                                                ? `Apps in ${workspaceLabel}`
                                                : "Workspace apps" })] }), _jsx(CreateAppPopover, { align: "end", trigger: _jsxs(Button, { size: "sm", variant: "outline", children: [_jsx(IconPlus, { size: 15, className: "mr-1.5" }), "App"] }) })] }), _jsxs("div", { className: "grid gap-3 md:grid-cols-2 xl:grid-cols-3", children: [visibleApps.map((app) => (_jsx(WorkspaceAppCard, { app: app }, app.id))), _jsx(CreateAppPopover, {})] })] }), typedTemplates.length > 0 ? (_jsxs("section", { className: "space-y-3", children: [_jsxs("div", { className: "flex items-center gap-2", children: [_jsx(IconStack3, { size: 16, className: "text-muted-foreground" }), _jsx("h2", { className: "text-sm font-semibold text-foreground", children: "Add a template" }), _jsxs("span", { className: "text-xs text-muted-foreground", children: ["Scaffold a first-party app into", " ", _jsx("code", { className: "font-mono text-[11px]", children: "apps/" }), "."] })] }), _jsx("div", { className: "grid gap-3 md:grid-cols-2 xl:grid-cols-3", children: typedTemplates.map((template) => (_jsx(AddTemplateCard, { template: template }, template.name))) })] })) : null, archivedApps.length > 0 ? (_jsxs("section", { className: "space-y-3", children: [_jsxs("button", { type: "button", onClick: () => setShowHidden((cur) => !cur), className: "inline-flex cursor-pointer items-center gap-2 text-xs text-muted-foreground hover:text-foreground", children: [_jsx(IconEyeOff, { size: 14 }), showHidden ? "Hide" : "Show", " ", archivedApps.length, " hidden", " ", archivedApps.length === 1 ? "app" : "apps"] }), showHidden ? (_jsx("div", { className: "grid gap-3 md:grid-cols-2 xl:grid-cols-3", children: archivedApps.map((app) => (_jsx(WorkspaceAppCard, { app: app }, app.id))) })) : null] })) : null] }) }));
}
function AddTemplateCard({ template }) {
    const Icon = TEMPLATE_ICONS[template.icon] ?? IconSparkles;
    const scaffold = useActionMutation("scaffold-workspace-app", {
        onSuccess: (result) => {
            toast.success(`Scaffolded apps/${result?.appId || template.name}. The gateway will pick it up shortly.`);
        },
        onError: (err) => {
            toast.error(`Could not scaffold ${template.label}: ${err instanceof Error ? err.message : String(err)}`);
        },
    });
    return (_jsxs("div", { className: "group relative flex items-start gap-3 rounded-lg border bg-card p-4 transition hover:border-foreground/30", children: [_jsx("div", { className: "flex h-9 w-9 shrink-0 items-center justify-center rounded-md", style: {
                    backgroundColor: `rgb(${template.colorRgb} / 0.12)`,
                    color: template.color,
                }, children: _jsx(Icon, { size: 18 }) }), _jsxs("div", { className: "min-w-0 flex-1", children: [_jsx("div", { className: "flex min-w-0 items-center gap-2", children: _jsx("h3", { className: "truncate text-sm font-semibold text-foreground", children: template.label }) }), _jsx("p", { className: "mt-1 line-clamp-2 text-xs leading-relaxed text-muted-foreground", children: template.hint }), _jsx("div", { className: "mt-3", children: _jsx(Button, { size: "sm", variant: "outline", disabled: scaffold.isPending, onClick: () => scaffold.mutate({ template: template.name }), children: scaffold.isPending ? (_jsxs(_Fragment, { children: [_jsx(IconLoader2, { size: 14, className: "mr-1.5 animate-spin" }), "Adding\u2026"] })) : (_jsxs(_Fragment, { children: [_jsx(IconPlus, { size: 14, className: "mr-1.5" }), "Add to workspace"] })) }) })] })] }));
}
//# sourceMappingURL=apps.js.map