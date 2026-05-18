export interface AutoJoinDomainResult {
    joined: Array<{
        orgId: string;
    }>;
    activeOrgId: string | null;
}
/**
 * Auto-join a newly-signed-up user into every org whose `allowed_domain`
 * matches their email domain.
 *
 * Called from the Better Auth `user.create.after` hook so that e.g. a new
 * `@builder.io` signup lands inside the existing Builder.io org on first
 * page load instead of starting in Personal and having to find the join
 * CTA. The org's owner opts into this by setting
 * `organizations.allowed_domain` — the column already gated the manual
 * "Join your team" UI in the picker; we use the same opt-in to drive
 * automatic join.
 *
 * Idempotent — skips orgs the user is already a member of and never
 * overwrites an existing `active-org-id` setting.
 *
 * Safe to call when the org tables don't exist (some templates don't use
 * the org module): it swallows the "no such table" error and returns
 * empty. Never throws — the caller is a signup hook and we don't want to
 * block a user from creating their account because of an org-tier issue.
 */
export declare function autoJoinDomainMatchingOrgs(rawEmail: string): Promise<AutoJoinDomainResult>;
//# sourceMappingURL=auto-join-domain.d.ts.map