import { jsx as _jsx, jsxs as _jsxs, Fragment as _Fragment } from "react/jsx-runtime";
import { useEffect, useState } from "react";
import { createPortal } from "react-dom";
import { IconX, IconTrash, IconLock, IconBuilding, IconWorld, IconCheck, IconCopy, IconLink, IconMail, IconCode, IconChevronDown, } from "@tabler/icons-react";
import * as Select from "@radix-ui/react-select";
import { useActionQuery, useActionMutation } from "../use-action.js";
import { cn } from "../utils.js";
import { agentNativePath } from "../api-path.js";
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
function displayName(email, members) {
    const match = members.find((m) => m.email === email);
    if (match?.name && match.name.trim())
        return match.name;
    return email;
}
const BUTTON_BASE = "inline-flex items-center justify-center gap-2 whitespace-nowrap rounded-md text-sm font-medium transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 focus-visible:ring-offset-background disabled:pointer-events-none disabled:opacity-50 [&_svg]:pointer-events-none [&_svg]:shrink-0";
const BUTTON_OUTLINE_SM = cn(BUTTON_BASE, "h-9 px-3 border border-input bg-background hover:bg-accent hover:text-accent-foreground");
const BUTTON_PRIMARY_SM = cn(BUTTON_BASE, "h-9 px-4 bg-primary text-primary-foreground hover:bg-primary/90");
const BUTTON_GHOST_ICON = cn(BUTTON_BASE, "h-8 w-8 p-0 text-muted-foreground hover:bg-accent hover:text-accent-foreground");
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
        description: "Anyone signed in with the link can view",
        Icon: IconWorld,
    },
};
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
 * Framework share dialog. Drop into any template via
 * `<ShareDialog open onClose resourceType resourceId />`. Passing
 * `shareUrl` lights up a Link tab with a copy field; passing `embedUrl`
 * lights up an Embed tab. With neither prop, renders a single Invite +
 * general-access panel (Google-Docs-lite).
 */
export function ShareDialog(props) {
    const { open, onClose, resourceType, resourceId, resourceTitle, shareUrl, embedUrl, embedTabContent, linkTabExtras, } = props;
    const sharesQuery = useActionQuery("list-resource-shares", {
        resourceType,
        resourceId,
    });
    const orgMembers = useOrgMembers();
    const hasLinkTab = Boolean(shareUrl);
    const hasEmbedTab = Boolean(embedUrl);
    const tabsEnabled = hasLinkTab || hasEmbedTab;
    const [tab, setTab] = useState(hasLinkTab ? "link" : "invite");
    useEffect(() => {
        if (!open)
            return;
        setTab(hasLinkTab ? "link" : "invite");
    }, [open, hasLinkTab]);
    useEffect(() => {
        if (!open)
            return;
        const onKey = (e) => {
            if (e.key === "Escape")
                onClose();
        };
        window.addEventListener("keydown", onKey);
        return () => window.removeEventListener("keydown", onKey);
    }, [open, onClose]);
    if (!open)
        return null;
    const titleText = resourceTitle
        ? `Share "${resourceTitle}"`
        : `Share ${resourceType}`;
    return createPortal(_jsx("div", { className: "fixed inset-0 z-[2000] flex items-start justify-center bg-black/40 p-4 sm:items-center", onClick: onClose, children: _jsxs("div", { role: "dialog", "aria-modal": "true", "aria-label": titleText, className: "w-full max-w-lg rounded-xl border border-border bg-popover text-popover-foreground shadow-2xl outline-none", onClick: (e) => e.stopPropagation(), children: [_jsxs("div", { className: "flex items-start justify-between gap-3 px-5 pt-4 pb-3", children: [_jsxs("div", { className: "min-w-0 flex-1", children: [_jsx("div", { className: "truncate text-base font-semibold", title: titleText, children: titleText }), sharesQuery.data?.ownerEmail ? (_jsxs("div", { className: "mt-0.5 truncate text-xs text-muted-foreground", children: ["Owner: ", displayName(sharesQuery.data.ownerEmail, orgMembers)] })) : null] }), _jsx("button", { type: "button", "aria-label": "Close", onClick: onClose, className: BUTTON_GHOST_ICON, children: _jsx(IconX, { size: 16 }) })] }), tabsEnabled ? (_jsxs("div", { role: "tablist", "aria-label": "Share options", className: "mx-5 mt-1 flex gap-1 border-b border-border", children: [hasLinkTab ? (_jsx(TabTrigger, { active: tab === "link", onClick: () => setTab("link"), icon: _jsx(IconLink, { size: 14, strokeWidth: 1.75 }), label: "Link" })) : null, _jsx(TabTrigger, { active: tab === "invite", onClick: () => setTab("invite"), icon: _jsx(IconMail, { size: 14, strokeWidth: 1.75 }), label: "Invite" }), hasEmbedTab ? (_jsx(TabTrigger, { active: tab === "embed", onClick: () => setTab("embed"), icon: _jsx(IconCode, { size: 14, strokeWidth: 1.75 }), label: "Embed" })) : null] })) : null, _jsxs("div", { className: "px-5 py-4", children: [tabsEnabled && tab === "link" && hasLinkTab ? (_jsx(LinkTab, { resourceType: resourceType, resourceId: resourceId, shareUrl: shareUrl, sharesQuery: sharesQuery, extras: linkTabExtras })) : null, !tabsEnabled || tab === "invite" ? (_jsx(InviteTab, { resourceType: resourceType, resourceId: resourceId, shareUrl: shareUrl, sharesQuery: sharesQuery, showVisibility: !tabsEnabled, orgMembers: orgMembers })) : null, tabsEnabled && tab === "embed" && hasEmbedTab
                            ? (embedTabContent ?? _jsx(DefaultEmbedBody, { embedUrl: embedUrl }))
                            : null] }), _jsx("div", { className: "flex justify-end border-t border-border px-5 py-3", children: _jsx("button", { type: "button", onClick: onClose, className: BUTTON_PRIMARY_SM, children: "Done" }) })] }) }), document.body);
}
// ---------------------------------------------------------------------------
// Tabs
// ---------------------------------------------------------------------------
function TabTrigger(props) {
    return (_jsxs("button", { type: "button", role: "tab", "aria-selected": props.active, onClick: props.onClick, className: cn("inline-flex items-center gap-1.5 border-b-2 px-3 py-2 text-sm font-medium transition-colors", props.active
            ? "border-foreground text-foreground"
            : "border-transparent text-muted-foreground hover:text-foreground"), children: [props.icon, props.label] }));
}
// ---------------------------------------------------------------------------
// Link tab — visibility picker + copy-link field + optional extras
// ---------------------------------------------------------------------------
function LinkTab(props) {
    const { resourceType, resourceId, shareUrl, sharesQuery, extras } = props;
    const setVisibility = useActionMutation("set-resource-visibility");
    const data = sharesQuery.data;
    const visibility = data?.visibility ?? "private";
    const canManage = data?.role === "owner" || data?.role === "admin";
    const meta = VIS_META[visibility];
    const handleVisibility = (next) => {
        if (next === visibility)
            return;
        setVisibility.mutate({ resourceType, resourceId, visibility: next }, { onSuccess: () => sharesQuery.refetch() });
    };
    return (_jsxs("div", { className: "space-y-4", children: [_jsxs("div", { children: [_jsx("div", { className: "mb-2 text-sm font-semibold", children: "General access" }), _jsxs("div", { className: "flex items-center gap-3", children: [_jsx("span", { "aria-hidden": true, className: "inline-flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-muted text-muted-foreground", children: _jsx(meta.Icon, { size: 16, strokeWidth: 1.75 }) }), _jsxs("div", { className: "min-w-0 flex-1", children: [_jsx(VisibilitySelect, { value: visibility, onChange: handleVisibility, disabled: !canManage }), _jsx("div", { className: "mt-0.5 text-xs text-muted-foreground", children: meta.description })] })] })] }), _jsx(CopyField, { label: "Share link", value: shareUrl }), extras] }));
}
// ---------------------------------------------------------------------------
// Invite tab — invite-by-email + shares list + (optional) visibility
// ---------------------------------------------------------------------------
function InviteTab(props) {
    const { resourceType, resourceId, shareUrl, sharesQuery, showVisibility, orgMembers, } = props;
    const share = useActionMutation("share-resource");
    const unshare = useActionMutation("unshare-resource");
    const setVisibility = useActionMutation("set-resource-visibility");
    const [email, setEmail] = useState("");
    const [role, setRole] = useState("viewer");
    const [notifyPeople, setNotifyPeople] = useState(true);
    const hasInviteEmail = email.trim().length > 0;
    const data = sharesQuery.data;
    const shares = data?.shares ?? [];
    const visibility = data?.visibility ?? "private";
    const canManage = data?.role === "owner" || data?.role === "admin";
    const meta = VIS_META[visibility];
    const handleAdd = () => {
        const trimmed = email.trim();
        if (!trimmed)
            return;
        share.mutate({
            resourceType,
            resourceId,
            principalType: "user",
            principalId: trimmed,
            role,
            notify: notifyPeople,
            resourceUrl: getNotificationUrl(shareUrl),
        }, {
            onSuccess: () => {
                setEmail("");
                sharesQuery.refetch();
            },
        });
    };
    const handleRemove = (s) => {
        unshare.mutate({
            resourceType,
            resourceId,
            principalType: s.principalType,
            principalId: s.principalId,
        }, { onSuccess: () => sharesQuery.refetch() });
    };
    const handleVisibility = (next) => {
        if (next === visibility)
            return;
        setVisibility.mutate({ resourceType, resourceId, visibility: next }, { onSuccess: () => sharesQuery.refetch() });
    };
    return (_jsxs("div", { className: "space-y-4", children: [canManage ? (_jsxs("div", { className: "space-y-2", children: [_jsxs("div", { className: "flex items-stretch gap-2", children: [_jsx("input", { type: "email", placeholder: "Add people by email", value: email, onChange: (e) => setEmail(e.target.value), onKeyDown: (e) => {
                                    if (e.key === "Enter")
                                        handleAdd();
                                }, autoComplete: "off", className: "flex-1 min-w-0 h-9 rounded-md border border-input bg-background px-3 text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2 focus:ring-offset-background" }), _jsx(RoleSelect, { value: role, onChange: setRole })] }), hasInviteEmail ? (_jsxs("label", { className: "inline-flex items-center gap-2 text-xs text-muted-foreground", children: [_jsx("input", { type: "checkbox", checked: notifyPeople, onChange: (e) => setNotifyPeople(e.target.checked), className: "h-4 w-4 rounded border-input accent-primary" }), "Notify people"] })) : null] })) : null, _jsxs("div", { children: [_jsx("div", { className: "mb-2 text-sm font-semibold", children: "People with access" }), _jsxs("ul", { className: "flex flex-col gap-1 list-none p-0 m-0", children: [data?.ownerEmail ? (_jsxs("li", { className: "flex items-center gap-3 px-1 py-1.5 text-sm", children: [_jsx(Avatar, { label: displayName(data.ownerEmail, orgMembers) }), _jsx("span", { className: "flex-1 min-w-0 truncate", children: displayName(data.ownerEmail, orgMembers) }), _jsx("span", { className: "text-xs text-muted-foreground", children: "Owner" })] })) : null, shares.map((s) => (_jsxs("li", { className: "flex items-center gap-3 px-1 py-1.5 text-sm", children: [_jsx(Avatar, { label: s.principalType === "org"
                                            ? s.principalId
                                            : displayName(s.principalId, orgMembers), org: s.principalType === "org" }), _jsx("span", { className: "flex-1 min-w-0 truncate", children: s.principalType === "org"
                                            ? s.principalId
                                            : displayName(s.principalId, orgMembers) }), _jsx("span", { className: "text-xs text-muted-foreground", children: cap(s.role) }), canManage ? (_jsx("button", { type: "button", "aria-label": "Remove", onClick: () => handleRemove(s), className: BUTTON_GHOST_ICON, children: _jsx(IconTrash, { size: 14 }) })) : null] }, `${s.principalType}:${s.principalId}`))), !shares.length && !data?.ownerEmail ? (_jsx("li", { className: "px-1 py-1.5 text-sm text-muted-foreground", children: "No one has access yet." })) : null] })] }), showVisibility ? (_jsxs("div", { children: [_jsx("div", { className: "mb-2 text-sm font-semibold", children: "General access" }), _jsxs("div", { className: "flex items-center gap-3", children: [_jsx("span", { "aria-hidden": true, className: "inline-flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-muted text-muted-foreground", children: _jsx(meta.Icon, { size: 16, strokeWidth: 1.75 }) }), _jsxs("div", { className: "min-w-0 flex-1", children: [_jsx(VisibilitySelect, { value: visibility, onChange: handleVisibility, disabled: !canManage }), _jsx("div", { className: "mt-0.5 text-xs text-muted-foreground", children: meta.description })] })] })] })) : null] }));
}
// ---------------------------------------------------------------------------
// Default Embed body (simple responsive iframe snippet)
// ---------------------------------------------------------------------------
function DefaultEmbedBody({ embedUrl }) {
    const code = `<div style="position:relative;padding-bottom:56.25%;height:0"><iframe src="${embedUrl}" frameborder="0" allowfullscreen allow="autoplay; picture-in-picture" style="position:absolute;inset:0;width:100%;height:100%"></iframe></div>`;
    return (_jsxs("div", { className: "space-y-3", children: [_jsx(CopyField, { label: "Embed URL", value: embedUrl }), _jsx(CopyField, { label: "Embed code", value: code, multiline: true })] }));
}
// ---------------------------------------------------------------------------
// Primitives
// ---------------------------------------------------------------------------
function CopyField({ label, value, multiline, }) {
    const [copied, setCopied] = useState(false);
    const copy = () => {
        navigator.clipboard.writeText(value).catch(() => { });
        setCopied(true);
        setTimeout(() => setCopied(false), 1400);
    };
    return (_jsxs("div", { children: [_jsx("div", { className: "mb-1 text-xs font-medium text-muted-foreground", children: label }), _jsxs("div", { className: "flex items-stretch gap-2", children: [multiline ? (_jsx("textarea", { readOnly: true, value: value, className: "flex-1 h-20 rounded-md border border-input bg-background px-3 py-2 text-xs font-mono text-foreground resize-none focus:outline-none focus:ring-2 focus:ring-ring" })) : (_jsx("input", { readOnly: true, value: value, className: "flex-1 min-w-0 h-9 rounded-md border border-input bg-background px-3 text-xs font-mono text-foreground focus:outline-none focus:ring-2 focus:ring-ring" })), _jsx("button", { type: "button", onClick: copy, "aria-label": "Copy", className: cn(BUTTON_OUTLINE_SM, "w-9 px-0"), children: copied ? _jsx(IconCheck, { size: 14 }) : _jsx(IconCopy, { size: 14 }) })] })] }));
}
const selectContentClass = "z-[2100] min-w-[12rem] overflow-hidden rounded-md border border-border bg-popover p-1 text-popover-foreground shadow-md";
const selectItemClass = "relative flex w-full cursor-pointer select-none items-start gap-2 rounded-sm py-2 pl-8 pr-3 text-sm outline-none focus:bg-accent focus:text-accent-foreground data-[disabled]:pointer-events-none data-[disabled]:opacity-50";
function SelectItems({ items, }) {
    return (_jsx(_Fragment, { children: items.map((it) => (_jsxs(Select.Item, { value: it.value, className: selectItemClass, children: [_jsx("span", { className: "absolute left-2 top-2 flex h-4 w-4 items-center justify-center", children: _jsx(Select.ItemIndicator, { children: _jsx(IconCheck, { size: 14 }) }) }), _jsxs("span", { className: "flex flex-col", children: [_jsx(Select.ItemText, { children: it.label }), it.description ? (_jsx("span", { className: "text-xs text-muted-foreground", children: it.description })) : null] })] }, it.value))) }));
}
function RoleSelect(props) {
    const current = ROLE_OPTIONS.find((o) => o.value === props.value) ?? ROLE_OPTIONS[0];
    return (_jsxs(Select.Root, { value: props.value, onValueChange: (v) => props.onChange(v), children: [_jsxs(Select.Trigger, { "aria-label": "Role", className: cn(BUTTON_BASE, "h-9 px-3 border border-input bg-background hover:bg-accent hover:text-accent-foreground"), children: [_jsx(Select.Value, { children: current.label }), _jsx(Select.Icon, { children: _jsx(IconChevronDown, { size: 14 }) })] }), _jsx(Select.Portal, { children: _jsx(Select.Content, { className: selectContentClass, position: "popper", sideOffset: 4, children: _jsx(Select.Viewport, { children: _jsx(SelectItems, { items: ROLE_OPTIONS }) }) }) })] }));
}
function VisibilitySelect(props) {
    const current = VIS_META[props.value];
    return (_jsxs(Select.Root, { value: props.value, onValueChange: (v) => props.onChange(v), disabled: props.disabled, children: [_jsxs(Select.Trigger, { "aria-label": "General access", className: cn(BUTTON_BASE, "h-7 px-1 -ml-1 bg-transparent text-foreground hover:bg-accent hover:text-accent-foreground"), children: [_jsx(Select.Value, { children: current.label }), _jsx(Select.Icon, { children: _jsx(IconChevronDown, { size: 14 }) })] }), _jsx(Select.Portal, { children: _jsx(Select.Content, { className: selectContentClass, position: "popper", sideOffset: 4, children: _jsx(Select.Viewport, { children: _jsx(SelectItems, { items: Object.keys(VIS_META).map((k) => ({
                                value: k,
                                label: VIS_META[k].label,
                                description: VIS_META[k].description,
                            })) }) }) }) })] }));
}
function Avatar({ label, org }) {
    return (_jsx("span", { "aria-hidden": true, className: "inline-flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-muted text-[11px] font-semibold text-muted-foreground", children: org ? (_jsx(IconBuilding, { size: 14, strokeWidth: 1.75 })) : ((label.split("@")[0]?.[0] ?? label[0] ?? "?").toUpperCase()) }));
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
//# sourceMappingURL=ShareDialog.js.map