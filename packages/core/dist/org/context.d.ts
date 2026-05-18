import type { H3Event } from "h3";
import type { OrgContext, OrgRole } from "./types.js";
/**
 * Resolve the current user's organization context from their session.
 *
 * - For users in multiple orgs, honors their `active-org-id` user setting.
 * - Falls back to the user's first membership.
 * - When `AUTO_CREATE_DEFAULT_ORG` is set and the authenticated user has
 *   zero memberships, provisions a default org named after the user
 *   ({name}'s workspace, falling back to the email local-part). Opt-in
 *   per deployment so templates that don't use orgs don't accrue phantom
 *   default orgs in their DB. The <RequireActiveOrg> client guard remains
 *   the safety net for pre-existing accounts or provisioning failures.
 */
export declare function getOrgContext(event: H3Event): Promise<OrgContext>;
/**
 * Resolve the active org ID for a given email — for non-HTTP contexts like
 * the integration webhook handler where we have an email but no event/session.
 * Picks the user's active-org-id setting if set, otherwise the first membership.
 * Returns null if the user has no memberships.
 */
export declare function resolveOrgIdForEmail(email: string): Promise<string | null>;
/**
 * Create a new organization and add the caller as a member with the given
 * role. Generates a per-org A2A secret for cross-app delegation and writes
 * the caller's `active-org-id` user-setting so the new org is immediately
 * active.
 *
 */
export declare function createOrganization(name: string, email: string, role?: OrgRole): Promise<{
    id: string;
    name: string;
    role: OrgRole;
    a2aSecret: string;
    createdAt: number;
}>;
/**
 * Look up the `allowed_domain` for an org by its ID.
 * Used when making outbound A2A calls so the JWT includes the
 * caller's org domain for cross-app org resolution.
 */
export declare function getOrgDomain(orgId: string): Promise<string | null>;
/**
 * Look up the org's A2A secret by org ID.
 * Used when making outbound A2A calls so the JWT is signed with the
 * org-specific secret rather than the global A2A_SECRET env var.
 */
export declare function getOrgA2ASecret(orgId: string): Promise<string | null>;
/**
 * Look up an org's A2A secret by its `allowed_domain`.
 * Used on the A2A receiving side: the caller's JWT includes `org_domain`,
 * and the receiver looks up which local org matches that domain to find
 * the secret used to verify the JWT signature.
 */
export declare function getA2ASecretByDomain(domain: string): Promise<string | null>;
/**
 * Resolve a local org by its `allowed_domain`.
 * Used on the A2A receiving side: the caller sends `org_domain` in the JWT,
 * and the receiver looks up which local org matches that domain.
 */
export declare function resolveOrgByDomain(domain: string): Promise<{
    orgId: string;
    orgName: string;
} | null>;
//# sourceMappingURL=context.d.ts.map