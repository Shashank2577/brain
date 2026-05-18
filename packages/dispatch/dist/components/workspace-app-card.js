import { jsx as _jsx, jsxs as _jsxs } from "react/jsx-runtime";
import { useEffect, useState } from "react";
import { useActionMutation, useActionQuery } from "@agent-native/core/client";
import { IconArrowUpRight, IconChevronDown, IconChevronRight, IconClockHour4, IconDots, IconEdit, IconEye, IconEyeOff, IconFileText, IconWorld, IconTrash, } from "@tabler/icons-react";
import { toast } from "sonner";
import { AppKeysPopover } from "../components/app-keys-popover.js";
import { AppResourceEffectiveStack } from "../components/workspace-resource-effective-stack.js";
import { Badge } from "../components/ui/badge.js";
import { Button } from "../components/ui/button.js";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger, } from "../components/ui/dialog.js";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger, } from "../components/ui/dropdown-menu.js";
import { Input } from "../components/ui/input.js";
import { Label } from "../components/ui/label.js";
import { Textarea } from "../components/ui/textarea.js";
import { cn } from "../lib/utils.js";
import { isPendingBuilderHref, workspaceAppHref, } from "../lib/workspace-apps.js";
export function WorkspaceAppCard({ app, className, }) {
    const href = workspaceAppHref(app);
    const openInNewTab = isPendingBuilderHref(app);
    const isPending = app.status === "pending";
    const isArchived = !!app.archived;
    const audience = app.audience ?? "internal";
    const [editOpen, setEditOpen] = useState(false);
    const [draftName, setDraftName] = useState(app.name);
    const [draftDescription, setDraftDescription] = useState(app.description || "");
    useEffect(() => {
        if (editOpen)
            return;
        setDraftName(app.name);
        setDraftDescription(app.description || "");
    }, [app.description, app.name, editOpen]);
    const archive = useActionMutation("archive-workspace-app", {
        onError: (err) => toast.error(`Could not hide ${app.name}: ${stringifyError(err)}`),
    });
    const unarchive = useActionMutation("unarchive-workspace-app", {
        onError: (err) => toast.error(`Could not restore ${app.name}: ${stringifyError(err)}`),
    });
    const removePending = useActionMutation("remove-pending-workspace-app", {
        onError: (err) => toast.error(`Could not remove ${app.name}: ${stringifyError(err)}`),
    });
    const updateMetadata = useActionMutation("update-workspace-app-metadata", {
        onSuccess: () => {
            toast.success(`Updated ${draftName.trim() || app.name}`);
            setEditOpen(false);
        },
        onError: (err) => toast.error(`Could not update ${app.name}: ${stringifyError(err)}`),
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
    const handleMetadataSubmit = (event) => {
        event.preventDefault();
        const name = draftName.trim();
        if (!name) {
            toast.error("App name is required.");
            return;
        }
        updateMetadata.mutate({
            appId: app.id,
            name,
            description: draftDescription.trim(),
        });
    };
    return (_jsxs("div", { "aria-disabled": !href, className: cn("group relative rounded-lg border bg-card p-4 transition hover:border-foreground/30 aria-disabled:opacity-60", isArchived && "opacity-70", className), children: [href ? (_jsx("a", { href: href, target: openInNewTab ? "_blank" : undefined, rel: openInNewTab ? "noreferrer" : undefined, "aria-label": `Open ${app.name}`, className: "absolute inset-0 z-0 rounded-lg" })) : null, _jsxs("div", { className: "pointer-events-none relative z-10 flex h-full items-start justify-between gap-3", children: [_jsxs("div", { className: "min-w-0", children: [_jsxs("div", { className: "flex min-w-0 items-center gap-2", children: [_jsx("h3", { className: "truncate text-sm font-semibold text-foreground", children: app.name }), isPending ? (_jsxs(Badge, { variant: "outline", className: "shrink-0 gap-1 border-amber-500/30 bg-amber-500/10 text-amber-700 dark:text-amber-300", children: [_jsx(IconClockHour4, { size: 12 }), "Building"] })) : null, isArchived ? (_jsxs(Badge, { variant: "outline", className: "shrink-0 gap-1", children: [_jsx(IconEyeOff, { size: 12 }), "Hidden"] })) : null, audience === "public" ? (_jsxs(Badge, { variant: "outline", className: "shrink-0 gap-1", children: [_jsx(IconWorld, { size: 12 }), "Public"] })) : null] }), _jsx("p", { className: "mt-1 truncate font-mono text-xs text-muted-foreground", children: app.path }), isPending && app.branchName ? (_jsxs("p", { className: "mt-1 truncate text-xs text-muted-foreground", children: ["Branch: ", app.branchName] })) : null, app.description ? (_jsx("p", { className: "mt-2 line-clamp-2 text-xs leading-relaxed text-muted-foreground", children: app.description })) : null] }), _jsxs("div", { className: "flex shrink-0 items-center gap-1", children: [!isPending && !isArchived ? (_jsx("div", { className: "pointer-events-auto", children: _jsx(AppResourcesDialog, { app: app }) })) : null, !isPending && !isArchived ? (_jsx("div", { className: "pointer-events-auto", children: _jsx(AppKeysPopover, { appId: app.id, appName: app.name }) })) : null, _jsx("div", { className: "pointer-events-auto", children: _jsxs(DropdownMenu, { children: [_jsx(DropdownMenuTrigger, { asChild: true, children: _jsx("button", { type: "button", "aria-label": `More actions for ${app.name}`, className: "inline-flex h-7 w-7 cursor-pointer items-center justify-center rounded-md text-muted-foreground opacity-0 transition hover:bg-accent hover:text-foreground focus-visible:opacity-100 group-hover:opacity-100 data-[state=open]:opacity-100", onClick: (e) => e.stopPropagation(), children: _jsx(IconDots, { size: 15 }) }) }), _jsxs(DropdownMenuContent, { align: "end", className: "w-44", children: [_jsxs(DropdownMenuItem, { onSelect: (event) => {
                                                        event.preventDefault();
                                                        setEditOpen(true);
                                                    }, children: [_jsx(IconEdit, { size: 14, className: "mr-2" }), "Edit details"] }), isPending ? (_jsxs(DropdownMenuItem, { onSelect: handleRemovePending, className: "text-red-600 focus:text-red-600 dark:text-red-400 dark:focus:text-red-400", children: [_jsx(IconTrash, { size: 14, className: "mr-2" }), "Remove from list"] })) : isArchived ? (_jsxs(DropdownMenuItem, { onSelect: handleUnarchive, children: [_jsx(IconEye, { size: 14, className: "mr-2" }), "Restore to list"] })) : (_jsxs(DropdownMenuItem, { onSelect: handleArchive, children: [_jsx(IconEyeOff, { size: 14, className: "mr-2" }), "Hide from list"] }))] })] }) }), href && !isArchived ? (_jsx(IconArrowUpRight, { size: 16, className: "text-muted-foreground transition group-hover:text-foreground" })) : null] })] }), _jsx(Dialog, { open: editOpen, onOpenChange: setEditOpen, children: _jsxs(DialogContent, { children: [_jsx(DialogHeader, { children: _jsx(DialogTitle, { children: "Edit app details" }) }), _jsxs("form", { className: "space-y-4", onSubmit: handleMetadataSubmit, children: [_jsxs("div", { className: "space-y-2", children: [_jsx(Label, { htmlFor: `app-name-${app.id}`, children: "Name" }), _jsx(Input, { id: `app-name-${app.id}`, value: draftName, maxLength: 120, onChange: (event) => setDraftName(event.target.value) })] }), _jsxs("div", { className: "space-y-2", children: [_jsx(Label, { htmlFor: `app-description-${app.id}`, children: "Description" }), _jsx(Textarea, { id: `app-description-${app.id}`, value: draftDescription, maxLength: 500, rows: 4, onChange: (event) => setDraftDescription(event.target.value) })] }), _jsxs(DialogFooter, { children: [_jsx(Button, { type: "button", variant: "outline", onClick: () => setEditOpen(false), children: "Cancel" }), _jsx(Button, { type: "submit", disabled: updateMetadata.isPending, children: updateMetadata.isPending ? "Saving..." : "Save" })] })] })] }) })] }));
}
function AppResourcesDialog({ app }) {
    const [open, setOpen] = useState(false);
    const [inspectedResourceId, setInspectedResourceId] = useState(null);
    const { data, isLoading } = useActionQuery("list-workspace-resources-for-app", { appId: app.id }, { enabled: open });
    const resources = (data?.resources ?? []);
    const counts = data?.counts;
    return (_jsxs(Dialog, { open: open, onOpenChange: (nextOpen) => {
            setOpen(nextOpen);
            if (!nextOpen)
                setInspectedResourceId(null);
        }, children: [_jsx(DialogTrigger, { asChild: true, children: _jsxs(Button, { type: "button", variant: "ghost", size: "sm", className: "h-7 px-2 text-xs", onClick: (e) => e.stopPropagation(), children: [_jsx(IconFileText, { size: 14, className: "mr-1" }), "Context"] }) }), _jsxs(DialogContent, { className: "max-w-2xl", children: [_jsxs(DialogHeader, { children: [_jsxs(DialogTitle, { children: [app.name, " workspace resources"] }), _jsx(DialogDescription, { children: "Workspace-level resources are inherited at runtime. App shared and personal resources can override them locally." })] }), _jsxs("div", { className: "space-y-4", children: [_jsx("div", { className: "rounded-lg border bg-muted/30 px-3 py-2 text-xs leading-relaxed text-muted-foreground", children: "All-app resources live once at workspace scope and are read by each app agent when it builds context. Nothing is copied into this app." }), _jsxs("div", { className: "flex flex-wrap items-center gap-2", children: [_jsxs(Badge, { variant: "secondary", children: [counts?.total ?? 0, " total"] }), _jsxs(Badge, { variant: "outline", children: [counts?.workspace ?? counts?.global ?? 0, " workspace"] }), _jsxs(Badge, { variant: "outline", children: [counts?.granted ?? 0, " granted"] }), _jsxs(Badge, { variant: "outline", children: [counts?.autoLoaded ?? 0, " auto-loaded"] })] }), isLoading ? (_jsxs("div", { className: "space-y-2", children: [_jsx("div", { className: "h-14 rounded-lg border bg-muted/30" }), _jsx("div", { className: "h-14 rounded-lg border bg-muted/30" }), _jsx("div", { className: "h-14 rounded-lg border bg-muted/30" })] })) : resources.length === 0 ? (_jsx("div", { className: "rounded-lg border border-dashed px-4 py-8 text-center text-sm text-muted-foreground", children: "No workspace or granted resources are visible to this app yet." })) : (_jsx("div", { className: "max-h-[420px] space-y-2 overflow-y-auto pr-1", children: resources.map((resource) => {
                                    const inspected = inspectedResourceId === resource.id;
                                    return (_jsxs("div", { className: "rounded-lg border px-3 py-3", children: [_jsxs("div", { className: "flex items-start justify-between gap-3", children: [_jsxs("div", { className: "min-w-0", children: [_jsxs("div", { className: "flex flex-wrap items-center gap-2", children: [_jsx("span", { className: "text-sm font-medium text-foreground", children: resource.name }), _jsx(Badge, { variant: "secondary", children: resource.kind }), _jsx(Badge, { variant: "outline", children: resource.source === "workspace"
                                                                            ? "All apps"
                                                                            : "Granted" }), resource.autoLoaded ? (_jsx(Badge, { variant: "outline", children: "Auto-loaded" })) : null] }), _jsx("div", { className: "mt-1 truncate font-mono text-xs text-muted-foreground", children: resource.path })] }), _jsxs("div", { className: "flex shrink-0 flex-col items-end gap-2", children: [resource.source === "grant" ? (_jsx("div", { className: "text-right text-[11px] text-muted-foreground", children: "Selected grant" })) : null, _jsxs(Button, { type: "button", variant: "ghost", size: "sm", className: "h-7 px-2 text-xs", onClick: (event) => {
                                                                    event.stopPropagation();
                                                                    setInspectedResourceId(inspected ? null : resource.id);
                                                                }, children: [inspected ? (_jsx(IconChevronDown, { size: 14, className: "mr-1" })) : (_jsx(IconChevronRight, { size: 14, className: "mr-1" })), "Stack"] })] })] }), resource.description ? (_jsx("p", { className: "mt-2 line-clamp-2 text-xs text-muted-foreground", children: resource.description })) : null, inspected ? (_jsx(AppResourceEffectiveStack, { appId: app.id, resource: resource })) : null] }, resource.id));
                                }) }))] }), _jsx(DialogFooter, { children: _jsx(Button, { type: "button", onClick: () => setOpen(false), children: "Done" }) })] })] }));
}
function stringifyError(err) {
    if (err instanceof Error)
        return err.message;
    return String(err);
}
//# sourceMappingURL=workspace-app-card.js.map