export interface AcceptPendingResult {
    accepted: Array<{
        invitationId: string;
        orgId: string;
    }>;
    activeOrgId: string | null;
}
/**
 * Accept every pending `org_invitations` row for this email:
 *   - insert a matching `org_members` row (role 'member') when one doesn't exist
 *   - flip the invitation's status to 'accepted'
 *   - set the user's `active-org-id` to the most-recently-created invite
 *
 * Called from the Better Auth `user.create.after` hook so that a user who signs
 * up with an email they were just invited to lands in the org immediately,
 * rather than seeing a blank-slate app until they navigate to /team.
 *
 * Safe to call when the org tables don't exist (some templates don't use the
 * org module) — it swallows the "no such table" error and returns empty.
 */
export declare function acceptPendingInvitationsForEmail(rawEmail: string): Promise<AcceptPendingResult>;
//# sourceMappingURL=accept-pending.d.ts.map