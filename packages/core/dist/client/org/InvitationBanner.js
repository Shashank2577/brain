import { jsx as _jsx, jsxs as _jsxs } from "react/jsx-runtime";
import { useState } from "react";
import { IconLoader2 } from "@tabler/icons-react";
import { useOrg, useAcceptInvitation, useJoinByDomain } from "./hooks.js";
/**
 * Top-of-app banner that surfaces:
 *   - Pending org invitations (one-click Accept).
 *   - Domain-match orgs the user can auto-join because their email domain
 *     matches `organizations.allowed_domain` (one-click Join). Lets a new
 *     signup at e.g. `someone@builder.io` see and join the existing
 *     Builder.io org without going through the picker.
 *
 * Renders nothing when there's nothing to surface.
 */
export function InvitationBanner({ className }) {
    const { data: org } = useOrg();
    const acceptInvitation = useAcceptInvitation();
    const joinByDomain = useJoinByDomain();
    const [joiningOrgId, setJoiningOrgId] = useState(null);
    const [acceptingInvitationId, setAcceptingInvitationId] = useState(null);
    const pendingInvitations = org?.pendingInvitations ?? [];
    const domainMatches = org?.domainMatches ?? [];
    if (pendingInvitations.length === 0 && domainMatches.length === 0) {
        return null;
    }
    const error = acceptInvitation.error || joinByDomain.error;
    // While the join/accept request is in flight (and continuing until the
    // refreshed org data unmounts this banner), surface a prominent in-place
    // "Joining {orgName}…" state so the chat panel reflects the action instead
    // of looking unchanged until the view abruptly swaps.
    const joiningOrgName = (() => {
        if (joiningOrgId) {
            return (domainMatches.find((m) => m.orgId === joiningOrgId)?.orgName ?? null);
        }
        if (acceptingInvitationId) {
            return (pendingInvitations.find((i) => i.id === acceptingInvitationId)
                ?.orgName ?? null);
        }
        return null;
    })();
    if (joiningOrgName) {
        return (_jsx("div", { role: "status", "aria-live": "polite", className: `border-b border-border bg-blue-50 dark:bg-blue-950/30 px-3 py-3 sm:px-4 ${className ?? ""}`, children: _jsxs("div", { className: "flex items-center gap-3 text-sm text-foreground", children: [_jsx(IconLoader2, { className: "h-4 w-4 shrink-0 animate-spin text-blue-600 dark:text-blue-400" }), _jsxs("span", { className: "min-w-0 flex-1", children: ["Joining ", _jsx("span", { className: "font-medium", children: joiningOrgName }), "\u2026"] })] }) }));
    }
    return (_jsxs("div", { className: `border-b border-border bg-blue-50 dark:bg-blue-950/30 px-3 py-2.5 sm:px-4 ${className ?? ""}`, children: [_jsx("div", { className: "space-y-2 divide-y divide-blue-200/70 dark:divide-blue-800/50", children: pendingInvitations.map((inv, index) => (_jsxs("div", { className: `flex items-center justify-between gap-4 text-sm ${index > 0 ? "pt-2" : ""}`, children: [_jsxs("span", { className: "min-w-0 flex-1 text-foreground", children: [_jsx("span", { className: "font-medium", children: inv.invitedBy }), " invited you to join ", _jsx("span", { className: "font-medium", children: inv.orgName })] }), _jsx("button", { type: "button", onClick: () => {
                                setAcceptingInvitationId(inv.id);
                                acceptInvitation.mutate(inv.id, {
                                    onError: () => setAcceptingInvitationId(null),
                                });
                            }, disabled: acceptInvitation.isPending, className: "shrink-0 rounded-md bg-green-600 px-3 py-1.5 text-xs font-medium text-white hover:bg-green-700 disabled:opacity-50 cursor-pointer", children: acceptInvitation.isPending ? (_jsx(IconLoader2, { className: "h-3 w-3 animate-spin" })) : ("Join") })] }, inv.id))) }), domainMatches.map((match) => {
                const isJoining = joinByDomain.isPending && joiningOrgId === match.orgId;
                return (_jsxs("div", { className: `${pendingInvitations.length > 0 ? "mt-2 border-t border-blue-200/70 pt-2 dark:border-blue-800/50" : ""} flex items-center justify-between gap-4 text-sm`, children: [_jsxs("span", { className: "min-w-0 flex-1 text-foreground", children: ["Your team is already using this app. Join", " ", _jsx("span", { className: "font-medium", children: match.orgName }), " to collaborate."] }), _jsx("button", { type: "button", onClick: () => {
                                setJoiningOrgId(match.orgId);
                                joinByDomain.mutate(match.orgId, {
                                    onError: () => setJoiningOrgId(null),
                                });
                            }, disabled: joinByDomain.isPending, className: "shrink-0 rounded-md bg-green-600 px-3 py-1.5 text-xs font-medium text-white hover:bg-green-700 disabled:opacity-50 cursor-pointer", children: isJoining ? (_jsx(IconLoader2, { className: "h-3 w-3 animate-spin" })) : ("Join") })] }, match.orgId));
            }), error && (_jsx("div", { className: "mt-1 text-xs text-red-600", children: error.message }))] }));
}
//# sourceMappingURL=InvitationBanner.js.map