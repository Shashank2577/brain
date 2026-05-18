import { jsx as _jsx, jsxs as _jsxs } from "react/jsx-runtime";
import { useState } from "react";
import { useActionMutation, useActionQuery } from "@agent-native/core/client";
import { toast } from "sonner";
import { IconBook, IconChevronDown, IconChevronRight, IconCode, IconFileText, IconPlus, IconRefresh, IconTrash, IconUser, IconX, } from "@tabler/icons-react";
import { DispatchShell } from "../../components/dispatch-shell.js";
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
        description: "Agent skills — detailed guidance for patterns and workflows",
    },
    instruction: {
        label: "Instruction",
        icon: IconBook,
        pathPrefix: "",
        description: "Agent instructions — operational rules and behavioral guidance",
    },
    agent: {
        label: "Agent",
        icon: IconUser,
        pathPrefix: "agents/",
        description: "Reusable agent profiles — specialist agents shared across apps",
    },
    knowledge: {
        label: "Knowledge",
        icon: IconFileText,
        pathPrefix: "context/",
        description: "Knowledge packs — reusable GTM, product, and domain context for apps",
    },
};
function AddResourceDialog() {
    const [open, setOpen] = useState(false);
    const [kind, setKind] = useState("skill");
    const [name, setName] = useState("");
    const [description, setDescription] = useState("");
    const [path, setPath] = useState("");
    const [content, setContent] = useState("");
    const [scope, setScope] = useState("all");
    const create = useActionMutation("create-workspace-resource", {
        onSuccess: () => {
            toast.success("Resource created");
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
    const kindInfo = KIND_CONFIG[kind];
    return (_jsxs(Dialog, { open: open, onOpenChange: setOpen, children: [_jsx(DialogTrigger, { asChild: true, children: _jsxs(Button, { children: [_jsx(IconPlus, { size: 16, className: "mr-1.5" }), "Add resource"] }) }), _jsxs(DialogContent, { className: "max-w-2xl", children: [_jsxs(DialogHeader, { children: [_jsx(DialogTitle, { children: "Add workspace resource" }), _jsx(DialogDescription, { children: "Create a skill, instruction, or agent profile that can be shared across workspace apps." })] }), _jsxs("div", { className: "space-y-4 py-2", children: [_jsxs("div", { className: "grid grid-cols-2 gap-4", children: [_jsxs("div", { className: "space-y-2", children: [_jsx(Label, { children: "Kind" }), _jsxs(Select, { value: kind, onValueChange: setKind, children: [_jsx(SelectTrigger, { children: _jsx(SelectValue, {}) }), _jsxs(SelectContent, { children: [_jsx(SelectItem, { value: "skill", children: "Skill" }), _jsx(SelectItem, { value: "instruction", children: "Instruction" }), _jsx(SelectItem, { value: "agent", children: "Agent" }), _jsx(SelectItem, { value: "knowledge", children: "Knowledge pack" })] })] })] }), _jsxs("div", { className: "space-y-2", children: [_jsx(Label, { children: "Scope" }), _jsxs(Select, { value: scope, onValueChange: setScope, children: [_jsx(SelectTrigger, { children: _jsx(SelectValue, {}) }), _jsxs(SelectContent, { children: [_jsx(SelectItem, { value: "all", children: "All apps" }), _jsx(SelectItem, { value: "selected", children: "Selected apps only" })] })] })] })] }), _jsxs("div", { className: "space-y-2", children: [_jsx(Label, { children: "Name" }), _jsx(Input, { placeholder: kind === "skill"
                                            ? "Frontend Designer"
                                            : kind === "agent"
                                                ? "Research Specialist"
                                                : kind === "knowledge"
                                                    ? "Core GTM Messaging"
                                                    : "Code Style Guide", value: name, onChange: (e) => setName(e.target.value) })] }), _jsxs("div", { className: "space-y-2", children: [_jsx(Label, { children: "Path" }), _jsx(Input, { placeholder: `${kindInfo?.pathPrefix || ""}${name.toLowerCase().replace(/\s+/g, "-") || "example"}.md`, value: path, onChange: (e) => setPath(e.target.value), className: "font-mono text-sm" }), _jsx("p", { className: "text-xs text-muted-foreground", children: "Resource path in target apps. Skills go in skills/, agents in agents/, knowledge packs in context/." })] }), _jsxs("div", { className: "space-y-2", children: [_jsx(Label, { children: "Description (optional)" }), _jsx(Input, { placeholder: "Short description of what this resource does", value: description, onChange: (e) => setDescription(e.target.value) })] }), _jsxs("div", { className: "space-y-2", children: [_jsx(Label, { children: "Content" }), _jsx(Textarea, { placeholder: kind === "skill"
                                            ? "---\nname: my-skill\ndescription: What this skill teaches\n---\n\n# My Skill\n\n..."
                                            : kind === "agent"
                                                ? "---\nname: Research Specialist\ndescription: Handles research tasks\n---\n\n# Instructions\n\n..."
                                                : kind === "knowledge"
                                                    ? "# Core GTM Messaging\n\n## Positioning\n\n## ICP\n\n## Proof points\n\n## Source\n\n"
                                                    : "# Instructions\n\nBehavioral rules and guidance for agents across apps...", value: content, onChange: (e) => setContent(e.target.value), rows: 12, className: "font-mono text-sm" })] })] }), _jsx(DialogFooter, { children: _jsx(Button, { onClick: () => create.mutate({
                                kind: kind,
                                name,
                                description: description || undefined,
                                path: path ||
                                    `${kindInfo?.pathPrefix || ""}${name.toLowerCase().replace(/\s+/g, "-")}.md`,
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
function ResourceRow({ resource, grants }) {
    const [expanded, setExpanded] = useState(false);
    const deleteResource = useActionMutation("delete-workspace-resource", {
        onSuccess: () => toast.success("Resource deleted"),
        onError: (err) => toast.error(String(err)),
    });
    const revokeGrant = useActionMutation("revoke-workspace-resource-grant", {
        onSuccess: () => toast.success("Grant revoked"),
        onError: (err) => toast.error(String(err)),
    });
    const syncToApp = useActionMutation("sync-workspace-resources-to-app", {
        onSuccess: (data) => toast.success(`Synced ${data.synced} resource(s) to ${data.appId}`),
        onError: (err) => toast.error(String(err)),
    });
    const kindInfo = KIND_CONFIG[resource.kind];
    const KindIcon = kindInfo?.icon || IconCode;
    const activeGrants = grants.filter((g) => g.status === "active");
    return (_jsxs("div", { className: "rounded-xl border bg-card", children: [_jsxs("button", { type: "button", className: "flex w-full items-center gap-3 px-4 py-3 text-left cursor-pointer", onClick: () => setExpanded(!expanded), children: [expanded ? (_jsx(IconChevronDown, { size: 16, className: "text-muted-foreground" })) : (_jsx(IconChevronRight, { size: 16, className: "text-muted-foreground" })), _jsx(KindIcon, { size: 16, className: "text-muted-foreground" }), _jsxs("div", { className: "min-w-0 flex-1", children: [_jsxs("div", { className: "flex items-center gap-2", children: [_jsx("span", { className: "text-sm font-medium text-foreground", children: resource.name }), _jsx(Badge, { variant: "secondary", className: "text-xs", children: kindInfo?.label || resource.kind }), _jsx(Badge, { variant: "outline", className: resource.scope === "all"
                                            ? "text-xs bg-green-500/10 text-green-700 dark:text-green-400"
                                            : "text-xs", children: resource.scope === "all" ? "All apps" : "Selected" })] }), _jsx("div", { className: "mt-0.5 font-mono text-xs text-muted-foreground", children: resource.path })] }), _jsx("div", { className: "flex items-center gap-2", children: resource.scope === "selected" && (_jsxs(Badge, { variant: "outline", className: "text-xs", children: [activeGrants.length, " grant", activeGrants.length !== 1 ? "s" : ""] })) })] }), expanded && (_jsxs("div", { className: "border-t px-4 py-3 space-y-3", children: [resource.description && (_jsx("p", { className: "text-sm text-muted-foreground", children: resource.description })), _jsx("div", { className: "rounded-lg border bg-muted/30 p-3", children: _jsx("pre", { className: "whitespace-pre-wrap text-xs font-mono text-foreground max-h-64 overflow-y-auto", children: resource.content }) }), resource.scope === "selected" && (_jsxs("div", { className: "space-y-2", children: [_jsxs("div", { className: "flex items-center justify-between", children: [_jsx("span", { className: "text-xs font-medium text-foreground", children: "Grants" }), _jsx(GrantDialog, { resourceId: resource.id, resourceName: resource.name })] }), activeGrants.length > 0 ? (_jsx("div", { className: "space-y-1.5", children: activeGrants.map((grant) => (_jsxs("div", { className: "flex items-center justify-between rounded-lg border px-3 py-2", children: [_jsxs("div", { children: [_jsx("span", { className: "text-sm font-medium text-foreground", children: grant.appId }), _jsx("span", { className: "ml-2 text-xs text-muted-foreground", children: grant.syncedAt
                                                        ? `synced ${new Date(grant.syncedAt).toLocaleString()}`
                                                        : "not synced" })] }), _jsxs("div", { className: "flex gap-1.5", children: [_jsx(Button, { variant: "ghost", size: "sm", onClick: () => syncToApp.mutate({ appId: grant.appId }), disabled: syncToApp.isPending, children: _jsx(IconRefresh, { size: 14 }) }), _jsx(Button, { variant: "ghost", size: "sm", onClick: () => revokeGrant.mutate({ grantId: grant.id }), disabled: revokeGrant.isPending, children: _jsx(IconX, { size: 14 }) })] })] }, grant.id))) })) : (_jsx("div", { className: "rounded-lg border border-dashed px-3 py-4 text-center text-xs text-muted-foreground", children: "No grants yet. Grant this resource to specific apps." }))] })), _jsxs("div", { className: "flex justify-between border-t pt-3", children: [_jsxs("div", { className: "text-xs text-muted-foreground", children: ["Created by ", resource.createdBy, " \u00B7", " ", new Date(resource.createdAt).toLocaleString()] }), _jsxs(AlertDialog, { children: [_jsx(AlertDialogTrigger, { asChild: true, children: _jsxs(Button, { variant: "destructive", size: "sm", disabled: deleteResource.isPending, children: [_jsx(IconTrash, { size: 14, className: "mr-1" }), "Delete"] }) }), _jsxs(AlertDialogContent, { children: [_jsxs(AlertDialogHeader, { children: [_jsx(AlertDialogTitle, { children: "Delete this resource?" }), _jsxs(AlertDialogDescription, { children: ["Removing \"", resource.name, "\" revokes all of its grants. Apps that depended on this resource will lose access on the next sync. This cannot be undone."] })] }), _jsxs(AlertDialogFooter, { children: [_jsx(AlertDialogCancel, { children: "Cancel" }), _jsx(AlertDialogAction, { onClick: () => deleteResource.mutate({ id: resource.id }), children: "Delete resource" })] })] })] })] })] }))] }));
}
export default function WorkspaceRoute() {
    const { data: resources, isLoading } = useActionQuery("list-workspace-resources", {});
    const { data: grants } = useActionQuery("list-workspace-resource-grants", {});
    const syncAll = useActionMutation("sync-workspace-resources-to-all", {
        onSuccess: (data) => {
            const total = (data || []).reduce((sum, r) => sum + r.synced, 0);
            toast.success(`Synced resources to ${data?.length || 0} apps (${total} total pushes)`);
        },
        onError: (err) => toast.error(String(err)),
    });
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
            return (_jsx("div", { className: "space-y-3", children: Array.from({ length: 3 }).map((_, index) => (_jsxs("div", { className: "rounded-2xl border bg-card px-5 py-4 space-y-2", children: [_jsx(Skeleton, { className: "h-4 w-1/3" }), _jsx(Skeleton, { className: "h-3 w-2/3" })] }, index))) }));
        }
        if (items.length === 0) {
            return (_jsx("div", { className: "rounded-2xl border border-dashed px-6 py-12 text-center text-sm text-muted-foreground", children: emptyText }));
        }
        return (_jsx("div", { className: "space-y-3", children: items.map((resource) => (_jsx(ResourceRow, { resource: resource, grants: grantsByResource[resource.id] || [] }, resource.id))) }));
    }
    return (_jsxs(DispatchShell, { title: "Workspace Resources", description: "Share skills, instructions, agent profiles, and knowledge packs across workspace apps. Scope to all apps or grant per-app.", children: [_jsxs("div", { className: "flex items-center justify-between", children: [_jsx("div", { className: "text-sm text-muted-foreground", children: isLoading ? (_jsx(Skeleton, { className: "h-4 w-24" })) : (`${resources?.length || 0} resource${(resources?.length || 0) !== 1 ? "s" : ""}`) }), _jsxs("div", { className: "flex gap-2", children: [_jsxs(Button, { variant: "outline", onClick: () => syncAll.mutate({}), disabled: syncAll.isPending || (resources?.length || 0) === 0, children: [_jsx(IconRefresh, { size: 16, className: syncAll.isPending ? "mr-1.5 animate-spin" : "mr-1.5" }), "Sync all"] }), _jsx(AddResourceDialog, {})] })] }), _jsxs(Tabs, { defaultValue: "skills", children: [_jsxs(TabsList, { children: [_jsxs(TabsTrigger, { value: "skills", children: ["Skills ", skills.length > 0 && `(${skills.length})`] }), _jsxs(TabsTrigger, { value: "instructions", children: ["Instructions ", instructions.length > 0 && `(${instructions.length})`] }), _jsxs(TabsTrigger, { value: "agents", children: ["Agents ", agents.length > 0 && `(${agents.length})`] }), _jsxs(TabsTrigger, { value: "knowledge", children: ["Knowledge ", knowledge.length > 0 && `(${knowledge.length})`] })] }), _jsx(TabsContent, { value: "skills", className: "mt-4", children: _jsx(ResourceList, { items: skills, emptyText: "No workspace skills yet. Add a skill to share agent guidance across apps." }) }), _jsx(TabsContent, { value: "instructions", className: "mt-4", children: _jsx(ResourceList, { items: instructions, emptyText: "No workspace instructions yet. Add instructions to set behavioral rules across apps." }) }), _jsx(TabsContent, { value: "agents", className: "mt-4", children: _jsx(ResourceList, { items: agents, emptyText: "No workspace agents yet. Add a reusable agent profile to share specialist agents across apps." }) }), _jsx(TabsContent, { value: "knowledge", className: "mt-4", children: _jsx(ResourceList, { items: knowledge, emptyText: "No knowledge packs yet. Add GTM, product, or domain context that apps can reuse." }) })] })] }));
}
//# sourceMappingURL=workspace.js.map