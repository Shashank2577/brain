export declare function currentUserEmail(): string;
export declare function currentUserEmailOrNull(): string | null;
export declare function currentOrgId(): string | undefined;
export declare function assertTeamAdmin(teamId: string): Promise<void>;
/**
 * Verify the current user is a member of the team (any role). Read-only
 * team resource listings should gate on this so that team IDs cannot be
 * enumerated by guessing. Throws "Not authenticated" if there is no
 * current user, and "Forbidden" if the user is not a member.
 */
export declare function assertTeamMember(teamId: string): Promise<void>;
//# sourceMappingURL=_helpers.d.ts.map