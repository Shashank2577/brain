import { jsx as _jsx, jsxs as _jsxs } from "react/jsx-runtime";
import { useState } from "react";
import { useActionMutation, useActionQuery } from "@agent-native/core/client";
import { toast } from "sonner";
import { IconChevronDown, IconChevronRight, IconEye, IconEyeOff, IconKey, IconPlus, IconRefresh, IconTrash, IconX, } from "@tabler/icons-react";
import { DispatchShell } from "../../components/dispatch-shell.js";
import { Badge } from "../../components/ui/badge.js";
import { Button } from "../../components/ui/button.js";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger, } from "../../components/ui/dialog.js";
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger, } from "../../components/ui/alert-dialog.js";
import { Input } from "../../components/ui/input.js";
import { Label } from "../../components/ui/label.js";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue, } from "../../components/ui/select.js";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "../../components/ui/tabs.js";
import { Textarea } from "../../components/ui/textarea.js";
import { Skeleton } from "../../components/ui/skeleton.js";
const PROVIDERS = [
    "google",
    "slack",
    "sendgrid",
    "github",
    "stripe",
    "hubspot",
    "jira",
    "bigquery",
    "anthropic",
    "other",
];
export function meta() {
    return [{ title: "Vault — Dispatch" }];
}
function AddSecretDialog() {
    const [open, setOpen] = useState(false);
    const [credentialKey, setCredentialKey] = useState("");
    const [name, setName] = useState("");
    const [value, setValue] = useState("");
    const [provider, setProvider] = useState("");
    const [description, setDescription] = useState("");
    const create = useActionMutation("create-vault-secret", {
        onSuccess: () => {
            toast.success("Secret created");
            setOpen(false);
            setCredentialKey("");
            setName("");
            setValue("");
            setProvider("");
            setDescription("");
        },
        onError: (err) => toast.error(String(err)),
    });
    return (_jsxs(Dialog, { open: open, onOpenChange: setOpen, children: [_jsx(DialogTrigger, { asChild: true, children: _jsxs(Button, { children: [_jsx(IconPlus, { size: 16, className: "mr-1.5" }), "Add secret"] }) }), _jsxs(DialogContent, { children: [_jsxs(DialogHeader, { children: [_jsx(DialogTitle, { children: "Add vault secret" }), _jsx(DialogDescription, { children: "Store a credential that can be granted to workspace apps." })] }), _jsxs("div", { className: "space-y-4 py-2", children: [_jsxs("div", { className: "space-y-2", children: [_jsx(Label, { children: "Name" }), _jsx(Input, { placeholder: "Google OAuth Client ID", value: name, onChange: (e) => setName(e.target.value) })] }), _jsxs("div", { className: "space-y-2", children: [_jsx(Label, { children: "Credential key (env var name)" }), _jsx(Input, { placeholder: "GOOGLE_CLIENT_ID", value: credentialKey, onChange: (e) => setCredentialKey(e.target.value), className: "font-mono text-sm" })] }), _jsxs("div", { className: "space-y-2", children: [_jsx(Label, { children: "Value" }), _jsx(Input, { type: "password", placeholder: "The secret value", value: value, onChange: (e) => setValue(e.target.value) })] }), _jsxs("div", { className: "space-y-2", children: [_jsx(Label, { children: "Provider" }), _jsxs(Select, { value: provider, onValueChange: setProvider, children: [_jsx(SelectTrigger, { children: _jsx(SelectValue, { placeholder: "Select a provider..." }) }), _jsx(SelectContent, { children: PROVIDERS.map((p) => (_jsx(SelectItem, { value: p, children: p.charAt(0).toUpperCase() + p.slice(1) }, p))) })] })] }), _jsxs("div", { className: "space-y-2", children: [_jsx(Label, { children: "Description (optional)" }), _jsx(Textarea, { placeholder: "What is this secret used for?", value: description, onChange: (e) => setDescription(e.target.value), rows: 2 })] })] }), _jsx(DialogFooter, { children: _jsx(Button, { onClick: () => create.mutate({
                                credentialKey,
                                name,
                                value,
                                provider: provider || undefined,
                                description: description || undefined,
                            }), disabled: !credentialKey || !name || !value || create.isPending, children: create.isPending ? "Creating..." : "Create secret" }) })] })] }));
}
function GrantDialog({ secretId, secretName, }) {
    const [open, setOpen] = useState(false);
    const [appId, setAppId] = useState("");
    const { data: catalog } = useActionQuery("list-integrations-catalog", {});
    const grant = useActionMutation("create-vault-grant", {
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
    return (_jsxs(Dialog, { open: open, onOpenChange: setOpen, children: [_jsx(DialogTrigger, { asChild: true, children: _jsxs(Button, { variant: "outline", size: "sm", children: [_jsx(IconPlus, { size: 14, className: "mr-1" }), "Grant"] }) }), _jsxs(DialogContent, { children: [_jsxs(DialogHeader, { children: [_jsxs(DialogTitle, { children: ["Grant \"", secretName, "\" to an app"] }), _jsx(DialogDescription, { children: "Choose which app should receive this secret." })] }), _jsx("div", { className: "py-2", children: _jsxs(Select, { value: appId, onValueChange: setAppId, children: [_jsx(SelectTrigger, { children: _jsx(SelectValue, { placeholder: "Select an app..." }) }), _jsx(SelectContent, { children: apps.map((app) => (_jsx(SelectItem, { value: app.id, children: app.name }, app.id))) })] }) }), _jsx(DialogFooter, { children: _jsx(Button, { onClick: () => grant.mutate({ secretId, appId }), disabled: !appId || grant.isPending, children: grant.isPending ? "Granting..." : "Grant access" }) })] })] }));
}
function SecretRow({ secret, grants }) {
    const [expanded, setExpanded] = useState(false);
    const [showValue, setShowValue] = useState(false);
    const deleteSecret = useActionMutation("delete-vault-secret", {
        onSuccess: () => toast.success("Secret deleted"),
        onError: (err) => toast.error(String(err)),
    });
    const revokeGrant = useActionMutation("revoke-vault-grant", {
        onSuccess: () => toast.success("Grant revoked"),
        onError: (err) => toast.error(String(err)),
    });
    const syncToApp = useActionMutation("sync-vault-to-app", {
        onSuccess: (data) => toast.success(`Synced ${data.synced} key(s) to ${data.appId}`),
        onError: (err) => toast.error(String(err)),
    });
    const activeGrants = grants.filter((g) => g.status === "active");
    return (_jsxs("div", { className: "rounded-xl border bg-card", children: [_jsxs("button", { type: "button", className: "flex w-full items-center gap-3 px-4 py-3 text-left cursor-pointer", onClick: () => setExpanded(!expanded), children: [expanded ? (_jsx(IconChevronDown, { size: 16, className: "text-muted-foreground" })) : (_jsx(IconChevronRight, { size: 16, className: "text-muted-foreground" })), _jsxs("div", { className: "min-w-0 flex-1", children: [_jsxs("div", { className: "flex items-center gap-2", children: [_jsx("span", { className: "text-sm font-medium text-foreground", children: secret.name }), secret.provider && (_jsx(Badge, { variant: "secondary", className: "text-xs", children: secret.provider }))] }), _jsx("div", { className: "mt-0.5 font-mono text-xs text-muted-foreground", children: secret.credentialKey })] }), _jsx("div", { className: "flex items-center gap-2", children: _jsxs(Badge, { variant: "outline", className: "text-xs", children: [activeGrants.length, " grant", activeGrants.length !== 1 ? "s" : ""] }) })] }), expanded && (_jsxs("div", { className: "border-t px-4 py-3 space-y-3", children: [secret.description && (_jsx("p", { className: "text-sm text-muted-foreground", children: secret.description })), _jsxs("div", { className: "flex items-center gap-2", children: [_jsx("span", { className: "text-xs text-muted-foreground", children: "Value:" }), _jsx("code", { className: "text-xs font-mono text-foreground", children: showValue ? secret.value : `••••${secret.value.slice(-4)}` }), _jsx("button", { type: "button", onClick: () => setShowValue(!showValue), className: "text-muted-foreground hover:text-foreground cursor-pointer", children: showValue ? _jsx(IconEyeOff, { size: 14 }) : _jsx(IconEye, { size: 14 }) })] }), _jsxs("div", { className: "space-y-2", children: [_jsxs("div", { className: "flex items-center justify-between", children: [_jsx("span", { className: "text-xs font-medium text-foreground", children: "Grants" }), _jsx(GrantDialog, { secretId: secret.id, secretName: secret.name })] }), activeGrants.length > 0 ? (_jsx("div", { className: "space-y-1.5", children: activeGrants.map((grant) => (_jsxs("div", { className: "flex items-center justify-between rounded-lg border px-3 py-2", children: [_jsxs("div", { children: [_jsx("span", { className: "text-sm font-medium text-foreground", children: grant.appId }), _jsx("span", { className: "ml-2 text-xs text-muted-foreground", children: grant.syncedAt
                                                        ? `synced ${new Date(grant.syncedAt).toLocaleString()}`
                                                        : "not synced" })] }), _jsxs("div", { className: "flex gap-1.5", children: [_jsx(Button, { variant: "ghost", size: "sm", onClick: () => syncToApp.mutate({ appId: grant.appId }), disabled: syncToApp.isPending, children: _jsx(IconRefresh, { size: 14 }) }), _jsx(Button, { variant: "ghost", size: "sm", onClick: () => revokeGrant.mutate({ grantId: grant.id }), disabled: revokeGrant.isPending, children: _jsx(IconX, { size: 14 }) })] })] }, grant.id))) })) : (_jsx("div", { className: "rounded-lg border border-dashed px-3 py-4 text-center text-xs text-muted-foreground", children: "No grants yet. Grant this secret to an app to share it." }))] }), _jsx("div", { className: "flex justify-end border-t pt-3", children: _jsxs(AlertDialog, { children: [_jsx(AlertDialogTrigger, { asChild: true, children: _jsxs(Button, { variant: "destructive", size: "sm", disabled: deleteSecret.isPending, children: [_jsx(IconTrash, { size: 14, className: "mr-1" }), "Delete secret"] }) }), _jsxs(AlertDialogContent, { children: [_jsxs(AlertDialogHeader, { children: [_jsx(AlertDialogTitle, { children: "Delete this secret?" }), _jsxs(AlertDialogDescription, { children: ["Removing \u201C", secret.name, "\u201D revokes all of its grants. Apps that depended on this credential will lose access on the next sync. This cannot be undone."] })] }), _jsxs(AlertDialogFooter, { children: [_jsx(AlertDialogCancel, { children: "Cancel" }), _jsx(AlertDialogAction, { onClick: () => deleteSecret.mutate({ id: secret.id }), children: "Delete secret" })] })] })] }) })] }))] }));
}
function RequestRow({ request }) {
    const [secretValue, setSecretValue] = useState("");
    const approve = useActionMutation("approve-vault-request", {
        onSuccess: () => {
            toast.success("Request approved");
            setSecretValue("");
        },
        onError: (err) => toast.error(String(err)),
    });
    const deny = useActionMutation("deny-vault-request", {
        onSuccess: () => toast.success("Request denied"),
        onError: (err) => toast.error(String(err)),
    });
    return (_jsxs("div", { className: "rounded-xl border bg-muted/30 px-4 py-3", children: [_jsxs("div", { className: "flex items-start justify-between gap-3", children: [_jsxs("div", { children: [_jsxs("div", { className: "text-sm font-medium text-foreground", children: [_jsx("span", { className: "font-mono", children: request.credentialKey }), " for", " ", _jsx("span", { className: "font-semibold", children: request.appId })] }), _jsxs("div", { className: "mt-1 text-xs text-muted-foreground", children: ["Requested by ", request.requestedBy, request.reason && ` — "${request.reason}"`] }), _jsxs("div", { className: "mt-0.5 text-xs text-muted-foreground", children: [request.status === "pending"
                                        ? "Pending"
                                        : request.status === "approved"
                                            ? `Approved by ${request.reviewedBy}`
                                            : `Denied by ${request.reviewedBy}`, " ", "\u00B7 ", new Date(request.createdAt).toLocaleString()] })] }), request.status === "pending" && (_jsx(Badge, { variant: "outline", className: "whitespace-nowrap", children: "Pending" })), request.status === "approved" && (_jsx(Badge, { variant: "secondary", className: "whitespace-nowrap bg-green-500/10 text-green-700 dark:text-green-400", children: "Approved" })), request.status === "denied" && (_jsx(Badge, { variant: "secondary", className: "whitespace-nowrap bg-red-500/10 text-red-700 dark:text-red-400", children: "Denied" }))] }), request.status === "pending" && (_jsxs("div", { className: "mt-3 flex items-end gap-2 border-t pt-3", children: [_jsxs("div", { className: "flex-1 space-y-1", children: [_jsx(Label, { className: "text-xs", children: "Secret value to provision" }), _jsx(Input, { type: "password", placeholder: "Enter the secret value", value: secretValue, onChange: (e) => setSecretValue(e.target.value), className: "h-8 text-sm" })] }), _jsx(Button, { size: "sm", onClick: () => approve.mutate({ id: request.id, secretValue }), disabled: !secretValue || approve.isPending, children: "Approve" }), _jsx(Button, { size: "sm", variant: "outline", onClick: () => deny.mutate({ id: request.id }), disabled: deny.isPending, children: "Deny" })] }))] }));
}
export default function VaultRoute() {
    const { data: secrets, isLoading: secretsLoading } = useActionQuery("list-vault-secrets", {});
    const { data: grants } = useActionQuery("list-vault-grants", {});
    const { data: requests } = useActionQuery("list-vault-requests", {});
    const { data: audit } = useActionQuery("list-vault-audit", { limit: 20 });
    const grantsBySecret = (grants || []).reduce((acc, g) => {
        if (!acc[g.secretId])
            acc[g.secretId] = [];
        acc[g.secretId].push(g);
        return acc;
    }, {});
    const pendingRequests = (requests || []).filter((r) => r.status === "pending");
    return (_jsx(DispatchShell, { title: "Vault", description: "Centralized secret management for your workspace. Store credentials once, grant them to apps.", children: _jsxs(Tabs, { defaultValue: "secrets", children: [_jsxs(TabsList, { children: [_jsxs(TabsTrigger, { value: "secrets", children: ["Secrets ", (secrets?.length || 0) > 0 && `(${secrets?.length})`] }), _jsxs(TabsTrigger, { value: "requests", children: ["Requests", " ", pendingRequests.length > 0 && (_jsx(Badge, { variant: "secondary", className: "ml-1.5 h-5 px-1.5 text-xs bg-amber-500/10 text-amber-700 dark:text-amber-400", children: pendingRequests.length }))] }), _jsx(TabsTrigger, { value: "audit", children: "Audit" })] }), _jsxs(TabsContent, { value: "secrets", className: "mt-4 space-y-3", children: [_jsxs("div", { className: "flex items-center justify-between", children: [_jsxs("div", { className: "flex items-center gap-2 text-sm text-muted-foreground", children: [_jsx(IconKey, { size: 16 }), secretsLoading ? (_jsx(Skeleton, { className: "h-4 w-20" })) : (_jsx("span", { children: `${secrets?.length || 0} secret${(secrets?.length || 0) !== 1 ? "s" : ""}` }))] }), _jsx(AddSecretDialog, {})] }), secretsLoading && (secrets ?? []).length === 0
                            ? Array.from({ length: 3 }).map((_, index) => (_jsxs("div", { className: "rounded-2xl border bg-card px-5 py-4 space-y-2", children: [_jsx(Skeleton, { className: "h-4 w-1/3" }), _jsx(Skeleton, { className: "h-3 w-2/3" })] }, index)))
                            : (secrets || []).map((secret) => (_jsx(SecretRow, { secret: secret, grants: grantsBySecret[secret.id] || [] }, secret.id))), !secretsLoading && (secrets?.length || 0) === 0 && (_jsxs("div", { className: "rounded-2xl border border-dashed px-6 py-12 text-center", children: [_jsx(IconKey, { size: 32, className: "mx-auto text-muted-foreground/50" }), _jsx("h3", { className: "mt-3 text-sm font-medium text-foreground", children: "No secrets yet" }), _jsx("p", { className: "mt-1 text-sm text-muted-foreground", children: "Add your first secret to start sharing credentials across workspace apps." })] }))] }), _jsxs(TabsContent, { value: "requests", className: "mt-4 space-y-3", children: [(requests || []).map((request) => (_jsx(RequestRow, { request: request }, request.id))), (requests?.length || 0) === 0 && (_jsx("div", { className: "rounded-2xl border border-dashed px-6 py-12 text-center text-sm text-muted-foreground", children: "No secret requests yet." }))] }), _jsxs(TabsContent, { value: "audit", className: "mt-4 space-y-2", children: [(audit || []).map((event) => (_jsxs("div", { className: "rounded-xl border bg-muted/30 px-4 py-3", children: [_jsx("div", { className: "text-sm font-medium text-foreground", children: event.summary }), _jsxs("div", { className: "mt-1 text-xs text-muted-foreground", children: [event.actor, " \u00B7 ", new Date(event.createdAt).toLocaleString()] })] }, event.id))), (audit?.length || 0) === 0 && (_jsx("div", { className: "rounded-2xl border border-dashed px-6 py-12 text-center text-sm text-muted-foreground", children: "No vault activity yet." }))] })] }) }));
}
//# sourceMappingURL=vault.js.map