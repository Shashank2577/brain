import { jsx as _jsx, jsxs as _jsxs, Fragment as _Fragment } from "react/jsx-runtime";
import { useState } from "react";
import { useNavigate } from "react-router";
import * as PopoverPrimitive from "@radix-ui/react-popover";
import { IconApps, IconArrowUpRight, IconBuilding, IconCheck, IconChevronRight, IconLoader2, IconLogout, IconMessageCircle, IconPlus, IconSelector, IconSettings, IconUser, IconUserPlus, } from "@tabler/icons-react";
import { useOrg, useSwitchOrg, useCreateOrg, useInviteMember, useAcceptInvitation, useJoinByDomain, } from "./hooks.js";
import { agentNativePath } from "../api-path.js";
import { ORG_SWITCHER_MAX_APP_LINKS, useOrgSwitcherAppLinks, visibleOrgAppLinks, } from "./workspace-app-links.js";
function personalLabelFromEmail(email) {
    if (!email)
        return "Personal";
    const local = email.split("@")[0] ?? email;
    const cleaned = local.replace(/[._-]+/g, " ").trim();
    if (!cleaned)
        return "Personal";
    return cleaned
        .split(" ")
        .filter(Boolean)
        .map((w) => w.charAt(0).toUpperCase() + w.slice(1))
        .join(" ");
}
const POPOVER_CONTENT_CLASS = "z-50 min-w-[14rem] rounded-md border border-border bg-popover py-1 text-popover-foreground shadow-md outline-none data-[state=open]:animate-in data-[state=closed]:animate-out data-[state=closed]:fade-out-0 data-[state=open]:fade-in-0 data-[state=closed]:zoom-out-95 data-[state=open]:zoom-in-95 data-[side=bottom]:slide-in-from-top-2 data-[side=left]:slide-in-from-right-2 data-[side=right]:slide-in-from-left-2 data-[side=top]:slide-in-from-bottom-2";
const ITEM_CLASS = "flex w-full items-center gap-2 px-2.5 py-1.5 text-xs text-foreground hover:bg-accent focus-visible:bg-accent focus:outline-none disabled:opacity-50 disabled:pointer-events-none";
const SECTION_LABEL_CLASS = "px-2.5 pt-1 pb-0.5 text-[10px] uppercase tracking-wide text-muted-foreground";
const APP_SUBMENU_CONTENT_CLASS = "z-50 w-72 rounded-md border border-border bg-popover p-1 text-popover-foreground shadow-md outline-none data-[state=open]:animate-in data-[state=closed]:animate-out data-[state=closed]:fade-out-0 data-[state=open]:fade-in-0 data-[state=closed]:zoom-out-95 data-[state=open]:zoom-in-95 data-[side=bottom]:slide-in-from-top-2 data-[side=left]:slide-in-from-right-2 data-[side=right]:slide-in-from-left-2 data-[side=top]:slide-in-from-bottom-2";
const DEFAULT_ORGANIZATION_SETTINGS_PATH = "/team";
function organizationSettingsPath(path) {
    return `${path.replace(/#.*$/, "")}#workspace-settings`;
}
function AppMenuLink({ app, onNavigate, }) {
    const Icon = app.isDispatch ? IconMessageCircle : IconApps;
    return (_jsxs("a", { href: app.href, onClick: onNavigate, className: `flex items-center gap-2 rounded-sm px-2.5 py-2 text-xs outline-none hover:bg-accent focus:bg-accent ${app.isDispatch ? "border border-primary/20 bg-primary/5" : ""}`, children: [_jsx("span", { className: `flex h-7 w-7 shrink-0 items-center justify-center rounded-md ${app.isDispatch
                    ? "bg-primary text-primary-foreground"
                    : "bg-muted text-muted-foreground"}`, children: _jsx(Icon, { className: "h-3.5 w-3.5" }) }), _jsxs("span", { className: "min-w-0 flex-1", children: [_jsx("span", { className: "block truncate font-medium text-foreground", children: app.name }), _jsx("span", { className: "block truncate text-[11px] text-muted-foreground", children: app.isDispatch
                            ? "Main hub"
                            : app.status === "pending"
                                ? "Building"
                                : "Open app" })] }), _jsx(IconArrowUpRight, { className: "h-3.5 w-3.5 shrink-0 text-muted-foreground" })] }));
}
function AppsSubmenu({ apps, isWorkspace, isLoading, dispatchHref, dispatchAllAppsHref, onNavigate, }) {
    const { links, overflowCount } = visibleOrgAppLinks(apps);
    const visibleDispatchApp = links.find((app) => app.isDispatch);
    const dispatchApp = visibleDispatchApp ??
        {
            id: "dispatch",
            name: "Dispatch",
            href: dispatchHref,
            isDispatch: true,
            status: "ready",
        };
    const visibleNonDispatch = links
        .filter((app) => !app.isDispatch)
        .slice(0, visibleDispatchApp ? undefined : ORG_SWITCHER_MAX_APP_LINKS - 1);
    const shownCount = (dispatchApp ? 1 : 0) + visibleNonDispatch.length;
    const remainingCount = Math.max(overflowCount, apps.length - shownCount);
    return (_jsxs(PopoverPrimitive.Root, { children: [_jsx(PopoverPrimitive.Trigger, { asChild: true, children: _jsxs("button", { type: "button", className: `${ITEM_CLASS} cursor-pointer`, children: [_jsx(IconApps, { className: "h-3.5 w-3.5 shrink-0 text-muted-foreground" }), _jsx("span", { className: "flex-1 text-left", children: "Apps" }), _jsx("span", { className: "text-[11px] text-muted-foreground", children: isLoading ? (_jsx(IconLoader2, { className: "h-3 w-3 animate-spin" })) : (apps.length) }), _jsx(IconChevronRight, { className: "h-3.5 w-3.5 shrink-0 text-muted-foreground" })] }) }), _jsx(PopoverPrimitive.Portal, { children: _jsxs(PopoverPrimitive.Content, { side: "right", align: "start", sideOffset: 8, collisionPadding: 12, className: APP_SUBMENU_CONTENT_CLASS, children: [_jsxs("div", { className: "px-2.5 py-1.5", children: [_jsx("div", { className: "text-[10px] uppercase tracking-wide text-muted-foreground", children: isWorkspace ? "Workspace apps" : "Default apps" }), _jsx("div", { className: "mt-0.5 text-[11px] text-muted-foreground", children: isWorkspace
                                        ? "Dispatch is the workspace hub."
                                        : "Dispatch is the home base." })] }), _jsx(AppMenuLink, { app: dispatchApp, onNavigate: onNavigate }), visibleNonDispatch.length > 0 && (_jsx("div", { className: "my-1 h-px bg-border" })), visibleNonDispatch.map((app) => (_jsx(AppMenuLink, { app: app, onNavigate: onNavigate }, app.id))), remainingCount > 0 && (_jsxs(_Fragment, { children: [_jsx("div", { className: "my-1 h-px bg-border" }), _jsxs("a", { href: dispatchAllAppsHref, onClick: onNavigate, className: "flex items-center gap-2 rounded-sm px-2.5 py-1.5 text-xs text-foreground outline-none hover:bg-accent focus:bg-accent", children: [_jsx(IconMessageCircle, { className: "h-3.5 w-3.5 shrink-0 text-muted-foreground" }), _jsx("span", { className: "flex-1", children: `View ${remainingCount} more in Dispatch` }), _jsx(IconArrowUpRight, { className: "h-3.5 w-3.5 shrink-0 text-muted-foreground" })] })] }))] }) })] }));
}
/**
 * Compact org switcher button. Shows the active org (or "Personal" when the
 * user has none); opens a popover with the user's other orgs, pending
 * invitations, inline forms to create a new org / invite a teammate, and a
 * sign-out item. Renders nothing in dev / no-auth mode.
 */
export function OrgSwitcher({ className, hideWhenSingle, reserveSpace, settingsPath = DEFAULT_ORGANIZATION_SETTINGS_PATH, }) {
    const { data: org, isLoading } = useOrg();
    const switchOrg = useSwitchOrg();
    const createOrg = useCreateOrg();
    const inviteMember = useInviteMember();
    const acceptInvitation = useAcceptInvitation();
    const joinByDomain = useJoinByDomain();
    const navigate = useNavigate();
    const [open, setOpen] = useState(false);
    const [mode, setMode] = useState("list");
    const [newName, setNewName] = useState("");
    const [inviteEmail, setInviteEmail] = useState("");
    const [signingOut, setSigningOut] = useState(false);
    const [joiningOrgId, setJoiningOrgId] = useState(null);
    const appLinks = useOrgSwitcherAppLinks(open);
    const handleOpenChange = (next) => {
        setOpen(next);
        if (!next) {
            setMode("list");
            setNewName("");
            setInviteEmail("");
        }
    };
    const handleSignOut = async () => {
        if (signingOut)
            return;
        setSigningOut(true);
        try {
            await fetch(agentNativePath("/_agent-native/auth/logout"), {
                method: "POST",
                credentials: "include",
            });
        }
        catch {
            /* fall through to reload — server may already have cleared the cookie */
        }
        window.location.reload();
    };
    if (!org) {
        return reserveSpace && isLoading ? (_jsx("div", { "aria-hidden": "true", className: `h-8 ${className ?? ""}` })) : null;
    }
    const orgs = org.orgs ?? [];
    const pendingInvitations = org.pendingInvitations ?? [];
    const domainMatches = org.domainMatches ?? [];
    const orgCount = orgs.length;
    const hasAny = orgCount > 0 || pendingInvitations.length > 0 || domainMatches.length > 0;
    if (!hasAny && !org.email) {
        return reserveSpace ? (_jsx("div", { "aria-hidden": "true", className: `h-8 ${className ?? ""}` })) : null;
    }
    if (hideWhenSingle &&
        orgCount < 2 &&
        pendingInvitations.length === 0 &&
        domainMatches.length === 0) {
        return reserveSpace ? (_jsx("div", { "aria-hidden": "true", className: `h-8 ${className ?? ""}` })) : null;
    }
    const canInvite = !!org.orgId && (org.role === "owner" || org.role === "admin");
    const personalLabel = personalLabelFromEmail(org.email);
    const inOrg = !!org.orgId;
    const buttonLabel = org.orgName ?? "Personal";
    const ButtonIcon = inOrg ? IconBuilding : IconUser;
    const organizationSettingsHref = settingsPath
        ? organizationSettingsPath(settingsPath)
        : null;
    return (_jsxs(PopoverPrimitive.Root, { open: open, onOpenChange: handleOpenChange, children: [_jsx(PopoverPrimitive.Trigger, { asChild: true, children: _jsxs("button", { type: "button", className: `flex w-full items-center gap-2 rounded-md border border-border/50 px-2.5 py-1.5 text-xs font-medium text-muted-foreground hover:bg-accent/50 hover:text-foreground focus:outline-none focus-visible:ring-2 focus-visible:ring-ring cursor-pointer ${className ?? ""}`, children: [_jsx(ButtonIcon, { className: "h-3.5 w-3.5 shrink-0" }), _jsx("span", { className: "truncate flex-1 text-left", children: buttonLabel }), _jsx(IconSelector, { className: "h-3 w-3 shrink-0 opacity-50" })] }) }), _jsx(PopoverPrimitive.Portal, { children: _jsxs(PopoverPrimitive.Content, { side: "top", align: "start", sideOffset: 6, collisionPadding: 12, className: POPOVER_CONTENT_CLASS, onOpenAutoFocus: (e) => {
                        // Don't auto-focus the first item — feels heavy on a switcher.
                        if (mode === "list")
                            e.preventDefault();
                    }, children: [mode === "list" && (_jsxs(_Fragment, { children: [!inOrg && (_jsxs("div", { className: "flex w-full items-center gap-2 px-2.5 py-1.5 text-xs text-muted-foreground", "aria-disabled": "true", children: [_jsx(IconUser, { className: "h-3.5 w-3.5 shrink-0" }), _jsxs("span", { className: "truncate flex-1 text-left", children: ["Personal (", personalLabel, ")"] })] })), orgs.length > 0 && (_jsx("div", { className: SECTION_LABEL_CLASS, children: "Organizations" })), orgs.map((o) => (_jsxs("button", { type: "button", onClick: async () => {
                                        if (o.orgId === org.orgId) {
                                            setOpen(false);
                                            return;
                                        }
                                        try {
                                            await switchOrg.mutateAsync(o.orgId);
                                            setOpen(false);
                                        }
                                        catch {
                                            /* error surfaced via switchOrg.error */
                                        }
                                    }, disabled: switchOrg.isPending, className: `${ITEM_CLASS} cursor-pointer`, children: [_jsx(IconBuilding, { className: "h-3.5 w-3.5 shrink-0 text-muted-foreground" }), _jsx("span", { className: "truncate flex-1 text-left", children: o.orgName }), o.orgId === org.orgId && (_jsx(IconCheck, { className: "h-3.5 w-3.5 shrink-0 text-muted-foreground" }))] }, o.orgId))), pendingInvitations.length > 0 && (_jsxs(_Fragment, { children: [orgs.length > 0 && _jsx("div", { className: "my-1 h-px bg-border" }), _jsx("div", { className: SECTION_LABEL_CLASS, children: "Invitations" }), pendingInvitations.map((inv) => (_jsxs("div", { className: "flex items-center gap-2 px-2.5 py-1.5 text-xs", children: [_jsx(IconBuilding, { className: "h-3.5 w-3.5 shrink-0 text-muted-foreground" }), _jsx("span", { className: "truncate flex-1 text-foreground", children: inv.orgName }), _jsx("button", { type: "button", onClick: async () => {
                                                        try {
                                                            await acceptInvitation.mutateAsync(inv.id);
                                                            setOpen(false);
                                                        }
                                                        catch {
                                                            /* error surfaced via acceptInvitation.error */
                                                        }
                                                    }, disabled: acceptInvitation.isPending, className: "rounded px-1.5 py-0.5 text-[11px] font-medium text-primary hover:bg-primary/10 disabled:opacity-50 cursor-pointer", children: acceptInvitation.isPending ? (_jsx(IconLoader2, { className: "h-3 w-3 animate-spin" })) : ("Join") })] }, inv.id)))] })), domainMatches.length > 0 && (_jsxs(_Fragment, { children: [(orgs.length > 0 || pendingInvitations.length > 0) && (_jsx("div", { className: "my-1 h-px bg-border" })), _jsx("div", { className: SECTION_LABEL_CLASS, children: "Join your team" }), domainMatches.map((match) => {
                                            const isJoining = joinByDomain.isPending && joiningOrgId === match.orgId;
                                            return (_jsxs("div", { className: "flex items-center gap-2 px-2.5 py-1.5 text-xs", children: [_jsx(IconBuilding, { className: "h-3.5 w-3.5 shrink-0 text-muted-foreground" }), _jsx("span", { className: "truncate flex-1 text-foreground", children: match.orgName }), _jsx("button", { type: "button", onClick: async () => {
                                                            setJoiningOrgId(match.orgId);
                                                            try {
                                                                await joinByDomain.mutateAsync(match.orgId);
                                                                setOpen(false);
                                                            }
                                                            catch {
                                                                /* error surfaced via joinByDomain.error */
                                                            }
                                                            finally {
                                                                setJoiningOrgId(null);
                                                            }
                                                        }, disabled: joinByDomain.isPending, className: "rounded px-1.5 py-0.5 text-[11px] font-medium text-primary hover:bg-primary/10 disabled:opacity-50 cursor-pointer", children: isJoining ? (_jsx(IconLoader2, { className: "h-3 w-3 animate-spin" })) : ("Join") })] }, match.orgId));
                                        })] })), _jsx("div", { className: "my-1 h-px bg-border" }), _jsx(AppsSubmenu, { apps: appLinks.apps, isWorkspace: appLinks.isWorkspace, isLoading: appLinks.isLoading, dispatchHref: appLinks.dispatchHref, dispatchAllAppsHref: appLinks.dispatchAllAppsHref, onNavigate: () => setOpen(false) }), inOrg && (_jsxs("button", { type: "button", onClick: () => {
                                        setOpen(false);
                                        window.dispatchEvent(new CustomEvent("agent-panel:open"));
                                        window.dispatchEvent(new CustomEvent("agent-panel:open-settings", {
                                            detail: { section: "workspace-settings" },
                                        }));
                                        if (organizationSettingsHref) {
                                            navigate(organizationSettingsHref);
                                        }
                                    }, className: `${ITEM_CLASS} cursor-pointer`, children: [_jsx(IconSettings, { className: "h-3.5 w-3.5 shrink-0 text-muted-foreground" }), _jsx("span", { className: "flex-1 text-left", children: "Organization settings" })] })), _jsxs("button", { type: "button", onClick: () => {
                                        // Clear any leftover input from a prior session — otherwise
                                        // the create form re-opens prefilled with the just-created
                                        // org's name and looks like a create dialog for the new org.
                                        setNewName("");
                                        setMode("create");
                                    }, className: `${ITEM_CLASS} cursor-pointer`, children: [_jsx(IconPlus, { className: "h-3.5 w-3.5 shrink-0 text-muted-foreground" }), _jsx("span", { className: "flex-1 text-left", children: "Create organization" })] }), canInvite && (_jsxs("button", { type: "button", onClick: () => {
                                        setInviteEmail("");
                                        setMode("invite");
                                    }, className: `${ITEM_CLASS} cursor-pointer`, children: [_jsx(IconUserPlus, { className: "h-3.5 w-3.5 shrink-0 text-muted-foreground" }), _jsx("span", { className: "flex-1 text-left", children: "Invite member" })] })), _jsx("div", { className: "my-1 h-px bg-border" }), _jsxs("button", { type: "button", onClick: handleSignOut, disabled: signingOut, className: `${ITEM_CLASS} cursor-pointer`, children: [signingOut ? (_jsx(IconLoader2, { className: "h-3.5 w-3.5 shrink-0 animate-spin text-muted-foreground" })) : (_jsx(IconLogout, { className: "h-3.5 w-3.5 shrink-0 text-muted-foreground" })), _jsxs("span", { className: "flex-1 text-left", children: ["Sign out", org.email ? (_jsxs("span", { className: "ml-1 text-muted-foreground", children: ["(", org.email, ")"] })) : null] })] }), (switchOrg.error ||
                                    acceptInvitation.error ||
                                    joinByDomain.error) && (_jsx("div", { className: "px-2.5 pt-1 text-[11px] text-destructive", children: (switchOrg.error ||
                                        acceptInvitation.error ||
                                        joinByDomain.error).message }))] })), mode === "create" && (_jsxs("form", { onSubmit: async (e) => {
                                e.preventDefault();
                                const name = newName.trim();
                                if (!name)
                                    return;
                                try {
                                    await createOrg.mutateAsync(name);
                                    handleOpenChange(false);
                                }
                                catch {
                                    /* error surfaced via createOrg.error */
                                }
                            }, className: "px-2 py-1.5", children: [_jsx("div", { className: "px-0.5 pb-1 text-[10px] uppercase tracking-wide text-muted-foreground", children: "New organization" }), _jsx("input", { autoFocus: true, value: newName, onChange: (e) => setNewName(e.target.value), placeholder: "Organization name", disabled: createOrg.isPending, className: "w-full rounded-md border border-input bg-background px-2 py-1.5 text-xs outline-none focus:ring-2 focus:ring-ring disabled:opacity-50" }), createOrg.error && (_jsx("div", { className: "pt-1 text-[11px] text-destructive", children: createOrg.error.message })), _jsxs("div", { className: "flex items-center gap-1.5 pt-1.5", children: [_jsx("button", { type: "button", onClick: () => setMode("list"), disabled: createOrg.isPending, className: "flex-1 rounded-md px-2 py-1 text-xs text-muted-foreground hover:bg-accent disabled:opacity-50 cursor-pointer", children: "Cancel" }), _jsx("button", { type: "submit", disabled: createOrg.isPending || !newName.trim(), className: "flex flex-1 items-center justify-center rounded-md bg-primary px-2 py-1 text-xs font-medium text-primary-foreground hover:opacity-90 disabled:opacity-50 cursor-pointer", children: createOrg.isPending ? (_jsx(IconLoader2, { className: "h-3 w-3 animate-spin" })) : ("Create") })] })] })), mode === "invite" && (_jsxs("form", { onSubmit: async (e) => {
                                e.preventDefault();
                                const email = inviteEmail.trim();
                                if (!email)
                                    return;
                                try {
                                    await inviteMember.mutateAsync(email);
                                    setInviteEmail("");
                                    setMode("list");
                                }
                                catch {
                                    /* error surfaced via inviteMember.error */
                                }
                            }, className: "px-2 py-1.5", children: [_jsxs("div", { className: "px-0.5 pb-1 text-[10px] uppercase tracking-wide text-muted-foreground", children: ["Invite to ", org.orgName] }), _jsx("input", { autoFocus: true, type: "email", value: inviteEmail, onChange: (e) => setInviteEmail(e.target.value), placeholder: "teammate@company.com", disabled: inviteMember.isPending, className: "w-full rounded-md border border-input bg-background px-2 py-1.5 text-xs outline-none focus:ring-2 focus:ring-ring disabled:opacity-50" }), inviteMember.error && (_jsx("div", { className: "pt-1 text-[11px] text-destructive", children: inviteMember.error.message })), _jsxs("div", { className: "flex items-center gap-1.5 pt-1.5", children: [_jsx("button", { type: "button", onClick: () => setMode("list"), disabled: inviteMember.isPending, className: "flex-1 rounded-md px-2 py-1 text-xs text-muted-foreground hover:bg-accent disabled:opacity-50 cursor-pointer", children: "Cancel" }), _jsx("button", { type: "submit", disabled: inviteMember.isPending || !inviteEmail.trim(), className: "flex flex-1 items-center justify-center rounded-md bg-primary px-2 py-1 text-xs font-medium text-primary-foreground hover:opacity-90 disabled:opacity-50 cursor-pointer", children: inviteMember.isPending ? (_jsx(IconLoader2, { className: "h-3 w-3 animate-spin" })) : ("Send invite") })] })] }))] }) })] }));
}
//# sourceMappingURL=OrgSwitcher.js.map