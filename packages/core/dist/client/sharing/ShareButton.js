import { jsx as _jsx, jsxs as _jsxs, Fragment as _Fragment } from "react/jsx-runtime";
import { useEffect, useMemo, useRef, useState, } from "react";
import { useQueryClient } from "@tanstack/react-query";
import { IconLock, IconBuilding, IconWorld, IconTrash, IconCheck, IconChevronDown, IconCopy, } from "@tabler/icons-react";
import * as Select from "@radix-ui/react-select";
import { Popover, PopoverContent, PopoverTrigger, } from "../components/ui/popover.js";
import { useActionQuery, useActionMutation } from "../use-action.js";
import { cn } from "../utils.js";
import { agentNativePath } from "../api-path.js";
// Mirror shadcn's <Button size="sm" variant="outline"> class string so the
// trigger sits flush next to other sm outline buttons in the template.
const BUTTON_BASE = "inline-flex items-center justify-center gap-2 whitespace-nowrap rounded-md text-sm font-medium ring-offset-background transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50 [&_svg]:pointer-events-none [&_svg]:size-4 [&_svg]:shrink-0";
const BUTTON_OUTLINE_SM = cn(BUTTON_BASE, "h-9 px-3 border border-[hsl(var(--sidebar-border,var(--input)))] bg-[hsl(var(--sidebar-background,var(--background)))] text-foreground hover:bg-[hsl(var(--sidebar-accent,var(--accent)))] hover:text-[hsl(var(--sidebar-accent-foreground,var(--accent-foreground)))]");
const BUTTON_PRIMARY_SM = cn(BUTTON_BASE, "h-9 px-4 bg-primary text-primary-foreground hover:bg-primary/90");
const BUTTON_GHOST_ICON = cn(BUTTON_BASE, "h-7 w-7 p-0 text-muted-foreground hover:bg-accent hover:text-accent-foreground");
const SHARE_POPOVER_SURFACE = "border-[hsl(var(--sidebar-border,var(--border)))] bg-[hsl(var(--sidebar-background,var(--popover)))]";
const VIS_META = {
    private: {
        label: "Private",
        description: "Only people with access can view",
        Icon: IconLock,
    },
    org: {
        label: "Organization",
        description: "Anyone in your organization can view",
        Icon: IconBuilding,
    },
    public: {
        label: "Public",
        description: "Anyone with the link can view",
        Icon: IconWorld,
    },
};
function visibilityMeta(visibility, copy) {
    const base = VIS_META[visibility];
    const override = copy?.[visibility];
    return {
        ...base,
        label: override?.label ?? base.label,
        description: override?.description ?? base.description,
    };
}
const ROLE_OPTIONS = [
    { value: "viewer", label: "Viewer", description: "Can view" },
    { value: "editor", label: "Editor", description: "Can edit" },
    {
        value: "admin",
        label: "Admin",
        description: "Can edit and manage access",
    },
];
/**
 * Framework share control. Renders a shadcn-outline-styled trigger that
 * opens a Google-Docs-style popover anchored beneath it. Uses Tailwind
 * + CSS variables so the same component renders natively in light and
 * dark mode in any shadcn template.
 */
export function ShareButton(props) {
    const [open, setOpen] = useState(false);
    const [pendingVisibility, setPendingVisibility] = useState(null);
    const visibilityRequestId = useRef(0);
    const queryClient = useQueryClient();
    const shareQueryParams = useMemo(() => ({
        resourceType: props.resourceType,
        resourceId: props.resourceId,
    }), [props.resourceType, props.resourceId]);
    const shareQueryKey = useMemo(() => ["action", "list-resource-shares", shareQueryParams], [shareQueryParams]);
    const setVisibility = useActionMutation("set-resource-visibility");
    const sharesQuery = useActionQuery("list-resource-shares", shareQueryParams);
    const handleOpenChange = (v) => {
        setOpen(v);
        props.onOpenChange?.(v);
        if (v && pendingVisibility === null)
            sharesQuery.refetch();
    };
    const updateCachedVisibility = (visibility) => {
        queryClient.setQueryData(shareQueryKey, (prev) => prev ? { ...prev, visibility } : prev);
    };
    const handleVisibilityChange = (next) => {
        const requestId = ++visibilityRequestId.current;
        const previous = queryClient.getQueryData(shareQueryKey);
        setPendingVisibility(next);
        updateCachedVisibility(next);
        return new Promise((resolve, reject) => {
            setVisibility.mutate({
                resourceType: props.resourceType,
                resourceId: props.resourceId,
                visibility: next,
            }, {
                onSuccess: (result) => {
                    if (requestId === visibilityRequestId.current) {
                        updateCachedVisibility(result?.visibility ?? next);
                    }
                    sharesQuery
                        .refetch()
                        .then(() => resolve())
                        .catch(reject)
                        .finally(() => {
                        if (requestId === visibilityRequestId.current) {
                            setPendingVisibility(null);
                        }
                    });
                },
                onError: (error) => {
                    if (requestId === visibilityRequestId.current) {
                        setPendingVisibility(null);
                        if (previous) {
                            queryClient.setQueryData(shareQueryKey, previous);
                        }
                        else {
                            queryClient.invalidateQueries({ queryKey: shareQueryKey });
                        }
                    }
                    reject(error);
                },
            });
        });
    };
    // The trigger always says "Share" — the icon reflects the resource's
    // current visibility (lock / building / globe), matching Google Docs.
    // While the query is loading and we don't know the visibility yet,
    // render a skeleton placeholder in the icon slot instead of guessing.
    const loaded = sharesQuery.data !== undefined;
    const policy = sharesQuery.data?.policy ?? {
        allowPublic: true,
        requireOrgMemberForUserShares: false,
    };
    const serverVisibility = sharesQuery.data?.visibility ?? "private";
    const currentVisibility = pendingVisibility ?? serverVisibility;
    const TriggerIcon = currentVisibility === "public"
        ? IconWorld
        : currentVisibility === "org"
            ? IconBuilding
            : IconLock;
    return (_jsxs(Popover, { open: open, onOpenChange: handleOpenChange, children: [_jsx(PopoverTrigger, { asChild: true, children: _jsxs("button", { type: "button", className: BUTTON_OUTLINE_SM, children: [loaded ? (_jsx(TriggerIcon, { size: 16, strokeWidth: 1.75 })) : (_jsx("span", { "aria-hidden": true, className: "inline-block h-4 w-4 rounded-sm bg-muted animate-pulse" })), _jsx("span", { children: "Share" })] }) }), _jsx(PopoverContent, { align: "end", sideOffset: 6, className: cn("z-[2000] w-[min(460px,92vw)] rounded-lg p-4 shadow-lg", SHARE_POPOVER_SURFACE), onOpenAutoFocus: (e) => e.preventDefault(), children: _jsx(SharePanel, { ...props, sharesQuery: sharesQuery, visibilityOverride: pendingVisibility, onVisibilityChange: handleVisibilityChange, onClose: () => handleOpenChange(false) }) })] }));
}
function useOrgMembers() {
    const [members, setMembers] = useState([]);
    useEffect(() => {
        let cancelled = false;
        fetch(agentNativePath("/_agent-native/org/members"))
            .then((r) => (r.ok ? r.json() : null))
            .then((data) => {
            if (cancelled || !data)
                return;
            const list = Array.isArray(data?.members) ? data.members : [];
            setMembers(list
                .map((m) => ({
                email: typeof m?.email === "string" ? m.email : "",
                name: typeof m?.name === "string" ? m.name : null,
            }))
                .filter((m) => m.email));
        })
            .catch(() => { });
        return () => {
            cancelled = true;
        };
    }, []);
    return members;
}
function SharePanel(props) {
    const { resourceType, resourceId, resourceTitle, sharesQuery, visibilityOverride, onVisibilityChange, onClose, } = props;
    const share = useActionMutation("share-resource");
    const unshare = useActionMutation("unshare-resource");
    const [email, setEmail] = useState("");
    const [role, setRole] = useState("viewer");
    const [notifyPeople, setNotifyPeople] = useState(true);
    const [shareError, setShareError] = useState(null);
    const hasInviteEmail = email.trim().length > 0;
    const orgMembers = useOrgMembers();
    const datalistId = `share-autocomplete-${resourceType}-${resourceId}`;
    // Optimistic overlays so clicks feel instant.
    const [pendingAdds, setPendingAdds] = useState([]);
    const [pendingRemoves, setPendingRemoves] = useState(new Set());
    const [roleOverrides, setRoleOverrides] = useState({});
    // Principals with an in-flight share/unshare mutation. We disable the
    // role dropdown and the trash button for any share in this set so a
    // user can't race a role-change against a remove (which would otherwise
    // let the upsert silently re-grant access after the delete landed), and
    // can't rapid-fire two creates for the same pending add.
    const [inFlight, setInFlight] = useState(new Set());
    const addInFlight = (k) => setInFlight((prev) => new Set(prev).add(k));
    const clearInFlight = (k) => setInFlight((prev) => {
        const next = new Set(prev);
        next.delete(k);
        return next;
    });
    useEffect(() => {
        sharesQuery.refetch();
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, []);
    const data = sharesQuery.data;
    const isLoading = data === undefined;
    const policy = data?.policy ?? {
        allowPublic: true,
        requireOrgMemberForUserShares: false,
    };
    const visibility = visibilityOverride ?? data?.visibility ?? "private";
    const canManage = data?.role === "owner" || data?.role === "admin";
    const meta = visibilityMeta(visibility, props.visibilityCopy);
    const serverShares = data?.shares ?? [];
    const shares = [
        ...serverShares
            .filter((s) => !pendingRemoves.has(keyOf(s)))
            .map((s) => ({ ...s, role: roleOverrides[keyOf(s)] ?? s.role })),
        ...pendingAdds,
    ];
    const handleVisibility = (next) => {
        if (next === visibility)
            return;
        setShareError(null);
        void onVisibilityChange(next).catch((err) => {
            setShareError(extractShareErrorMessage(err));
        });
    };
    const handleAdd = () => {
        const trimmed = email.trim();
        if (!trimmed)
            return;
        const optimistic = {
            id: `pending-${trimmed}`,
            principalType: "user",
            principalId: trimmed,
            role,
        };
        const k = keyOf(optimistic);
        // Ignore duplicate submits while an add for the same principal is in flight.
        if (inFlight.has(k))
            return;
        setShareError(null);
        setPendingAdds((p) => [...p, optimistic]);
        setEmail("");
        addInFlight(k);
        share.mutate({
            resourceType,
            resourceId,
            principalType: "user",
            principalId: trimmed,
            role,
            notify: notifyPeople,
            resourceUrl: getNotificationUrl(props.shareUrl),
        }, {
            onSuccess: () => {
                sharesQuery.refetch().then(() => {
                    setPendingAdds((p) => p.filter((s) => s.id !== optimistic.id));
                    clearInFlight(k);
                });
            },
            onError: (err) => {
                setPendingAdds((p) => p.filter((s) => s.id !== optimistic.id));
                clearInFlight(k);
                setEmail(trimmed);
                setShareError(extractShareErrorMessage(err));
            },
        });
    };
    const handleChangeRole = (s, next) => {
        if (s.role === next)
            return;
        const k = keyOf(s);
        // Don't stack a role change on top of an in-flight add/remove/role
        // change for the same principal — it can race with unshare and end up
        // re-granting access after a delete. UI already disables the control,
        // but belt-and-suspenders here too.
        if (inFlight.has(k))
            return;
        setRoleOverrides((prev) => ({ ...prev, [k]: next }));
        addInFlight(k);
        // share-resource is upsert: calling with same principal + new role
        // updates the existing share row. See sharing/actions/share-resource.ts.
        share.mutate({
            resourceType,
            resourceId,
            principalType: s.principalType,
            principalId: s.principalId,
            role: next,
            notify: false,
        }, {
            onSuccess: () => {
                sharesQuery.refetch().then(() => {
                    setRoleOverrides((prev) => {
                        const { [k]: _, ...rest } = prev;
                        return rest;
                    });
                    clearInFlight(k);
                });
            },
            onError: () => {
                setRoleOverrides((prev) => {
                    const { [k]: _, ...rest } = prev;
                    return rest;
                });
                clearInFlight(k);
            },
        });
    };
    const handleRemove = (s) => {
        const k = keyOf(s);
        // If any other mutation is in flight for this principal, don't start a
        // remove — it can interleave with an upsert and leave the row in place.
        // The UI already disables the trash button when inFlight.has(k).
        if (inFlight.has(k))
            return;
        setPendingRemoves((prev) => new Set(prev).add(k));
        addInFlight(k);
        unshare.mutate({
            resourceType,
            resourceId,
            principalType: s.principalType,
            principalId: s.principalId,
        }, {
            onSuccess: () => {
                sharesQuery.refetch().then(() => {
                    setPendingRemoves((prev) => {
                        const next = new Set(prev);
                        next.delete(k);
                        return next;
                    });
                    clearInFlight(k);
                });
            },
            onError: () => {
                setPendingRemoves((prev) => {
                    const next = new Set(prev);
                    next.delete(k);
                    return next;
                });
                clearInFlight(k);
            },
        });
    };
    const handleDone = () => {
        if (canManage && hasInviteEmail)
            handleAdd();
        onClose();
    };
    const titleText = resourceTitle
        ? `Share "${resourceTitle}"`
        : `Share ${resourceType}`;
    if (isLoading) {
        return (_jsxs("div", { children: [_jsx("div", { className: "mb-3 truncate text-base font-semibold", title: titleText, children: titleText }), _jsx("div", { className: "mb-4 h-9 rounded-md bg-muted animate-pulse" }), _jsx("div", { className: "mb-2 text-sm font-semibold", children: "People with access" }), _jsx("div", { className: "mb-4 h-7 rounded-md bg-muted animate-pulse" }), _jsx("div", { className: "mb-2 text-sm font-semibold", children: "General access" }), _jsx("div", { className: "mb-4 h-9 rounded-md bg-muted animate-pulse" }), _jsx("div", { className: "mt-2 flex justify-end", children: _jsx("button", { type: "button", onClick: onClose, className: BUTTON_PRIMARY_SM, children: "Done" }) })] }));
    }
    return (_jsxs("div", { children: [_jsx("div", { className: "mb-3 truncate text-base font-semibold", title: titleText, children: titleText }), canManage ? (_jsxs("div", { className: "mb-4 space-y-2", children: [_jsxs("div", { className: "flex items-stretch gap-2", children: [_jsx("input", { type: "email", placeholder: policy.requireOrgMemberForUserShares
                                    ? "Add people from your organization"
                                    : "Add people by email", value: email, onChange: (e) => {
                                    setEmail(e.target.value);
                                    if (shareError)
                                        setShareError(null);
                                }, onKeyDown: (e) => {
                                    if (e.key === "Enter")
                                        handleAdd();
                                }, list: orgMembers.length > 0 ? datalistId : undefined, autoComplete: "off", className: "flex-1 min-w-0 h-9 rounded-md border border-input bg-background px-3 text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2 focus:ring-offset-background" }), orgMembers.length > 0 ? (_jsx("datalist", { id: datalistId, children: orgMembers
                                    .filter((m) => m.email !== sharesQuery.data?.ownerEmail &&
                                    !(sharesQuery.data?.shares ?? []).some((s) => s.principalType === "user" &&
                                        s.principalId === m.email))
                                    .map((m) => (_jsx("option", { value: m.email, label: m.name ?? undefined }, m.email))) })) : null, _jsx(RoleSelect, { value: role, onChange: setRole })] }), shareError ? (_jsx("div", { role: "alert", className: "rounded-md border border-destructive/40 bg-destructive/10 px-3 py-2 text-xs text-destructive", children: shareError })) : null, hasInviteEmail ? (_jsxs("label", { className: "inline-flex items-center gap-2 text-xs text-muted-foreground", children: [_jsx("input", { type: "checkbox", checked: notifyPeople, onChange: (e) => setNotifyPeople(e.target.checked), className: "h-4 w-4 rounded border-input accent-primary" }), "Notify people"] })) : null] })) : null, _jsx("div", { className: "mb-2 text-sm font-semibold", children: "People with access" }), _jsxs("ul", { className: "mb-4 flex flex-col gap-1 list-none p-0 m-0", children: [data?.ownerEmail ? (_jsxs("li", { className: "flex items-center gap-3 px-1 py-1.5 text-sm", children: [_jsx(Avatar, { label: displayName(data.ownerEmail, orgMembers) }), _jsx("span", { className: "flex-1 min-w-0 truncate", children: displayName(data.ownerEmail, orgMembers) }), _jsx("span", { className: "text-xs text-muted-foreground", children: "Owner" })] })) : null, shares.map((s) => (_jsxs("li", { className: cn("flex items-center gap-3 px-1 py-1.5 text-sm", inFlight.has(keyOf(s)) && "opacity-60"), children: [_jsx(Avatar, { label: s.principalType === "org"
                                    ? s.principalId
                                    : displayName(s.principalId, orgMembers), org: s.principalType === "org" }), _jsx("span", { className: "flex-1 min-w-0 truncate", children: s.principalType === "org"
                                    ? s.principalId
                                    : displayName(s.principalId, orgMembers) }), canManage ? (_jsx(RoleSelect, { value: s.role, onChange: (r) => handleChangeRole(s, r), disabled: inFlight.has(keyOf(s)), plain: true })) : (_jsx("span", { className: "text-xs text-muted-foreground", children: cap(s.role) })), canManage ? (_jsx("button", { type: "button", "aria-label": "Remove", onClick: () => handleRemove(s), disabled: inFlight.has(keyOf(s)), className: BUTTON_GHOST_ICON, children: _jsx(IconTrash, { size: 14 }) })) : null] }, keyOf(s)))), !shares.length && !data?.ownerEmail ? (_jsx("li", { className: "px-1 py-1.5 text-sm text-muted-foreground", children: "No one has access yet." })) : null] }), _jsx("div", { className: "mb-2 text-sm font-semibold", children: "General access" }), _jsxs("div", { className: "mb-4 flex items-center gap-3", children: [_jsx("span", { "aria-hidden": true, className: "inline-flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-muted text-muted-foreground", children: _jsx(meta.Icon, { size: 16, strokeWidth: 1.75 }) }), _jsxs("div", { className: "min-w-0 flex-1", children: [_jsx(VisibilitySelect, { value: visibility, onChange: handleVisibility, disabled: !canManage, visibilityCopy: props.visibilityCopy, allowPublic: policy.allowPublic }), _jsx("div", { className: "mt-0.5 text-xs text-muted-foreground", children: meta.description })] })] }), props.accessNote ? (_jsx("div", { className: "mb-4 rounded-md border border-border bg-muted/35 p-3 text-xs text-muted-foreground", children: props.accessNote })) : null, props.shareUrl ? (_jsx(CopyLinkField, { value: props.shareUrl, label: props.shareUrlLabel, description: props.shareUrlDescription })) : props.shareUrlPlaceholder ? (_jsxs("div", { className: "mb-4 rounded-md border border-dashed border-border bg-muted/20 px-3 py-2.5 text-xs text-muted-foreground", children: [props.shareUrlLabel ? (_jsx("div", { className: "mb-0.5 font-medium text-foreground", children: props.shareUrlLabel })) : null, props.shareUrlPlaceholder] })) : null, props.secondaryShareUrl ? (_jsx(CopyLinkField, { value: props.secondaryShareUrl, label: props.secondaryShareUrlLabel, description: props.secondaryShareUrlDescription })) : null, _jsx("div", { className: "mt-2 flex justify-end", children: _jsx("button", { type: "button", onClick: handleDone, className: BUTTON_PRIMARY_SM, children: "Done" }) })] }));
}
function CopyLinkField({ value, label = "Share link", description, }) {
    const [copied, setCopied] = useState(false);
    const resetRef = useRef(undefined);
    useEffect(() => {
        return () => {
            if (resetRef.current)
                clearTimeout(resetRef.current);
        };
    }, []);
    const handleCopy = async () => {
        try {
            await navigator.clipboard.writeText(value);
            setCopied(true);
            if (resetRef.current)
                clearTimeout(resetRef.current);
            resetRef.current = setTimeout(() => setCopied(false), 1400);
        }
        catch {
            setCopied(false);
        }
    };
    return (_jsxs("div", { className: "mb-4", children: [_jsx("div", { className: "mb-2 text-sm font-semibold", children: label }), description ? (_jsx("div", { className: "mb-2 text-xs text-muted-foreground", children: description })) : null, _jsxs("div", { className: "flex min-w-0 items-center gap-2", children: [_jsx("input", { readOnly: true, value: value, className: "h-9 min-w-0 flex-1 rounded-md border border-input bg-background px-3 text-sm text-muted-foreground outline-none", onFocus: (event) => event.currentTarget.select() }), _jsxs("button", { type: "button", onClick: handleCopy, className: "inline-flex h-9 shrink-0 items-center gap-2 rounded-md border border-input bg-background px-3 text-sm font-medium text-foreground hover:bg-accent", children: [copied ? _jsx(IconCheck, { size: 15 }) : _jsx(IconCopy, { size: 15 }), copied ? "Copied" : "Copy"] })] })] }));
}
// ---------------------------------------------------------------------------
// Radix Select wrappers styled like shadcn Select (no native <select> anywhere)
// ---------------------------------------------------------------------------
const selectContentClass = "z-[2100] min-w-[12rem] overflow-hidden rounded-md border border-border bg-popover p-1 text-popover-foreground shadow-md data-[state=open]:animate-in data-[state=closed]:animate-out data-[state=closed]:fade-out-0 data-[state=open]:fade-in-0";
const selectItemClass = "relative flex w-full cursor-pointer select-none items-start gap-2 rounded-sm py-2 pl-8 pr-3 text-sm outline-none focus:bg-accent focus:text-accent-foreground data-[disabled]:pointer-events-none data-[disabled]:opacity-50";
function SelectItems({ items }) {
    return (_jsx(_Fragment, { children: items.map((it) => (_jsxs(Select.Item, { value: it.value, className: selectItemClass, children: [_jsx("span", { className: "absolute left-2 top-2 flex h-4 w-4 items-center justify-center", children: _jsx(Select.ItemIndicator, { children: _jsx(IconCheck, { size: 14 }) }) }), _jsxs("span", { className: "flex flex-col", children: [_jsx(Select.ItemText, { children: it.label }), it.description ? (_jsx("span", { className: "text-xs text-muted-foreground", children: it.description })) : null] })] }, it.value))) }));
}
function RoleSelect(props) {
    const current = ROLE_OPTIONS.find((o) => o.value === props.value) ?? ROLE_OPTIONS[0];
    return (_jsxs(Select.Root, { value: props.value, onValueChange: (v) => props.onChange(v), disabled: props.disabled, children: [_jsxs(Select.Trigger, { className: props.plain
                    ? cn(BUTTON_BASE, "h-7 px-2 bg-transparent text-muted-foreground hover:bg-accent hover:text-accent-foreground")
                    : cn(BUTTON_BASE, "h-9 px-3 border border-input bg-background hover:bg-accent hover:text-accent-foreground"), "aria-label": "Role", children: [_jsx(Select.Value, { children: current.label }), _jsx(Select.Icon, { children: _jsx(IconChevronDown, { size: 14 }) })] }), _jsx(Select.Portal, { children: _jsx(Select.Content, { className: selectContentClass, position: "popper", sideOffset: 4, children: _jsx(Select.Viewport, { children: _jsx(SelectItems, { items: ROLE_OPTIONS }) }) }) })] }));
}
function VisibilitySelect(props) {
    const allowPublic = props.allowPublic !== false;
    const current = visibilityMeta(props.value, props.visibilityCopy);
    const options = Object.keys(VIS_META).filter((k) => allowPublic || k !== "public");
    return (_jsxs(Select.Root, { value: props.value, onValueChange: (v) => props.onChange(v), disabled: props.disabled, children: [_jsxs(Select.Trigger, { className: cn(BUTTON_BASE, "h-7 px-1 -ml-1 bg-transparent text-foreground hover:bg-accent hover:text-accent-foreground"), "aria-label": "General access", children: [_jsx(Select.Value, { children: current.label }), _jsx(Select.Icon, { children: _jsx(IconChevronDown, { size: 14 }) })] }), _jsx(Select.Portal, { children: _jsx(Select.Content, { className: selectContentClass, position: "popper", sideOffset: 4, children: _jsx(Select.Viewport, { children: _jsx(SelectItems, { items: options.map((k) => ({
                                value: k,
                                label: visibilityMeta(k, props.visibilityCopy).label,
                                description: visibilityMeta(k, props.visibilityCopy)
                                    .description,
                            })) }) }) }) })] }));
}
function Avatar({ label, org }) {
    return (_jsx("span", { "aria-hidden": true, className: "inline-flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-muted text-[11px] font-semibold text-muted-foreground", children: org ? _jsx(IconBuilding, { size: 14, strokeWidth: 1.75 }) : initials(label) }));
}
function keyOf(s) {
    return `${s.principalType}:${s.principalId}`;
}
/**
 * Pull a user-readable error message out of a failed action call. Action
 * routes surface server-side errors as a JSON `{ error: string }` body that
 * the `useActionMutation` wrapper re-throws as
 * `Error("Action <name> failed: <message>")`. Strip the framework prefix so
 * what reaches the user is the underlying server message.
 */
function extractShareErrorMessage(err) {
    const fallback = "Could not update sharing — please try again.";
    const pickRaw = () => {
        if (!err)
            return null;
        if (err instanceof Error)
            return err.message?.trim() || null;
        if (typeof err === "string")
            return err.trim() || null;
        if (typeof err === "object") {
            const any = err;
            if (typeof any.error === "string" && any.error.trim())
                return any.error;
            if (typeof any.message === "string" && any.message.trim())
                return any.message;
        }
        return null;
    };
    const raw = pickRaw();
    if (!raw || raw.toLowerCase() === "failed to fetch")
        return fallback;
    const stripped = raw.replace(/^Action\s+[\w-]+\s+failed:\s*/i, "");
    return stripped || fallback;
}
function getNotificationUrl(explicit) {
    if (explicit)
        return explicit;
    if (typeof window === "undefined")
        return undefined;
    return window.location.href;
}
function cap(s) {
    return s.charAt(0).toUpperCase() + s.slice(1);
}
function initials(s) {
    const name = s.split("@")[0] ?? s;
    return (name[0] ?? "?").toUpperCase();
}
function displayName(email, members) {
    const match = members.find((m) => m.email === email);
    if (match?.name && match.name.trim())
        return match.name;
    return email;
}
//# sourceMappingURL=ShareButton.js.map