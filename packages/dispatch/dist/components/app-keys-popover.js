import { jsx as _jsx, jsxs as _jsxs } from "react/jsx-runtime";
import { useMemo, useState } from "react";
import { useActionMutation, useActionQuery } from "@agent-native/core/client";
import { IconCheck, IconLoader2, IconRefresh, IconSettings, } from "@tabler/icons-react";
import { toast } from "sonner";
import { Popover, PopoverContent, PopoverTrigger, } from "../components/ui/popover.js";
import { Button } from "../components/ui/button.js";
import { Skeleton } from "../components/ui/skeleton.js";
export function AppKeysPopover({ appId, appName, trigger, align = "end", side = "bottom", }) {
    const [open, setOpen] = useState(false);
    return (_jsxs(Popover, { open: open, onOpenChange: setOpen, children: [_jsx(PopoverTrigger, { asChild: true, children: trigger ?? (_jsx("button", { type: "button", "aria-label": `Manage keys for ${appName}`, onClick: (event) => {
                        // Keep parent card click handlers from also firing. Do not
                        // preventDefault here: Radix uses the same click to open the
                        // popover trigger.
                        event.stopPropagation();
                    }, className: "flex h-7 w-7 cursor-pointer items-center justify-center rounded-md border border-transparent text-muted-foreground/70 hover:border-border hover:bg-accent/40 hover:text-foreground", children: _jsx(IconSettings, { size: 14 }) })) }), _jsx(PopoverContent, { align: align, side: side, sideOffset: 6, className: "w-80 p-3", onClick: (event) => event.stopPropagation(), children: open ? _jsx(AppKeysPanel, { appId: appId, appName: appName }) : null })] }));
}
function AppKeysPanel({ appId, appName }) {
    const { data: secrets = [], isLoading: secretsLoading } = useActionQuery("list-vault-secret-options", {});
    const { data: grants = [], isLoading: grantsLoading, refetch: refetchGrants, } = useActionQuery("list-vault-grants", { appId });
    const { data: accessSettings, isLoading: accessLoading } = useActionQuery("get-vault-access-settings", {});
    const accessMode = accessSettings?.mode === "manual" ? "manual" : "all-apps";
    const grantBySecretId = useMemo(() => {
        const map = new Map();
        for (const grant of grants) {
            if (grant.status && grant.status !== "active")
                continue;
            map.set(grant.secretId, grant);
        }
        return map;
    }, [grants]);
    // Track per-secret pending state so a fast double-click on the same row
    // can't queue two `create-vault-grant` requests (which would silently
    // create duplicate active grants — a later revoke only clears one).
    const [pendingSecretIds, setPendingSecretIds] = useState(() => new Set());
    const markPending = (secretId, pending) => setPendingSecretIds((prev) => {
        const next = new Set(prev);
        if (pending)
            next.add(secretId);
        else
            next.delete(secretId);
        return next;
    });
    const grantMutation = useActionMutation("create-vault-grant", {
        onSuccess: () => refetchGrants(),
        onError: (err) => toast.error(`Could not grant: ${String(err)}`),
    });
    const revokeMutation = useActionMutation("revoke-vault-grant", {
        onSuccess: () => refetchGrants(),
        onError: (err) => toast.error(`Could not revoke: ${String(err)}`),
    });
    const syncMutation = useActionMutation("sync-vault-to-app", {
        onSuccess: (result) => {
            const synced = result?.synced ?? 0;
            toast.success(synced > 0
                ? `Synced ${synced} key${synced === 1 ? "" : "s"} to ${appName}`
                : `${appName} is up to date`);
        },
        onError: (err) => toast.error(`Sync failed: ${String(err)}`),
    });
    const isLoading = secretsLoading || grantsLoading || accessLoading;
    const grantedCount = grantBySecretId.size;
    const typedSecrets = secrets;
    const allApps = accessMode !== "manual";
    const toggleSecret = (secret) => {
        if (allApps)
            return;
        if (pendingSecretIds.has(secret.id))
            return;
        const existing = grantBySecretId.get(secret.id);
        markPending(secret.id, true);
        const onSettled = () => markPending(secret.id, false);
        if (existing) {
            revokeMutation.mutate({ grantId: existing.id }, { onSettled });
        }
        else {
            grantMutation.mutate({ secretId: secret.id, appId }, { onSettled });
        }
    };
    return (_jsxs("div", { className: "flex flex-col gap-3", children: [_jsxs("div", { className: "flex items-center justify-between gap-2 px-1", children: [_jsxs("div", { className: "min-w-0", children: [_jsxs("p", { className: "truncate text-sm font-semibold text-foreground", children: ["Keys for ", appName] }), _jsx("p", { className: "text-[11px] text-muted-foreground", children: allApps
                                    ? `${typedSecrets.length} available`
                                    : `${grantedCount} of ${typedSecrets.length} granted` })] }), _jsxs(Button, { type: "button", variant: "outline", size: "sm", disabled: syncMutation.isPending ||
                            typedSecrets.length === 0 ||
                            (!allApps && grantedCount === 0), onClick: () => syncMutation.mutate({ appId }), className: "h-7 px-2", children: [syncMutation.isPending ? (_jsx(IconLoader2, { className: "h-3 w-3 animate-spin" })) : (_jsx(IconRefresh, { className: "h-3 w-3" })), _jsx("span", { className: "ml-1 text-xs", children: "Sync" })] })] }), _jsx("div", { className: "max-h-[320px] space-y-1.5 overflow-y-auto rounded-md border border-border bg-card p-1.5", children: isLoading ? (_jsx("div", { className: "space-y-1.5 p-1.5", children: Array.from({ length: 3 }).map((_, index) => (_jsxs("div", { className: "flex items-start gap-3 rounded-md px-2.5 py-2", children: [_jsx(Skeleton, { className: "mt-0.5 h-4 w-4 shrink-0 rounded" }), _jsxs("div", { className: "flex-1 space-y-1.5", children: [_jsx(Skeleton, { className: "h-3 w-1/2" }), _jsx(Skeleton, { className: "h-3 w-3/4" })] })] }, index))) })) : typedSecrets.length === 0 ? (_jsx("p", { className: "rounded-md border border-dashed border-border px-3 py-3 text-xs text-muted-foreground", children: "No vault keys yet. Add one from the Vault page." })) : (typedSecrets.map((secret) => {
                    const granted = allApps || grantBySecretId.has(secret.id);
                    const pending = pendingSecretIds.has(secret.id);
                    return (_jsxs("button", { type: "button", "aria-pressed": granted, disabled: pending || allApps, onClick: () => toggleSecret(secret), className: `flex w-full items-start gap-3 rounded-md px-2.5 py-2 text-left text-sm disabled:cursor-not-allowed disabled:opacity-60 ${pending || allApps ? "" : "cursor-pointer"} ${granted
                            ? "border border-primary/45 bg-primary/5"
                            : "border border-transparent hover:border-muted-foreground/30 hover:bg-accent/35"}`, children: [_jsx("span", { className: `mt-0.5 flex h-4 w-4 shrink-0 items-center justify-center rounded border ${granted
                                    ? "border-primary/60 bg-primary/10 text-primary"
                                    : "border-muted-foreground/35 text-transparent"}`, children: granted ? _jsx(IconCheck, { className: "h-3 w-3" }) : null }), _jsxs("span", { className: "min-w-0 flex-1", children: [_jsx("span", { className: "block truncate font-medium", children: secret.credentialKey }), _jsx("span", { className: "block truncate text-xs text-muted-foreground/70", children: allApps
                                            ? "Available to this app"
                                            : secret.provider || secret.name || "Vault secret" })] })] }, secret.id));
                })) })] }));
}
//# sourceMappingURL=app-keys-popover.js.map