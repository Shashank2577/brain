import type { OrgInfo, OrgMember, OrgPendingInvitation } from "../../org/types.js";
export declare function useOrg(): import("@tanstack/react-query").UseQueryResult<OrgInfo, Error>;
export declare function useOrgMembers(): import("@tanstack/react-query").UseQueryResult<{
    members: OrgMember[];
}, Error>;
export declare function useOrgInvitations(): import("@tanstack/react-query").UseQueryResult<{
    invitations: OrgPendingInvitation[];
}, Error>;
export declare function useCreateOrg(): import("@tanstack/react-query").UseMutationResult<any, Error, string, unknown>;
export type InviteRole = "admin" | "member";
export interface InviteVars {
    email: string;
    role?: InviteRole;
}
export declare function useInviteMember(): import("@tanstack/react-query").UseMutationResult<any, Error, string | InviteVars, unknown>;
export interface BulkInviteResult {
    succeeded: Array<{
        id: string;
        email: string;
        role: InviteRole;
        status: "pending";
        emailSent: boolean;
        emailError?: string;
    }>;
    failed: Array<{
        email: string;
        error: string;
    }>;
    total: number;
}
export declare function useBulkInviteMembers(): import("@tanstack/react-query").UseMutationResult<BulkInviteResult, Error, InviteVars[], unknown>;
export declare function useChangeMemberRole(): import("@tanstack/react-query").UseMutationResult<{
    email: string;
    role: InviteRole;
}, Error, {
    email: string;
    role: InviteRole;
}, unknown>;
export declare function useAcceptInvitation(): import("@tanstack/react-query").UseMutationResult<any, Error, string, unknown>;
export declare function useRemoveMember(): import("@tanstack/react-query").UseMutationResult<any, Error, string, unknown>;
export declare function useUpdateOrg(): import("@tanstack/react-query").UseMutationResult<any, Error, string, unknown>;
export declare function useSwitchOrg(): import("@tanstack/react-query").UseMutationResult<any, Error, string, unknown>;
export declare function useJoinByDomain(): import("@tanstack/react-query").UseMutationResult<any, Error, string, unknown>;
export declare function useSetOrgDomain(): import("@tanstack/react-query").UseMutationResult<any, Error, string, unknown>;
export declare function useSetA2ASecret(): import("@tanstack/react-query").UseMutationResult<{
    a2aSecret: string;
    previousSecret: string | null;
}, Error, string, unknown>;
export interface SyncA2ASecretResult {
    total: number;
    succeeded: number;
    failed: number;
    results: Array<{
        id: string;
        name: string;
        url: string;
        ok: boolean;
        status?: number;
        error?: string;
    }>;
}
/**
 * Push the org's A2A secret to every connected app so cross-app delegation
 * works without manual copy/paste. Optionally pass a `signSecret` to sign
 * the outbound JWTs with a different secret (used by the regenerate-then-
 * sync flow where the new secret is in DB but peers still hold the old
 * one).
 */
export declare function useSyncA2ASecret(): import("@tanstack/react-query").UseMutationResult<SyncA2ASecretResult, Error, void | {
    signSecret?: string;
}, unknown>;
//# sourceMappingURL=hooks.d.ts.map