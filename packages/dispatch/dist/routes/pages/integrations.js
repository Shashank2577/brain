import { jsxs as _jsxs, jsx as _jsx, Fragment as _Fragment } from "react/jsx-runtime";
import { useMemo, useState } from "react";
import { useActionMutation, useActionQuery } from "@agent-native/core/client";
import { useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { IconCheck, IconChevronRight, IconCircleDashed, IconKey, IconLink, IconPlugConnected, } from "@tabler/icons-react";
import { DispatchShell } from "../../components/dispatch-shell.js";
import { Badge } from "../../components/ui/badge.js";
import { Button } from "../../components/ui/button.js";
import { Collapsible, CollapsibleContent, CollapsibleTrigger, } from "../../components/ui/collapsible.js";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, } from "../../components/ui/dialog.js";
import { Input } from "../../components/ui/input.js";
import { Label } from "../../components/ui/label.js";
import { Tooltip, TooltipContent, TooltipTrigger, } from "../../components/ui/tooltip.js";
export function meta() {
    return [{ title: "Connections — Dispatch" }];
}
function inferProviderFromKey(key, label) {
    const haystack = `${key} ${label}`.toLowerCase();
    for (const provider of [
        "google",
        "slack",
        "sendgrid",
        "github",
        "stripe",
        "hubspot",
        "jira",
        "bigquery",
        "anthropic",
        "openai",
    ]) {
        if (haystack.includes(provider))
            return provider;
    }
    return "other";
}
function ConnectDialog({ service, open, onOpenChange, }) {
    const [value, setValue] = useState("");
    const qc = useQueryClient();
    const createSecret = useActionMutation("create-vault-secret", {});
    const createGrant = useActionMutation("create-vault-grant", {});
    const syncToApp = useActionMutation("sync-vault-to-app", {});
    function reset() {
        setValue("");
    }
    async function handleSave() {
        const trimmed = value.trim();
        if (!trimmed) {
            toast.error("Enter a value to save");
            return;
        }
        try {
            // 1. Create the secret (or get the existing one — server treats key as
            // the unique identifier). The server returns { secret: { id, ... } }.
            const created = await createSecret.mutateAsync({
                credentialKey: service.key,
                name: service.label,
                value: trimmed,
                provider: inferProviderFromKey(service.key, service.label),
            });
            const secretId = created?.secret?.id ??
                created?.id;
            if (!secretId) {
                throw new Error("Secret created but id missing");
            }
            // 2. Grant + sync to every app that declared this credential.
            const targets = service.apps.filter((a) => !a.vaultGranted);
            for (const app of targets) {
                try {
                    await createGrant.mutateAsync({
                        secretId,
                        appId: app.appId,
                    });
                }
                catch (err) {
                    console.warn(`grant to ${app.appId} failed`, err);
                }
            }
            for (const app of service.apps) {
                try {
                    await syncToApp.mutateAsync({ appId: app.appId });
                }
                catch (err) {
                    console.warn(`sync to ${app.appId} failed`, err);
                }
            }
            qc.invalidateQueries({
                queryKey: ["action", "list-integrations-catalog"],
            });
            toast.success(`Connected ${service.label}`);
            onOpenChange(false);
            reset();
        }
        catch (err) {
            toast.error(err?.message ?? "Failed to save credential");
        }
    }
    const pending = createSecret.isPending || createGrant.isPending || syncToApp.isPending;
    return (_jsx(Dialog, { open: open, onOpenChange: (next) => {
            if (!next)
                reset();
            onOpenChange(next);
        }, children: _jsxs(DialogContent, { children: [_jsxs(DialogHeader, { children: [_jsxs(DialogTitle, { children: ["Connect ", service.label] }), _jsxs(DialogDescription, { children: ["Used by", " ", service.apps.length === 1
                                    ? service.apps[0].appName
                                    : `${service.apps.length} apps`, ". Saved to the workspace vault and synced to every app that needs it."] })] }), _jsxs("div", { className: "space-y-3", children: [_jsxs("div", { children: [_jsx(Label, { className: "text-xs text-muted-foreground", children: "Key" }), _jsx("div", { className: "font-mono text-sm", children: service.key })] }), _jsxs("div", { children: [_jsx(Label, { htmlFor: "connector-value", children: "Value" }), _jsx(Input, { id: "connector-value", type: "password", autoComplete: "off", value: value, onChange: (e) => setValue(e.target.value), placeholder: `Paste your ${service.label} key…`, autoFocus: true })] })] }), _jsxs(DialogFooter, { children: [_jsx(Button, { variant: "outline", onClick: () => onOpenChange(false), disabled: pending, children: "Cancel" }), _jsx(Button, { onClick: handleSave, disabled: pending || !value.trim(), children: pending ? "Saving…" : "Connect" })] })] }) }));
}
function ConnectorCard({ service }) {
    const [open, setOpen] = useState(false);
    const isConnected = service.apps.some((a) => a.configured);
    const appCount = service.apps.length;
    return (_jsxs(_Fragment, { children: [_jsxs("button", { type: "button", onClick: () => setOpen(true), className: "group flex flex-col items-start gap-2 rounded-2xl border bg-card p-5 text-left transition hover:border-foreground/20 hover:bg-card/80 cursor-pointer", children: [_jsxs("div", { className: "flex w-full items-start justify-between gap-2", children: [_jsx("div", { className: "flex h-9 w-9 items-center justify-center rounded-xl bg-muted", children: _jsx(IconKey, { size: 16, className: "text-muted-foreground" }) }), isConnected ? (_jsxs(Badge, { variant: "secondary", className: "bg-green-500/10 text-green-700 dark:text-green-400 gap-1", children: [_jsx(IconCheck, { size: 12 }), "Connected"] })) : (_jsxs(Badge, { variant: "secondary", className: "bg-amber-500/10 text-amber-700 dark:text-amber-400 gap-1", children: [_jsx(IconCircleDashed, { size: 12 }), "Connect"] }))] }), _jsxs("div", { className: "w-full min-w-0", children: [_jsxs(Tooltip, { children: [_jsx(TooltipTrigger, { asChild: true, children: _jsx("div", { className: "text-sm font-semibold text-foreground truncate", children: service.label }) }), _jsx(TooltipContent, { children: service.label })] }), _jsx("div", { className: "font-mono text-xs text-muted-foreground/80 truncate", children: service.key })] }), _jsxs("div", { className: "text-xs text-muted-foreground", children: ["Used by ", appCount, " ", appCount === 1 ? "app" : "apps"] })] }), _jsx(ConnectDialog, { service: service, open: open, onOpenChange: setOpen })] }));
}
function PerAppDetailRow({ app }) {
    const total = (app.integrations ?? []).length;
    const ok = (app.integrations ?? []).filter((i) => i.configured).length;
    return (_jsxs("div", { className: "flex items-center justify-between border-t px-4 py-2.5 first:border-t-0", children: [_jsxs("div", { className: "flex items-center gap-2 min-w-0", children: [_jsx("div", { className: "h-5 w-5 rounded text-[10px] font-bold text-white flex items-center justify-center shrink-0", style: { backgroundColor: app.color }, children: app.appName.charAt(0).toUpperCase() }), _jsx("span", { className: "text-sm truncate", children: app.appName }), !app.reachable && (_jsx("span", { className: "text-xs text-muted-foreground", children: "offline" }))] }), _jsx("span", { className: "text-xs text-muted-foreground", children: total === 0 ? "no integrations" : `${ok}/${total}` })] }));
}
export default function ConnectionsRoute() {
    const { data: catalog, isLoading } = useActionQuery("list-integrations-catalog", {});
    const apps = catalog || [];
    const services = useMemo(() => {
        const map = new Map();
        for (const app of apps) {
            for (const intg of app.integrations ?? []) {
                if (!map.has(intg.key)) {
                    map.set(intg.key, {
                        key: intg.key,
                        label: intg.label,
                        apps: [],
                    });
                }
                map.get(intg.key).apps.push({
                    appId: app.appId,
                    appName: app.appName,
                    color: app.color,
                    configured: intg.configured,
                    vaultGranted: intg.vaultGranted,
                    vaultSecretId: intg.vaultSecretId,
                });
            }
        }
        return Array.from(map.values()).sort((a, b) => a.label.localeCompare(b.label));
    }, [apps]);
    const available = services.filter((s) => !s.apps.some((a) => a.configured));
    const connected = services.filter((s) => s.apps.some((a) => a.configured));
    return (_jsxs(DispatchShell, { title: "Connections", description: "Connect services once. Apps that need them pick up the key automatically.", children: [isLoading && services.length === 0 && (_jsx("div", { className: "rounded-2xl border border-dashed px-6 py-12 text-center text-sm text-muted-foreground", children: "Discovering apps and credentials\u2026" })), !isLoading && services.length === 0 && (_jsx("div", { className: "rounded-2xl border border-dashed px-6 py-12 text-center text-sm text-muted-foreground", children: "No apps with declared integrations are reachable yet." })), available.length > 0 && (_jsxs("section", { children: [_jsxs("div", { className: "mb-3 flex items-baseline justify-between", children: [_jsx("h2", { className: "text-sm font-medium text-foreground", children: "Available to connect" }), _jsx("span", { className: "text-xs text-muted-foreground", children: available.length })] }), _jsx("div", { className: "grid gap-3 sm:grid-cols-2 xl:grid-cols-3", children: available.map((service) => (_jsx(ConnectorCard, { service: service }, service.key))) })] })), connected.length > 0 && (_jsxs("section", { children: [_jsxs("div", { className: "mb-3 mt-2 flex items-baseline justify-between", children: [_jsx("h2", { className: "text-sm font-medium text-foreground", children: "Connected" }), _jsx("span", { className: "text-xs text-muted-foreground", children: connected.length })] }), _jsx("div", { className: "grid gap-3 sm:grid-cols-2 xl:grid-cols-3", children: connected.map((service) => (_jsx(ConnectorCard, { service: service }, service.key))) })] })), apps.length > 0 && (_jsxs(Collapsible, { className: "mt-6 rounded-2xl border bg-card", children: [_jsxs(CollapsibleTrigger, { className: "flex w-full items-center justify-between px-4 py-3 text-sm", children: [_jsxs("span", { className: "flex items-center gap-2 text-muted-foreground", children: [_jsx(IconPlugConnected, { size: 14 }), "Per-app status"] }), _jsx(IconChevronRight, { size: 14, className: "text-muted-foreground transition group-data-[state=open]:rotate-90" })] }), _jsxs(CollapsibleContent, { children: [_jsx("div", { className: "border-t", children: apps.map((app) => (_jsx(PerAppDetailRow, { app: app }, app.appId))) }), _jsxs("div", { className: "flex items-center justify-end gap-1.5 border-t px-4 py-2.5 text-xs text-muted-foreground", children: [_jsx(IconLink, { size: 12 }), _jsx("a", { href: "/vault", className: "hover:underline", children: "Open vault for advanced sharing" })] })] })] }))] }));
}
//# sourceMappingURL=integrations.js.map