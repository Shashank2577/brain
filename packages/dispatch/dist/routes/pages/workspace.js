import { jsx as _jsx, jsxs as _jsxs, Fragment as _Fragment } from "react/jsx-runtime";
import { useEffect, useState } from "react";
import { useActionMutation, useActionQuery } from "@agent-native/core/client";
import { toast } from "sonner";
import { IconAlertCircle, IconBook, IconChevronDown, IconChevronRight, IconCircleCheck, IconCode, IconEdit, IconFileText, IconPlus, IconTrash, IconUser, IconX, } from "@tabler/icons-react";
import { DispatchShell } from "../../components/dispatch-shell.js";
import { ImpactPreview, workspaceResourceMutationMessage, } from "../../components/workspace-resource-impact-preview.js";
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger, } from "../../components/ui/alert-dialog.js";
import { Badge } from "../../components/ui/badge.js";
import { Button } from "../../components/ui/button.js";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger, } from "../../components/ui/dialog.js";
import { Input } from "../../components/ui/input.js";
import { Label } from "../../components/ui/label.js";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue, } from "../../components/ui/select.js";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "../../components/ui/tabs.js";
import { Textarea } from "../../components/ui/textarea.js";
import { Skeleton } from "../../components/ui/skeleton.js";
export function meta() {
    return [{ title: "Workspace Resources — Dispatch" }];
}
const KIND_CONFIG = {
    skill: {
        label: "Skill",
        icon: IconCode,
        pathPrefix: "skills/",
        description: "Agent skills - on-demand guidance available across workspace apps",
    },
    instruction: {
        label: "Instruction",
        icon: IconBook,
        pathPrefix: "instructions/",
        description: "Global instructions - guardrails loaded by every app agent",
    },
    agent: {
        label: "Agent",
        icon: IconUser,
        pathPrefix: "agents/",
        description: "Reusable agent profiles - specialist agents shared across apps",
    },
    knowledge: {
        label: "Knowledge",
        icon: IconFileText,
        pathPrefix: "context/",
        description: "Reference resources - brand, positioning, persona, and domain context",
    },
};
const STARTER_GLOBAL_CONTEXT = [
    {
        path: "context/company.md",
        label: "Company",
        kind: "knowledge",
        description: "Company facts, ICP, products, and canonical links",
    },
    {
        path: "context/brand.md",
        label: "Brand",
        kind: "knowledge",
        description: "Voice, visual identity, naming, and style rules",
    },
    {
        path: "context/messaging.md",
        label: "Messaging",
        kind: "knowledge",
        description: "Positioning, value props, proof points, and objections",
    },
    {
        path: "instructions/guardrails.md",
        label: "Guardrails",
        kind: "instruction",
        description: "Always-on rules loaded by every app agent",
    },
    {
        path: "skills/company-voice/SKILL.md",
        label: "Company Voice",
        kind: "skill",
        description: "On-demand guidance for customer-facing writing",
    },
];
function resourceSlug(value) {
    return value
        .toLowerCase()
        .replace(/[^a-z0-9]+/g, "-")
        .replace(/^-+|-+$/g, "");
}
function defaultResourcePath(kind, name) {
    const slug = resourceSlug(name) || "example";
    if (kind === "skill")
        return `skills/${slug}/SKILL.md`;
    if (kind === "instruction")
        return `instructions/${slug}.md`;
    if (kind === "agent")
        return `agents/${slug}.md`;
    if (kind === "knowledge")
        return `context/${slug}.md`;
    return `${slug}.md`;
}
function isAutoLoadedInstruction(resource) {
    return (resource.kind === "instruction" &&
        (resource.path === "AGENTS.md" ||
            String(resource.path).startsWith("instructions/")));
}
function formatTimestamp(value) {
    if (!value)
        return "Not present";
    return new Date(value).toLocaleString();
}
function availabilityLabel(value) {
    switch (value) {
        case "all-apps":
            return "Inherited by all apps";
        case "selected-granted":
            return "Granted to selected app";
        case "selected-not-granted":
            return "Not granted to this app";
        case "selected-no-app":
            return "Select an app to check grant";
        case "path-not-managed":
            return "Path is not a Dispatch resource";
        default:
            return "Checking availability";
    }
}
function layerState(layer) {
    if (layer.effective) {
        return {
            label: "Active",
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
function EditResourceDialog({ resource, trigger, }) {
    const [open, setOpen] = useState(false);
    const [name, setName] = useState(resource.name || "");
    const [description, setDescription] = useState(resource.description || "");
    const [content, setContent] = useState(resource.content || "");
    const [scope, setScope] = useState(resource.scope || "all");
    useEffect(() => {
        if (!open)
            return;
        setName(resource.name || "");
        setDescription(resource.description || "");
        setContent(resource.content || "");
        setScope(resource.scope || "all");
    }, [open, resource]);
    const update = useActionMutation("update-workspace-resource", {
        onSuccess: (result) => {
            toast.success(workspaceResourceMutationMessage(result, "Resource updated"));
            setOpen(false);
        },
        onError: (err) => toast.error(String(err)),
    });
    return (_jsxs(Dialog, { open: open, onOpenChange: setOpen, children: [_jsx(DialogTrigger, { asChild: true, children: trigger || (_jsxs(Button, { variant: "outline", size: "sm", children: [_jsx(IconEdit, { size: 14, className: "mr-1.5" }), "Edit"] })) }), _jsxs(DialogContent, { className: "max-w-2xl", children: [_jsxs(DialogHeader, { children: [_jsx(DialogTitle, { children: "Edit workspace resource" }), _jsx(DialogDescription, { children: "Updates apply immediately anywhere this workspace resource is inherited. App shared or personal resources can override it locally." })] }), _jsxs("div", { className: "space-y-4 py-2", children: [_jsxs("div", { className: "grid grid-cols-2 gap-4", children: [_jsxs("div", { className: "space-y-2", children: [_jsx(Label, { children: "Name" }), _jsx(Input, { value: name, onChange: (e) => setName(e.target.value) })] }), _jsxs("div", { className: "space-y-2", children: [_jsx(Label, { children: "Scope" }), _jsxs(Select, { value: scope, onValueChange: setScope, children: [_jsx(SelectTrigger, { children: _jsx(SelectValue, {}) }), _jsxs(SelectContent, { children: [_jsx(SelectItem, { value: "all", children: "All apps" }), _jsx(SelectItem, { value: "selected", children: "Selected apps only" })] })] })] })] }), _jsxs("div", { className: "space-y-2", children: [_jsx(Label, { children: "Path" }), _jsx(Input, { value: resource.path, disabled: true, className: "font-mono text-sm" })] }), _jsxs("div", { className: "space-y-2", children: [_jsx(Label, { children: "Description" }), _jsx(Input, { value: description, onChange: (e) => setDescription(e.target.value) })] }), _jsxs("div", { className: "space-y-2", children: [_jsx(Label, { children: "Content" }), _jsx(Textarea, { value: content, onChange: (e) => setContent(e.target.value), rows: 14, className: "font-mono text-sm" })] }), _jsx(ImpactPreview, { operation: "update", resourceId: resource.id, scope: scope, enabled: open })] }), _jsx(DialogFooter, { children: _jsx(Button, { onClick: () => update.mutate({
                                id: resource.id,
                                name,
                                description,
                                content,
                                scope: scope,
                            }), disabled: !name.trim() || update.isPending, children: update.isPending ? "Saving..." : "Save changes" }) })] })] }));
}
function AddResourceDialog() {
    const [open, setOpen] = useState(false);
    const [kind, setKind] = useState("skill");
    const [name, setName] = useState("");
    const [description, setDescription] = useState("");
    const [path, setPath] = useState("");
    const [content, setContent] = useState("");
    const [scope, setScope] = useState("all");
    const create = useActionMutation("create-workspace-resource", {
        onSuccess: (result) => {
            toast.success(workspaceResourceMutationMessage(result, "Resource created"));
            setOpen(false);
            setKind("skill");
            setName("");
            setDescription("");
            setPath("");
            setContent("");
            setScope("all");
        },
        onError: (err) => toast.error(String(err)),
    });
    return (_jsxs(Dialog, { open: open, onOpenChange: setOpen, children: [_jsx(DialogTrigger, { asChild: true, children: _jsxs(Button, { children: [_jsx(IconPlus, { size: 16, className: "mr-1.5" }), "Add resource"] }) }), _jsxs(DialogContent, { className: "max-w-2xl", children: [_jsxs(DialogHeader, { children: [_jsx(DialogTitle, { children: "Add workspace resource" }), _jsx(DialogDescription, { children: "Create a skill, instruction, agent profile, or reference resource that can be shared across workspace apps." })] }), _jsxs("div", { className: "space-y-4 py-2", children: [_jsxs("div", { className: "grid grid-cols-2 gap-4", children: [_jsxs("div", { className: "space-y-2", children: [_jsx(Label, { children: "Kind" }), _jsxs(Select, { value: kind, onValueChange: setKind, children: [_jsx(SelectTrigger, { children: _jsx(SelectValue, {}) }), _jsxs(SelectContent, { children: [_jsx(SelectItem, { value: "skill", children: "Skill" }), _jsx(SelectItem, { value: "instruction", children: "Instruction" }), _jsx(SelectItem, { value: "agent", children: "Agent" }), _jsx(SelectItem, { value: "knowledge", children: "Knowledge pack" })] })] })] }), _jsxs("div", { className: "space-y-2", children: [_jsx(Label, { children: "Scope" }), _jsxs(Select, { value: scope, onValueChange: setScope, children: [_jsx(SelectTrigger, { children: _jsx(SelectValue, {}) }), _jsxs(SelectContent, { children: [_jsx(SelectItem, { value: "all", children: "All apps" }), _jsx(SelectItem, { value: "selected", children: "Selected apps only" })] })] })] })] }), _jsxs("div", { className: "space-y-2", children: [_jsx(Label, { children: "Name" }), _jsx(Input, { placeholder: kind === "skill"
                                            ? "Frontend Designer"
                                            : kind === "agent"
                                                ? "Research Specialist"
                                                : kind === "knowledge"
                                                    ? "Core GTM Messaging"
                                                    : "Code Style Guide", value: name, onChange: (e) => setName(e.target.value) })] }), _jsxs("div", { className: "space-y-2", children: [_jsx(Label, { children: "Path" }), _jsx(Input, { placeholder: defaultResourcePath(kind, name), value: path, onChange: (e) => setPath(e.target.value), className: "font-mono text-sm" }), _jsx("p", { className: "text-xs text-muted-foreground", children: "Skills use skills/name/SKILL.md. Guardrails in AGENTS.md or instructions/ auto-load in app chat. Reference resources in context/ are indexed so agents can read them when relevant." })] }), _jsxs("div", { className: "space-y-2", children: [_jsx(Label, { children: "Description (optional)" }), _jsx(Input, { placeholder: "Short description of what this resource does", value: description, onChange: (e) => setDescription(e.target.value) })] }), _jsxs("div", { className: "space-y-2", children: [_jsx(Label, { children: "Content" }), _jsx(Textarea, { placeholder: kind === "skill"
                                            ? "---\nname: my-skill\ndescription: What this skill teaches\n---\n\n# My Skill\n\n..."
                                            : kind === "agent"
                                                ? "---\nname: Research Specialist\ndescription: Handles research tasks\n---\n\n# Instructions\n\n..."
                                                : kind === "knowledge"
                                                    ? "# Core GTM Messaging\n\n## Positioning\n\n## ICP\n\n## Proof points\n\n## Source\n\n"
                                                    : "# Instructions\n\nAlways-on guardrails for agents across apps...", value: content, onChange: (e) => setContent(e.target.value), rows: 12, className: "font-mono text-sm" })] }), _jsx(ImpactPreview, { operation: "create", path: path || defaultResourcePath(kind, name), scope: scope, enabled: open && Boolean(name.trim()) })] }), _jsx(DialogFooter, { children: _jsx(Button, { onClick: () => create.mutate({
                                kind: kind,
                                name,
                                description: description || undefined,
                                path: path || defaultResourcePath(kind, name),
                                content,
                                scope: scope,
                            }), disabled: !name || !content || create.isPending, children: create.isPending ? "Creating..." : "Create resource" }) })] })] }));
}
function GrantDialog({ resourceId, resourceName, }) {
    const [open, setOpen] = useState(false);
    const [appId, setAppId] = useState("");
    const { data: catalog } = useActionQuery("list-integrations-catalog", {});
    const grant = useActionMutation("create-workspace-resource-grant", {
        onSuccess: () => {
            toast.success(`Granted to ${appId}`);
            setOpen(false);
            setAppId("");
        },
        onError: (err) => toast.error(String(err)),
    });
    const apps = (catalog || []).map((a) => ({
        id: a.appId,
        name: a.appName,
    }));
    return (_jsxs(Dialog, { open: open, onOpenChange: setOpen, children: [_jsx(DialogTrigger, { asChild: true, children: _jsxs(Button, { variant: "outline", size: "sm", children: [_jsx(IconPlus, { size: 14, className: "mr-1" }), "Grant"] }) }), _jsxs(DialogContent, { children: [_jsxs(DialogHeader, { children: [_jsxs(DialogTitle, { children: ["Grant \"", resourceName, "\" to an app"] }), _jsx(DialogDescription, { children: "Choose which app should receive this resource." })] }), _jsx("div", { className: "py-2", children: _jsxs(Select, { value: appId, onValueChange: setAppId, children: [_jsx(SelectTrigger, { children: _jsx(SelectValue, { placeholder: "Select an app..." }) }), _jsx(SelectContent, { children: apps.map((app) => (_jsx(SelectItem, { value: app.id, children: app.name }, app.id))) })] }) }), _jsx(DialogFooter, { children: _jsx(Button, { onClick: () => grant.mutate({ resourceId, appId }), disabled: !appId || grant.isPending, children: grant.isPending ? "Granting..." : "Grant access" }) })] })] }));
}
function EffectiveContextPreview({ resource }) {
    const [appId, setAppId] = useState("__any__");
    const [userEmail, setUserEmail] = useState("");
    const selectedAppId = appId === "__any__" ? undefined : appId;
    const normalizedUserEmail = userEmail.trim() || undefined;
    const { data: apps } = useActionQuery("list-workspace-apps", {
        includeAgentCards: false,
    });
    const { data: context, isLoading } = useActionQuery("get-workspace-resource-effective-context", {
        resourceId: resource.id,
        appId: selectedAppId,
        userEmail: normalizedUserEmail,
    });
    const visibleApps = (apps || []).filter((app) => !app.isDispatch && app.status !== "pending");
    const layers = (context?.layers || []);
    const active = context?.effectiveResource;
    const availability = context?.availability;
    return (_jsxs("div", { className: "rounded-lg border bg-background p-3", children: [_jsxs("div", { className: "flex flex-wrap items-start justify-between gap-3", children: [_jsxs("div", { className: "min-w-0", children: [_jsx("h4", { className: "text-xs font-semibold uppercase text-muted-foreground", children: "Effective in app" }), _jsx("p", { className: "mt-1 text-xs leading-relaxed text-muted-foreground", children: "Preview the runtime stack for this path: workspace default, organization/app override, then personal override." })] }), _jsx(Badge, { variant: "outline", children: availabilityLabel(availability) })] }), _jsxs("div", { className: "mt-3 grid gap-3 md:grid-cols-2", children: [_jsxs("div", { className: "space-y-2", children: [_jsx(Label, { htmlFor: `resource-app-${resource.id}`, children: "App" }), _jsxs(Select, { value: appId, onValueChange: setAppId, children: [_jsx(SelectTrigger, { id: `resource-app-${resource.id}`, children: _jsx(SelectValue, {}) }), _jsxs(SelectContent, { children: [_jsx(SelectItem, { value: "__any__", children: "Any app" }), visibleApps.map((app) => (_jsx(SelectItem, { value: app.id, children: app.name }, app.id)))] })] })] }), _jsxs("div", { className: "space-y-2", children: [_jsx(Label, { htmlFor: `resource-user-${resource.id}`, children: "User email" }), _jsx(Input, { id: `resource-user-${resource.id}`, value: userEmail, onChange: (event) => setUserEmail(event.target.value), placeholder: "Current Dispatch user" })] })] }), resource.scope === "selected" ? (_jsx("div", { className: "mt-3 rounded-md border border-amber-500/30 bg-amber-500/10 px-3 py-2 text-xs leading-relaxed text-amber-800 dark:text-amber-200", children: "Selected resources are app-specific exceptions. Use All apps for company-wide context that should be inherited everywhere without copy or sync." })) : null, isLoading ? (_jsx("div", { className: "mt-3 grid gap-2 md:grid-cols-3", children: Array.from({ length: 3 }).map((_, index) => (_jsx(Skeleton, { className: "h-28 rounded-lg" }, index))) })) : (_jsx("div", { className: "mt-3 grid gap-2 md:grid-cols-3", children: layers.map((layer) => {
                    const state = layerState(layer);
                    return (_jsxs("div", { className: "rounded-lg border p-3", children: [_jsxs("div", { className: "flex items-start justify-between gap-2", children: [_jsx("span", { className: "text-sm font-medium text-foreground", children: layer.label }), _jsx(Badge, { variant: "outline", className: state.className, children: state.label })] }), _jsx("div", { className: "mt-2 truncate font-mono text-[11px] text-muted-foreground", children: layer.owner }), layer.resource ? (_jsxs("div", { className: "mt-2 space-y-1 text-xs text-muted-foreground", children: [_jsx("div", { className: "truncate font-mono", children: layer.resource.path }), _jsx("div", { children: formatTimestamp(layer.resource.updatedAt) })] })) : (_jsx("p", { className: "mt-2 text-xs text-muted-foreground", children: "No resource exists at this layer." }))] }, layer.scope));
                }) })), _jsx("div", { className: "mt-3 rounded-md bg-muted/40 px-3 py-2 text-xs text-muted-foreground", children: active ? (_jsxs(_Fragment, { children: ["Active file:", " ", _jsxs("span", { className: "font-mono text-foreground", children: [active.owner, "/", active.path] })] })) : ("No active resource exists for this path yet.") })] }));
}
function ResourceRow({ resource, grants }) {
    const [expanded, setExpanded] = useState(false);
    const deleteResource = useActionMutation("delete-workspace-resource", {
        onSuccess: (result) => toast.success(workspaceResourceMutationMessage(result, "Resource deleted")),
        onError: (err) => toast.error(String(err)),
    });
    const revokeGrant = useActionMutation("revoke-workspace-resource-grant", {
        onSuccess: () => toast.success("Grant revoked"),
        onError: (err) => toast.error(String(err)),
    });
    const kindInfo = KIND_CONFIG[resource.kind];
    const KindIcon = kindInfo?.icon || IconCode;
    const activeGrants = grants.filter((g) => g.status === "active");
    return (_jsxs("div", { className: "rounded-lg border bg-card", children: [_jsxs("button", { type: "button", className: "flex w-full items-center gap-3 px-4 py-3 text-left cursor-pointer", onClick: () => setExpanded(!expanded), children: [expanded ? (_jsx(IconChevronDown, { size: 16, className: "text-muted-foreground" })) : (_jsx(IconChevronRight, { size: 16, className: "text-muted-foreground" })), _jsx(KindIcon, { size: 16, className: "text-muted-foreground" }), _jsxs("div", { className: "min-w-0 flex-1", children: [_jsxs("div", { className: "flex items-center gap-2", children: [_jsx("span", { className: "text-sm font-medium text-foreground", children: resource.name }), _jsx(Badge, { variant: "secondary", className: "text-xs", children: kindInfo?.label || resource.kind }), _jsx(Badge, { variant: "outline", className: resource.scope === "all"
                                            ? "text-xs bg-green-500/10 text-green-700 dark:text-green-400"
                                            : "text-xs", children: resource.scope === "all" ? "All apps" : "Selected" }), isAutoLoadedInstruction(resource) && (_jsx(Badge, { variant: "outline", className: "text-xs", children: "Auto-loaded" }))] }), _jsx("div", { className: "mt-0.5 font-mono text-xs text-muted-foreground", children: resource.path })] }), _jsx("div", { className: "flex items-center gap-2", children: resource.scope === "selected" && (_jsxs(Badge, { variant: "outline", className: "text-xs", children: [activeGrants.length, " grant", activeGrants.length !== 1 ? "s" : ""] })) })] }), expanded && (_jsxs("div", { className: "border-t px-4 py-3 space-y-3", children: [resource.description && (_jsx("p", { className: "text-sm text-muted-foreground", children: resource.description })), _jsx("div", { className: "rounded-lg border bg-muted/30 p-3", children: _jsx("pre", { className: "whitespace-pre-wrap text-xs font-mono text-foreground max-h-64 overflow-y-auto", children: resource.content }) }), _jsx(EffectiveContextPreview, { resource: resource }), resource.scope === "selected" && (_jsxs("div", { className: "space-y-2", children: [_jsxs("div", { className: "flex items-center justify-between", children: [_jsx("span", { className: "text-xs font-medium text-foreground", children: "Grants" }), _jsx(GrantDialog, { resourceId: resource.id, resourceName: resource.name })] }), activeGrants.length > 0 ? (_jsx("div", { className: "space-y-1.5", children: activeGrants.map((grant) => (_jsxs("div", { className: "flex items-center justify-between rounded-lg border px-3 py-2", children: [_jsxs("div", { children: [_jsx("span", { className: "text-sm font-medium text-foreground", children: grant.appId }), _jsx("span", { className: "ml-2 text-xs text-muted-foreground", children: "selected grant" })] }), _jsx("div", { className: "flex gap-1.5", children: _jsx(Button, { variant: "ghost", size: "sm", onClick: () => revokeGrant.mutate({ grantId: grant.id }), disabled: revokeGrant.isPending, children: _jsx(IconX, { size: 14 }) }) })] }, grant.id))) })) : (_jsx("div", { className: "rounded-lg border border-dashed px-3 py-4 text-center text-xs text-muted-foreground", children: "No grants yet. Grant this resource to specific apps." }))] })), _jsxs("div", { className: "flex justify-between border-t pt-3", children: [_jsxs("div", { className: "text-xs text-muted-foreground", children: ["Created by ", resource.createdBy, " \u00B7", " ", new Date(resource.createdAt).toLocaleString()] }), _jsxs("div", { className: "flex gap-2", children: [_jsx(EditResourceDialog, { resource: resource }), _jsxs(AlertDialog, { children: [_jsx(AlertDialogTrigger, { asChild: true, children: _jsxs(Button, { variant: "destructive", size: "sm", disabled: deleteResource.isPending, children: [_jsx(IconTrash, { size: 14, className: "mr-1" }), "Delete"] }) }), _jsxs(AlertDialogContent, { children: [_jsxs(AlertDialogHeader, { children: [_jsx(AlertDialogTitle, { children: "Delete this resource?" }), _jsxs(AlertDialogDescription, { children: ["Removing \"", resource.name, "\" revokes all of its grants and removes inherited workspace access immediately. This cannot be undone."] })] }), _jsx(ImpactPreview, { operation: "delete", resourceId: resource.id, enabled: true }), _jsxs(AlertDialogFooter, { children: [_jsx(AlertDialogCancel, { children: "Cancel" }), _jsx(AlertDialogAction, { onClick: () => deleteResource.mutate({ id: resource.id }), children: "Delete resource" })] })] })] })] })] })] }))] }));
}
function GlobalContextSection({ resources }) {
    const byPath = new Map(resources.map((resource) => [resource.path, resource]));
    const missingPaths = STARTER_GLOBAL_CONTEXT.filter((item) => !byPath.has(item.path)).map((item) => item.path);
    const presentCount = STARTER_GLOBAL_CONTEXT.length - missingPaths.length;
    const restoreStarter = useActionMutation("restore-starter-workspace-resources", {
        onSuccess: (result) => {
            const restored = result?.restored?.length ?? 0;
            const existing = result?.existing?.length ?? 0;
            toast.success(restored > 0
                ? `Restored ${restored} starter resource${restored === 1 ? "" : "s"}`
                : `Starter resources already present (${existing})`);
        },
        onError: (err) => toast.error(String(err)),
    });
    return (_jsxs("section", { className: "space-y-3", children: [_jsxs("div", { className: "flex items-center justify-between gap-3", children: [_jsxs("div", { children: [_jsx("h2", { className: "text-sm font-semibold text-foreground", children: "Global context" }), _jsx("p", { className: "mt-1 text-xs text-muted-foreground", children: "Starter resources every workspace can use for company facts, brand, messaging, guardrails, and voice." }), _jsx("p", { className: "mt-1 text-xs text-muted-foreground", children: "All-app resources live once at workspace scope and are inherited by every app agent at runtime." })] }), _jsxs("div", { className: "flex shrink-0 items-center gap-2", children: [missingPaths.length > 0 ? (_jsxs(Button, { size: "sm", variant: "outline", onClick: () => restoreStarter.mutate({ paths: missingPaths }), disabled: restoreStarter.isPending, children: [_jsx(IconPlus, { size: 14, className: "mr-1.5" }), restoreStarter.isPending ? "Restoring..." : "Restore missing"] })) : null, _jsxs(Badge, { variant: "outline", children: [presentCount, "/", STARTER_GLOBAL_CONTEXT.length, " ready"] })] })] }), _jsx("div", { className: "grid gap-3 md:grid-cols-2 xl:grid-cols-5", children: STARTER_GLOBAL_CONTEXT.map((item) => {
                    const resource = byPath.get(item.path);
                    const exists = !!resource;
                    const global = resource?.scope === "all";
                    return (_jsxs("div", { className: "rounded-lg border bg-card p-4", children: [_jsxs("div", { className: "flex items-start justify-between gap-3", children: [_jsxs("div", { className: "min-w-0", children: [_jsxs("div", { className: "flex items-center gap-2", children: [exists ? (_jsx(IconCircleCheck, { size: 15, className: "shrink-0 text-green-600 dark:text-green-400" })) : (_jsx(IconAlertCircle, { size: 15, className: "shrink-0 text-amber-600 dark:text-amber-400" })), _jsx("h3", { className: "truncate text-sm font-medium text-foreground", children: item.label })] }), _jsx("p", { className: "mt-1 line-clamp-2 text-xs text-muted-foreground", children: item.description })] }), resource ? (_jsx(EditResourceDialog, { resource: resource, trigger: _jsxs(Button, { variant: "ghost", size: "sm", className: "h-7 px-2", children: [_jsxs("span", { className: "sr-only", children: ["Edit ", item.label] }), _jsx(IconEdit, { size: 14 })] }) })) : (_jsx(Button, { variant: "ghost", size: "sm", className: "h-7 px-2", onClick: () => restoreStarter.mutate({ paths: [item.path] }), disabled: restoreStarter.isPending, "aria-label": `Restore ${item.label}`, children: _jsx(IconPlus, { size: 14 }) }))] }), _jsxs("div", { className: "mt-3 space-y-2", children: [_jsx("div", { className: "truncate font-mono text-[11px] text-muted-foreground", children: item.path }), _jsxs("div", { className: "flex flex-wrap gap-1.5", children: [_jsx(Badge, { variant: exists ? "secondary" : "outline", children: exists ? "Present" : "Missing" }), exists ? (_jsx(Badge, { variant: "outline", children: global ? "All apps" : "Selected" })) : null, resource && isAutoLoadedInstruction(resource) ? (_jsx(Badge, { variant: "outline", children: "Auto-loaded" })) : null] })] })] }, item.path));
                }) })] }));
}
export default function WorkspaceRoute() {
    const { data: resources, isLoading } = useActionQuery("list-workspace-resources", {});
    const { data: grants } = useActionQuery("list-workspace-resource-grants", {});
    const grantsByResource = (grants || []).reduce((acc, g) => {
        if (!acc[g.resourceId])
            acc[g.resourceId] = [];
        acc[g.resourceId].push(g);
        return acc;
    }, {});
    const skills = (resources || []).filter((r) => r.kind === "skill");
    const instructions = (resources || []).filter((r) => r.kind === "instruction");
    const agents = (resources || []).filter((r) => r.kind === "agent");
    const knowledge = (resources || []).filter((r) => r.kind === "knowledge");
    function ResourceList({ items, emptyText, }) {
        if (isLoading && (resources ?? []).length === 0) {
            return (_jsx("div", { className: "space-y-3", children: Array.from({ length: 3 }).map((_, index) => (_jsxs("div", { className: "rounded-lg border bg-card px-5 py-4 space-y-2", children: [_jsx(Skeleton, { className: "h-4 w-1/3" }), _jsx(Skeleton, { className: "h-3 w-2/3" })] }, index))) }));
        }
        if (items.length === 0) {
            return (_jsx("div", { className: "rounded-lg border border-dashed px-6 py-12 text-center text-sm text-muted-foreground", children: emptyText }));
        }
        return (_jsx("div", { className: "space-y-3", children: items.map((resource) => (_jsx(ResourceRow, { resource: resource, grants: grantsByResource[resource.id] || [] }, resource.id))) }));
    }
    return (_jsxs(DispatchShell, { title: "Workspace Resources", description: "Manage inherited workspace skills, guardrail instructions, agent profiles, and reference resources. All-app resources are available to every app without syncing.", children: [_jsxs("div", { className: "flex items-center justify-between", children: [_jsx("div", { className: "text-sm text-muted-foreground", children: isLoading ? (_jsx(Skeleton, { className: "h-4 w-24" })) : (`${resources?.length || 0} resource${(resources?.length || 0) !== 1 ? "s" : ""}`) }), _jsx("div", { className: "flex gap-2", children: _jsx(AddResourceDialog, {}) })] }), _jsx(GlobalContextSection, { resources: resources || [] }), _jsxs(Tabs, { defaultValue: "skills", children: [_jsxs(TabsList, { children: [_jsxs(TabsTrigger, { value: "skills", children: ["Skills ", skills.length > 0 && `(${skills.length})`] }), _jsxs(TabsTrigger, { value: "instructions", children: ["Instructions ", instructions.length > 0 && `(${instructions.length})`] }), _jsxs(TabsTrigger, { value: "agents", children: ["Agents ", agents.length > 0 && `(${agents.length})`] }), _jsxs(TabsTrigger, { value: "knowledge", children: ["Knowledge ", knowledge.length > 0 && `(${knowledge.length})`] })] }), _jsx(TabsContent, { value: "skills", className: "mt-4", children: _jsx(ResourceList, { items: skills, emptyText: "No workspace skills yet. Add a skill to share agent guidance across apps." }) }), _jsx(TabsContent, { value: "instructions", className: "mt-4", children: _jsx(ResourceList, { items: instructions, emptyText: "No workspace instructions yet. Add instructions to set behavioral rules across apps." }) }), _jsx(TabsContent, { value: "agents", className: "mt-4", children: _jsx(ResourceList, { items: agents, emptyText: "No workspace agents yet. Add a reusable agent profile to share specialist agents across apps." }) }), _jsx(TabsContent, { value: "knowledge", className: "mt-4", children: _jsx(ResourceList, { items: knowledge, emptyText: "No knowledge packs yet. Add GTM, product, or domain context that apps can reuse." }) })] })] }));
}
//# sourceMappingURL=workspace.js.map