import { jsx as _jsx, Fragment as _Fragment, jsxs as _jsxs } from "react/jsx-runtime";
import { useState } from "react";
import { IconAlertTriangle, IconBuilding, IconLoader2, IconUserPlus, IconAt, } from "@tabler/icons-react";
import { useAcceptInvitation, useCreateOrg, useJoinByDomain, useOrg, } from "./hooks.js";
/**
 * Guards its children behind the user having an active organization.
 *
 * When the user has no active org, renders a blocking, centered pane in place
 * of `children` with:
 *   1. Any pending invitations (one-click accept), and
 *   2. A "Create your organization" form.
 *
 * As soon as an org is joined or created, `useOrg` refetches and `children`
 * renders normally.
 *
 * The pane fills whatever box this component is rendered into — it does **not**
 * position itself `fixed` over the viewport. Place it inside your app shell so
 * ambient UI (agent sidebar, global nav) stays accessible while the user
 * completes org setup.
 */
export function RequireActiveOrg({ children, title = "Create your organization", description = "This app organizes your content by team. Create an organization to continue — you can invite teammates afterward.", className, }) {
    const { data: org, isLoading, isError, error, refetch } = useOrg();
    if (isLoading)
        return null;
    // Network / server failure on the org lookup — do NOT fall through to the
    // create-org pane (that would lock out an existing member on a transient
    // 500). Render a retry state instead. Only treat a successful null orgId
    // response as "genuinely no org".
    if (isError) {
        return (_jsx(ErrorPane, { message: error?.message ?? "Couldn't load organization.", onRetry: () => void refetch(), className: className }));
    }
    if (org?.orgId)
        return _jsx(_Fragment, { children: children });
    return (_jsx(CreateOrgPane, { pendingInvitations: org?.pendingInvitations ?? [], domainMatches: org?.domainMatches ?? [], email: org?.email ?? "", title: title, description: description, className: className }));
}
function ErrorPane({ message, onRetry, className, }) {
    return (_jsx("div", { className: "flex h-full w-full items-center justify-center overflow-y-auto bg-background p-8 " +
            (className ?? ""), children: _jsxs("div", { className: "w-full max-w-md rounded-2xl border border-border bg-card p-8 shadow-lg", children: [_jsxs("div", { className: "mb-4 flex items-center gap-2", children: [_jsx(IconAlertTriangle, { className: "h-5 w-5 text-muted-foreground" }), _jsx("h1", { className: "text-lg font-semibold", children: "Couldn't load organization" })] }), _jsx("p", { className: "mb-5 text-sm text-muted-foreground", children: message }), _jsx("button", { type: "button", onClick: onRetry, className: "w-full rounded-md bg-primary px-4 py-2 text-sm font-medium text-primary-foreground hover:bg-primary/90", children: "Try again" })] }) }));
}
function CreateOrgPane({ pendingInvitations, domainMatches, email, title, description, className, }) {
    const createOrg = useCreateOrg();
    const acceptInvitation = useAcceptInvitation();
    const joinByDomain = useJoinByDomain();
    const [name, setName] = useState("");
    const hasInvites = pendingInvitations.length > 0;
    const hasDomainMatches = domainMatches.length > 0;
    const userDomain = email.split("@")[1] ?? "";
    const [showCreateForm, setShowCreateForm] = useState(!hasDomainMatches && !hasInvites);
    const busy = createOrg.isPending || acceptInvitation.isPending || joinByDomain.isPending;
    return (_jsx("div", { className: "flex h-full w-full items-center justify-center overflow-y-auto bg-background p-8 " +
            (className ?? ""), children: _jsxs("div", { className: "my-auto w-full max-w-md rounded-2xl border border-border bg-card p-8 shadow-lg", children: [_jsxs("div", { className: "mb-6 flex items-center gap-2", children: [_jsx(IconBuilding, { className: "h-5 w-5 text-muted-foreground" }), _jsx("h1", { className: "text-lg font-semibold", children: title })] }), _jsx("p", { className: "mb-6 text-sm text-muted-foreground", children: description }), hasDomainMatches && (_jsxs("div", { className: "mb-4", children: [_jsx("div", { className: "mb-2 text-[10px] uppercase tracking-wide text-muted-foreground", children: domainMatches.length === 1
                                ? "Your organization"
                                : "Join your team" }), _jsx("ul", { className: "space-y-2", children: domainMatches.map((match) => (_jsxs("li", { className: "flex items-center gap-3 rounded-lg border border-primary/50 bg-primary/5 px-4 py-3", children: [_jsx(IconAt, { className: "h-4 w-4 shrink-0 text-muted-foreground" }), _jsxs("div", { className: "min-w-0 flex-1", children: [_jsx("div", { className: "truncate text-sm font-medium", children: match.orgName }), _jsxs("div", { className: "truncate text-xs text-muted-foreground", children: ["Open to @", userDomain, " emails"] })] }), _jsx("button", { type: "button", disabled: busy, onClick: () => joinByDomain.mutate(match.orgId), className: "shrink-0 rounded-md bg-primary px-6 py-2.5 text-sm font-medium text-primary-foreground hover:bg-primary/90 disabled:opacity-50", children: joinByDomain.isPending ? (_jsx(IconLoader2, { className: "h-3 w-3 animate-spin" })) : (`Join ${match.orgName}`) })] }, match.orgId))) })] })), hasInvites && (_jsxs("div", { className: "mb-4", children: [_jsx("div", { className: "mb-2 text-[10px] uppercase tracking-wide text-muted-foreground", children: "Pending invitations" }), _jsx("ul", { className: "space-y-2", children: pendingInvitations.map((inv) => (_jsxs("li", { className: "flex items-center gap-3 rounded-lg border border-border bg-background px-3 py-2", children: [_jsx(IconUserPlus, { className: "h-4 w-4 shrink-0 text-muted-foreground" }), _jsxs("div", { className: "min-w-0 flex-1", children: [_jsx("div", { className: "truncate text-sm font-medium", children: inv.orgName }), _jsxs("div", { className: "truncate text-xs text-muted-foreground", children: ["from ", inv.invitedBy] })] }), _jsx("button", { type: "button", disabled: busy, onClick: () => acceptInvitation.mutate(inv.id), className: "shrink-0 rounded-md bg-primary px-3 py-1.5 text-xs font-medium text-primary-foreground hover:bg-primary/90 disabled:opacity-50", children: acceptInvitation.isPending ? (_jsx(IconLoader2, { className: "h-3 w-3 animate-spin" })) : ("Accept") })] }, inv.id))) })] })), (hasDomainMatches || hasInvites) && (_jsxs("button", { type: "button", onClick: () => setShowCreateForm((v) => !v), className: "mb-4 flex w-full cursor-pointer items-center gap-3", children: [_jsx("div", { className: "h-px flex-1 bg-border" }), _jsx("span", { className: "text-[10px] uppercase tracking-wide text-muted-foreground", children: "or create a separate organization" }), _jsx("div", { className: "h-px flex-1 bg-border" })] })), showCreateForm && (_jsxs("form", { onSubmit: async (e) => {
                        e.preventDefault();
                        const trimmed = name.trim();
                        if (!trimmed)
                            return;
                        try {
                            await createOrg.mutateAsync(trimmed);
                        }
                        catch {
                            /* surfaced below */
                        }
                    }, className: "space-y-3", children: [_jsxs("label", { className: "block", children: [_jsx("span", { className: "mb-1 block text-xs font-medium text-foreground", children: "Organization name" }), _jsx("input", { autoFocus: !hasDomainMatches && !hasInvites, value: name, onChange: (e) => setName(e.target.value), placeholder: "Acme Inc.", disabled: busy, className: "w-full rounded-md border border-input bg-background px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-ring disabled:opacity-50" })] }), createOrg.error && (_jsx("div", { className: "text-xs text-red-600", children: createOrg.error.message })), acceptInvitation.error && (_jsx("div", { className: "text-xs text-red-600", children: acceptInvitation.error.message })), joinByDomain.error && (_jsx("div", { className: "text-xs text-red-600", children: joinByDomain.error.message })), _jsx("button", { type: "submit", disabled: busy || !name.trim(), className: hasDomainMatches
                                ? "w-full rounded-md border border-input bg-background px-4 py-2 text-sm font-medium text-foreground hover:bg-accent disabled:opacity-50"
                                : "w-full rounded-md bg-primary px-4 py-2 text-sm font-medium text-primary-foreground hover:bg-primary/90 disabled:opacity-50", children: createOrg.isPending ? "Creating…" : "Create organization" })] }))] }) }));
}
//# sourceMappingURL=RequireActiveOrg.js.map