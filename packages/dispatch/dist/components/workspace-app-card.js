import { jsx as _jsx, jsxs as _jsxs } from "react/jsx-runtime";
import { useActionMutation } from "@agent-native/core/client";
import { IconArrowUpRight, IconClockHour4, IconDots, IconEye, IconEyeOff, IconTrash, } from "@tabler/icons-react";
import { toast } from "sonner";
import { AppKeysPopover } from "../components/app-keys-popover.js";
import { Badge } from "../components/ui/badge.js";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger, } from "../components/ui/dropdown-menu.js";
import { cn } from "../lib/utils.js";
import { isPendingBuilderHref, workspaceAppHref, } from "../lib/workspace-apps.js";
export function WorkspaceAppCard({ app, className, }) {
    const href = workspaceAppHref(app);
    const openInNewTab = isPendingBuilderHref(app);
    const isPending = app.status === "pending";
    const isArchived = !!app.archived;
    const archive = useActionMutation("archive-workspace-app", {
        onError: (err) => toast.error(`Could not hide ${app.name}: ${stringifyError(err)}`),
    });
    const unarchive = useActionMutation("unarchive-workspace-app", {
        onError: (err) => toast.error(`Could not restore ${app.name}: ${stringifyError(err)}`),
    });
    const removePending = useActionMutation("remove-pending-workspace-app", {
        onError: (err) => toast.error(`Could not remove ${app.name}: ${stringifyError(err)}`),
    });
    const handleArchive = () => {
        archive.mutate({ appId: app.id });
        toast.success(`Hid ${app.name} from the Apps list`);
    };
    const handleUnarchive = () => {
        unarchive.mutate({ appId: app.id });
        toast.success(`Restored ${app.name} to the Apps list`);
    };
    const handleRemovePending = () => {
        removePending.mutate({ appId: app.id });
        toast.success(`Removed pending ${app.name}`);
    };
    return (_jsxs("div", { "aria-disabled": !href, className: cn("group relative rounded-lg border bg-card p-4 transition hover:border-foreground/30 aria-disabled:opacity-60", isArchived && "opacity-70", className), children: [href ? (_jsx("a", { href: href, target: openInNewTab ? "_blank" : undefined, rel: openInNewTab ? "noreferrer" : undefined, "aria-label": `Open ${app.name}`, className: "absolute inset-0 z-0 rounded-lg" })) : null, _jsxs("div", { className: "pointer-events-none relative z-10 flex h-full items-start justify-between gap-3", children: [_jsxs("div", { className: "min-w-0", children: [_jsxs("div", { className: "flex min-w-0 items-center gap-2", children: [_jsx("h3", { className: "truncate text-sm font-semibold text-foreground", children: app.name }), isPending ? (_jsxs(Badge, { variant: "outline", className: "shrink-0 gap-1 border-amber-500/30 bg-amber-500/10 text-amber-700 dark:text-amber-300", children: [_jsx(IconClockHour4, { size: 12 }), "Building"] })) : null, isArchived ? (_jsxs(Badge, { variant: "outline", className: "shrink-0 gap-1", children: [_jsx(IconEyeOff, { size: 12 }), "Hidden"] })) : null] }), _jsx("p", { className: "mt-1 truncate font-mono text-xs text-muted-foreground", children: app.path }), isPending && app.branchName ? (_jsxs("p", { className: "mt-1 truncate text-xs text-muted-foreground", children: ["Branch: ", app.branchName] })) : null, app.description ? (_jsx("p", { className: "mt-2 line-clamp-2 text-xs leading-relaxed text-muted-foreground", children: app.description })) : null] }), _jsxs("div", { className: "flex shrink-0 items-center gap-1", children: [!isPending && !isArchived ? (_jsx("div", { className: "pointer-events-auto", children: _jsx(AppKeysPopover, { appId: app.id, appName: app.name }) })) : null, _jsx("div", { className: "pointer-events-auto", children: _jsxs(DropdownMenu, { children: [_jsx(DropdownMenuTrigger, { asChild: true, children: _jsx("button", { type: "button", "aria-label": `More actions for ${app.name}`, className: "inline-flex h-7 w-7 cursor-pointer items-center justify-center rounded-md text-muted-foreground opacity-0 transition hover:bg-accent hover:text-foreground focus-visible:opacity-100 group-hover:opacity-100 data-[state=open]:opacity-100", onClick: (e) => e.stopPropagation(), children: _jsx(IconDots, { size: 15 }) }) }), _jsx(DropdownMenuContent, { align: "end", className: "w-44", children: isPending ? (_jsxs(DropdownMenuItem, { onSelect: handleRemovePending, className: "text-red-600 focus:text-red-600 dark:text-red-400 dark:focus:text-red-400", children: [_jsx(IconTrash, { size: 14, className: "mr-2" }), "Remove from list"] })) : isArchived ? (_jsxs(DropdownMenuItem, { onSelect: handleUnarchive, children: [_jsx(IconEye, { size: 14, className: "mr-2" }), "Restore to list"] })) : (_jsxs(DropdownMenuItem, { onSelect: handleArchive, children: [_jsx(IconEyeOff, { size: 14, className: "mr-2" }), "Hide from list"] })) })] }) }), href && !isArchived ? (_jsx(IconArrowUpRight, { size: 16, className: "text-muted-foreground transition group-hover:text-foreground" })) : null] })] })] }));
}
function stringifyError(err) {
    if (err instanceof Error)
        return err.message;
    return String(err);
}
//# sourceMappingURL=workspace-app-card.js.map