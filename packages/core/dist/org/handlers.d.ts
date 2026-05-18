import type { OrgRole } from "./types.js";
/** GET /_agent-native/org/me — current user's active org, all orgs, pending invitations */
export declare const getMyOrgHandler: import("h3").EventHandlerWithFetch<import("h3").EventHandlerRequest, Promise<{
    email: string;
    orgId: string;
    orgName: string;
    role: OrgRole;
    orgs: {
        orgId: string;
        role: OrgRole;
        orgName: string;
    }[];
    pendingInvitations: {
        id: string;
        orgId: string;
        orgName: string;
        invitedBy: string;
    }[];
    domainMatches: {
        orgId: string;
        orgName: string;
    }[];
    allowedDomain: string;
    a2aSecret: string;
}>>;
/** POST /_agent-native/org — create a new organization */
export declare const createOrgHandler: import("h3").EventHandlerWithFetch<import("h3").EventHandlerRequest, Promise<{
    id: string;
    name: string;
    role: OrgRole;
}>>;
/** GET /_agent-native/org/members — list org members */
export declare const listMembersHandler: import("h3").EventHandlerWithFetch<import("h3").EventHandlerRequest, Promise<{
    members: {
        email: string;
        role: OrgRole;
        joinedAt: number;
    }[];
}>>;
interface SingleInviteResult {
    id: string;
    email: string;
    role: "member" | "admin";
    status: "pending";
    emailSent: boolean;
    emailError?: string;
}
interface SingleInviteFailure {
    email: string;
    error: string;
}
/** POST /_agent-native/org/invitations — invite one or many users by email */
export declare const createInvitationHandler: import("h3").EventHandlerWithFetch<import("h3").EventHandlerRequest, Promise<SingleInviteResult | {
    succeeded: SingleInviteResult[];
    failed: SingleInviteFailure[];
    total: number;
}>>;
/** GET /_agent-native/org/invitations — list pending invitations for the org */
export declare const listInvitationsHandler: import("h3").EventHandlerWithFetch<import("h3").EventHandlerRequest, Promise<{
    invitations: {
        id: string;
        email: string;
        invitedBy: string;
        createdAt: number;
        status: string;
        role: string;
    }[];
}>>;
/** POST /_agent-native/org/invitations/:id/accept — accept an invitation */
export declare const acceptInvitationHandler: import("h3").EventHandlerWithFetch<import("h3").EventHandlerRequest, Promise<{
    orgId: string;
    orgName: string;
    role: OrgRole;
}>>;
/** DELETE /_agent-native/org/members/:email — remove a member (owner/admin only) */
export declare const removeMemberHandler: import("h3").EventHandlerWithFetch<import("h3").EventHandlerRequest, Promise<{
    success: boolean;
}>>;
/**
 * PUT /_agent-native/org/members/:email/role — change a member's role
 * (owner/admin only). Body: { role: "admin" | "member" }.
 *
 * Only owners can promote/demote admins. (Admins can manage members but
 * not other admins — otherwise an admin could escalate themselves to
 * owner-equivalent control by promoting a confederate.)
 */
export declare const changeMemberRoleHandler: import("h3").EventHandlerWithFetch<import("h3").EventHandlerRequest, Promise<{
    email: string;
    role: string;
}>>;
/** PATCH /_agent-native/org — rename the current organization (owner/admin only) */
export declare const updateOrgHandler: import("h3").EventHandlerWithFetch<import("h3").EventHandlerRequest, Promise<{
    orgId: string;
    name: any;
}>>;
/** PUT /_agent-native/org/switch — switch the user's active organization */
export declare const switchOrgHandler: import("h3").EventHandlerWithFetch<import("h3").EventHandlerRequest, Promise<{
    orgId: any;
    orgName: string;
    role: OrgRole;
}>>;
/** POST /_agent-native/org/join-by-domain — join an org whose allowed_domain matches your email */
export declare const joinByDomainHandler: import("h3").EventHandlerWithFetch<import("h3").EventHandlerRequest, Promise<{
    orgId: any;
    orgName: string;
    role: OrgRole;
}>>;
/** PUT /_agent-native/org/domain — set or clear the allowed email domain (owner/admin only) */
export declare const setDomainHandler: import("h3").EventHandlerWithFetch<import("h3").EventHandlerRequest, Promise<{
    domain: any;
}>>;
/** PUT /_agent-native/org/a2a-secret — regenerate or set the org's A2A secret (owner/admin only) */
export declare const setA2ASecretHandler: import("h3").EventHandlerWithFetch<import("h3").EventHandlerRequest, Promise<{
    a2aSecret: any;
    previousSecret: string;
}>>;
/**
 * POST /_agent-native/org/a2a-secret/sync — push the org's A2A secret to all
 * connected apps so cross-app delegation works without manual copy/paste.
 *
 * Auth: standard session — owner/admin only.
 *
 * For each discovered agent, signs a JWT with the org's CURRENT a2a_secret
 * and POSTs to `<app>/_agent-native/org/a2a-secret/receive` with the same
 * secret + the org's domain. The receiving app verifies the JWT using its
 * own copy of the secret (peers must already share a secret to be trusted)
 * — for the first-ever sync this means at least one peer must already hold
 * the secret, which is the bootstrap. For ongoing rotation, regenerate
 * locally and call sync immediately; sync signs with the secret that's
 * currently in DB, which the peers still have.
 *
 * Body (optional): { signSecret?: string } — sign the outbound JWTs with
 * this secret instead of the org's current secret. Used by the regenerate-
 * then-sync flow: regenerate stores the NEW secret, but sync needs to
 * authenticate using the OLD one that peers still hold. Owner/admin only,
 * gated by the session.
 */
export declare const syncA2ASecretHandler: import("h3").EventHandlerWithFetch<import("h3").EventHandlerRequest, Promise<{
    total: number;
    succeeded: number;
    failed: number;
    results: {
        id: string;
        name: string;
        url: string;
        ok: boolean;
        status?: number;
        error?: string;
    }[];
}>>;
/**
 * POST /_agent-native/org/a2a-secret/receive — accept a secret push from a
 * connected agent-native app. Auth-exempt at the route guard; we verify a
 * JWT signed by the calling app using OUR copy of the org's a2a_secret. If
 * verification succeeds the calling app is a trusted peer and we overwrite
 * our local org's secret with the supplied value.
 *
 * Body: { secret: string, orgDomain: string }
 *
 * Header: Authorization: Bearer <JWT signed with the existing shared
 * a2a_secret, with `org_domain` matching the body's orgDomain>.
 */
export declare const receiveA2ASecretHandler: import("h3").EventHandlerWithFetch<import("h3").EventHandlerRequest, Promise<{
    ok: boolean;
    orgId: string;
}>>;
export {};
//# sourceMappingURL=handlers.d.ts.map