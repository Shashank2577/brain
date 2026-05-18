export declare const SHARED_DISPATCH_OWNER = "dispatch@shared";
/**
 * 429-style error returned when /link attempts are rate-limited. The
 * adapter layer can branch on `code === "LINK_RATE_LIMITED"` to send a
 * platform-appropriate message back to the user.
 */
export declare class LinkRateLimitError extends Error {
    readonly retryAfterMs: number;
    readonly code = "LINK_RATE_LIMITED";
    constructor(retryAfterMs: number);
}
export interface DispatchApprovalPolicy {
    enabled: boolean;
    approverEmails: string[];
}
export interface DispatchDestinationInput {
    id?: string;
    name: string;
    platform: string;
    destination: string;
    threadRef?: string | null;
    notes?: string | null;
}
export declare function currentOwnerEmail(): string;
export declare function currentOrgId(): string | null;
/**
 * Caller-supplied access context for dispatch operations that work by
 * id (destinations, etc.). Looking up a row by id alone is unsafe —
 * UUIDs are not authorization. A row matches the ctx if either the
 * caller owns it or it lives in the caller's active org.
 */
export interface DispatchCtx {
    ownerEmail: string;
    orgId: string | null;
}
export declare function requireDispatchCtx(): DispatchCtx;
export declare function getApprovalPolicy(): Promise<DispatchApprovalPolicy>;
export declare function setApprovalPolicy(input: DispatchApprovalPolicy): Promise<DispatchApprovalPolicy | {
    id: string;
    ownerEmail: string;
    orgId: string;
    changeType: string;
    targetType: string;
    targetId: string;
    status: string;
    summary: string;
    payload: string;
    beforeValue: string;
    afterValue: string;
    requestedBy: string;
    reviewedBy: string;
    reviewedAt: number;
    createdAt: number;
    updatedAt: number;
}>;
export declare function recordAudit(input: {
    action: string;
    targetType: string;
    targetId?: string | null;
    summary: string;
    metadata?: unknown;
    actor?: string;
    ownerEmail?: string;
    orgId?: string | null;
}): Promise<void>;
export declare function listAuditEvents(limit?: number): Promise<{
    id: string;
    ownerEmail: string;
    orgId: string;
    actor: string;
    action: string;
    targetType: string;
    targetId: string;
    summary: string;
    metadata: string;
    createdAt: number;
}[]>;
export declare function listDestinations(): Promise<{
    id: string;
    ownerEmail: string;
    orgId: string;
    name: string;
    platform: string;
    destination: string;
    threadRef: string;
    notes: string;
    createdBy: string;
    createdAt: number;
    updatedAt: number;
}[]>;
export declare function getDestinationById(destinationId: string, ctx?: DispatchCtx): Promise<{
    id: string;
    ownerEmail: string;
    orgId: string;
    name: string;
    platform: string;
    destination: string;
    threadRef: string;
    notes: string;
    createdBy: string;
    createdAt: number;
    updatedAt: number;
}>;
export declare function upsertDestination(input: DispatchDestinationInput): Promise<{
    id: string;
    ownerEmail: string;
    orgId: string;
    changeType: string;
    targetType: string;
    targetId: string;
    status: string;
    summary: string;
    payload: string;
    beforeValue: string;
    afterValue: string;
    requestedBy: string;
    reviewedBy: string;
    reviewedAt: number;
    createdAt: number;
    updatedAt: number;
} | {
    id: string;
    ownerEmail: string;
    orgId: string;
    name: string;
    platform: string;
    destination: string;
    threadRef: string;
    notes: string;
    createdBy: string;
    createdAt: number;
    updatedAt: number;
}>;
export declare function deleteDestination(destinationId: string): Promise<{
    id: string;
    ownerEmail: string;
    orgId: string;
    changeType: string;
    targetType: string;
    targetId: string;
    status: string;
    summary: string;
    payload: string;
    beforeValue: string;
    afterValue: string;
    requestedBy: string;
    reviewedBy: string;
    reviewedAt: number;
    createdAt: number;
    updatedAt: number;
} | {
    id: string;
    ownerEmail: string;
    orgId: string;
    name: string;
    platform: string;
    destination: string;
    threadRef: string;
    notes: string;
    createdBy: string;
    createdAt: number;
    updatedAt: number;
}>;
export declare function listApprovalRequests(): Promise<{
    id: string;
    ownerEmail: string;
    orgId: string;
    changeType: string;
    targetType: string;
    targetId: string;
    status: string;
    summary: string;
    payload: string;
    beforeValue: string;
    afterValue: string;
    requestedBy: string;
    reviewedBy: string;
    reviewedAt: number;
    createdAt: number;
    updatedAt: number;
}[]>;
export declare function approveRequest(requestId: string): Promise<{
    id: string;
    ownerEmail: string;
    orgId: string;
    changeType: string;
    targetType: string;
    targetId: string;
    status: string;
    summary: string;
    payload: string;
    beforeValue: string;
    afterValue: string;
    requestedBy: string;
    reviewedBy: string;
    reviewedAt: number;
    createdAt: number;
    updatedAt: number;
}>;
export declare function rejectRequest(requestId: string, reason?: string | null): Promise<{
    id: string;
    ownerEmail: string;
    orgId: string;
    changeType: string;
    targetType: string;
    targetId: string;
    status: string;
    summary: string;
    payload: string;
    beforeValue: string;
    afterValue: string;
    requestedBy: string;
    reviewedBy: string;
    reviewedAt: number;
    createdAt: number;
    updatedAt: number;
}>;
export declare function createLinkToken(platform: string): Promise<{
    token: string;
    command: string;
    platform: string;
    expiresAt: number;
}>;
export declare function listIdentityState(): Promise<{
    links: {
        id: string;
        ownerEmail: string;
        orgId: string;
        platform: string;
        externalUserId: string;
        externalUserName: string;
        linkedBy: string;
        createdAt: number;
        updatedAt: number;
    }[];
    tokens: {
        id: string;
        token: string;
        ownerEmail: string;
        orgId: string;
        platform: string;
        createdBy: string;
        expiresAt: number;
        claimedAt: number;
        claimedByExternalUserId: string;
        claimedByExternalUserName: string;
        createdAt: number;
        updatedAt: number;
    }[];
}>;
export declare function resolveLinkedOwner(platform: string, externalUserId?: string | null, options?: {
    orgId?: string | null;
    allowAnyOrgFallback?: boolean;
}): Promise<string>;
export declare function consumeLinkToken(input: {
    platform: string;
    token: string;
    externalUserId?: string | null;
    externalUserName?: string | null;
}): Promise<string>;
export declare function listOverview(): Promise<{
    counts: {
        destinations: number;
        pendingApprovals: number;
        linkedIdentities: number;
        activeTokens: number;
    };
    recentDestinations: {
        id: string;
        ownerEmail: string;
        orgId: string;
        name: string;
        platform: string;
        destination: string;
        threadRef: string;
        notes: string;
        createdBy: string;
        createdAt: number;
        updatedAt: number;
    }[];
    recentApprovals: {
        id: string;
        ownerEmail: string;
        orgId: string;
        changeType: string;
        targetType: string;
        targetId: string;
        status: string;
        summary: string;
        payload: string;
        beforeValue: string;
        afterValue: string;
        requestedBy: string;
        reviewedBy: string;
        reviewedAt: number;
        createdAt: number;
        updatedAt: number;
    }[];
    recentAudit: {
        id: string;
        ownerEmail: string;
        orgId: string;
        actor: string;
        action: string;
        targetType: string;
        targetId: string;
        summary: string;
        metadata: string;
        createdAt: number;
    }[];
    settings: DispatchApprovalPolicy;
}>;
//# sourceMappingURL=dispatch-store.d.ts.map