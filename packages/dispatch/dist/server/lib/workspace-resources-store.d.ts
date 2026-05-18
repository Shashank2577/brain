import { type EffectiveResourceLayer, type ResourceInheritanceScope, type ResourceMeta } from "@agent-native/core/resources/store";
/**
 * Caller-supplied access context for workspace-resource operations.
 * Same shape and semantics as VaultCtx — looking up a row by id alone is
 * unsafe because UUIDs are not authorization. A row matches the ctx if
 * either the caller owns it or it lives in the caller's active org.
 */
export interface WorkspaceResourceCtx {
    ownerEmail: string;
    orgId: string | null;
}
export declare function requireWorkspaceResourceCtx(): WorkspaceResourceCtx;
export type WorkspaceResourceKind = "skill" | "instruction" | "agent" | "knowledge";
export type WorkspaceResourceScope = "all" | "selected";
export interface WorkspaceResourceInput {
    kind: WorkspaceResourceKind;
    name: string;
    description?: string | null;
    path: string;
    content: string;
    scope: WorkspaceResourceScope;
}
export interface WorkspaceResourceOption {
    id: string;
    kind: WorkspaceResourceKind;
    name: string;
    description: string | null;
    path: string;
    scope: WorkspaceResourceScope;
    updatedAt: number;
}
export interface WorkspaceResourceForApp extends WorkspaceResourceOption {
    source: "workspace" | "grant";
    autoLoaded: boolean;
    grantId: string | null;
}
export type WorkspaceResourceAvailability = "all-apps" | "selected-granted" | "selected-not-granted" | "selected-no-app" | "path-not-managed";
export interface WorkspaceResourceEffectiveLayer extends Omit<EffectiveResourceLayer, "scope"> {
    scope: ResourceInheritanceScope;
    resource: ResourceMeta | null;
}
export interface WorkspaceResourceEffectiveContext {
    appId: string | null;
    userEmail: string;
    path: string;
    workspaceResource: WorkspaceResourceOption | null;
    availability: WorkspaceResourceAvailability;
    availableToApp: boolean;
    activeGrantId: string | null;
    effectiveScope: ResourceInheritanceScope | null;
    effectiveResource: ResourceMeta | null;
    layers: WorkspaceResourceEffectiveLayer[];
}
export type WorkspaceResourceChangeOperation = "create" | "update" | "delete";
export interface WorkspaceResourceOverrideImpact {
    scope: "shared" | "personal";
    owner: string;
    label: string;
    updatedAt: number;
}
export interface WorkspaceResourceChangeImpact {
    operation: WorkspaceResourceChangeOperation;
    path: string | null;
    resourceId: string | null;
    beforeScope: WorkspaceResourceScope | null;
    afterScope: WorkspaceResourceScope | null;
    affectsAllApps: boolean;
    affectedApps: {
        label: string;
        count: number | null;
        apps: Array<{
            id: string;
            name: string;
        }>;
    };
    overrides: {
        count: number;
        sharedCount: number;
        personalCount: number;
        items: WorkspaceResourceOverrideImpact[];
    };
    approval: {
        policyEnabled: boolean;
        willRequestApproval: boolean;
    };
}
export declare const STARTER_GLOBAL_WORKSPACE_RESOURCES: WorkspaceResourceInput[];
export declare function ensureStarterWorkspaceResources(ctx?: WorkspaceResourceCtx): Promise<void>;
export declare function restoreStarterWorkspaceResources(input?: {
    paths?: string[];
}): Promise<{
    restored: WorkspaceResourceOption[];
    existing: WorkspaceResourceOption[];
    unknown: string[];
}>;
export declare function listWorkspaceResources(filter?: {
    kind?: string;
}): Promise<{
    id: string;
    ownerEmail: string;
    orgId: string;
    kind: string;
    name: string;
    description: string;
    path: string;
    content: string;
    scope: string;
    createdBy: string;
    createdAt: number;
    updatedAt: number;
}[]>;
export declare function listWorkspaceResourceOptions(filter?: {
    kind?: string;
}): Promise<WorkspaceResourceOption[]>;
export declare function listWorkspaceResourcesForApp(appId: string): Promise<{
    appId: string;
    resources: WorkspaceResourceForApp[];
    counts: {
        total: number;
        workspace: number;
        global: number;
        granted: number;
        autoLoaded: number;
    };
}>;
export declare function previewWorkspaceResourceChange(input: {
    operation?: WorkspaceResourceChangeOperation;
    resourceId?: string;
    path?: string;
    scope?: WorkspaceResourceScope;
}): Promise<WorkspaceResourceChangeImpact>;
export declare function getWorkspaceResourceEffectiveContext(input: {
    resourceId?: string;
    path?: string;
    appId?: string | null;
    userEmail?: string | null;
}): Promise<WorkspaceResourceEffectiveContext>;
export declare function getWorkspaceResource(resourceId: string, ctx?: WorkspaceResourceCtx): Promise<{
    id: string;
    ownerEmail: string;
    orgId: string;
    kind: string;
    name: string;
    description: string;
    path: string;
    content: string;
    scope: string;
    createdBy: string;
    createdAt: number;
    updatedAt: number;
}>;
export declare function applyWorkspaceResourceCreate(input: WorkspaceResourceInput, actor?: string, ctx?: WorkspaceResourceCtx): Promise<{
    id: string;
    ownerEmail: string;
    orgId: string;
    kind: string;
    name: string;
    description: string;
    path: string;
    content: string;
    scope: string;
    createdBy: string;
    createdAt: number;
    updatedAt: number;
}>;
export declare function createWorkspaceResource(input: WorkspaceResourceInput): Promise<{
    id: string;
    ownerEmail: string;
    orgId: string;
    kind: string;
    name: string;
    description: string;
    path: string;
    content: string;
    scope: string;
    createdBy: string;
    createdAt: number;
    updatedAt: number;
} | {
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
export declare function applyWorkspaceResourceUpdate(resourceId: string, input: Partial<Pick<WorkspaceResourceInput, "name" | "description" | "content" | "scope">>, actor?: string, ctx?: WorkspaceResourceCtx): Promise<{
    id: string;
    ownerEmail: string;
    orgId: string;
    kind: string;
    name: string;
    description: string;
    path: string;
    content: string;
    scope: string;
    createdBy: string;
    createdAt: number;
    updatedAt: number;
}>;
export declare function updateWorkspaceResource(resourceId: string, input: Partial<Pick<WorkspaceResourceInput, "name" | "description" | "content" | "scope">>): Promise<{
    id: string;
    ownerEmail: string;
    orgId: string;
    kind: string;
    name: string;
    description: string;
    path: string;
    content: string;
    scope: string;
    createdBy: string;
    createdAt: number;
    updatedAt: number;
} | {
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
export declare function applyWorkspaceResourceDelete(resourceId: string, actor?: string, ctx?: WorkspaceResourceCtx): Promise<{
    id: string;
    ownerEmail: string;
    orgId: string;
    kind: string;
    name: string;
    description: string;
    path: string;
    content: string;
    scope: string;
    createdBy: string;
    createdAt: number;
    updatedAt: number;
}>;
export declare function deleteWorkspaceResource(resourceId: string): Promise<{
    id: string;
    ownerEmail: string;
    orgId: string;
    kind: string;
    name: string;
    description: string;
    path: string;
    content: string;
    scope: string;
    createdBy: string;
    createdAt: number;
    updatedAt: number;
} | {
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
export declare function listResourceGrants(filter?: {
    resourceId?: string;
    appId?: string;
}): Promise<{
    id: string;
    ownerEmail: string;
    orgId: string;
    resourceId: string;
    appId: string;
    status: string;
    syncedAt: number;
    createdAt: number;
    updatedAt: number;
}[]>;
export declare function getResourceGrant(grantId: string, ctx?: WorkspaceResourceCtx): Promise<{
    id: string;
    ownerEmail: string;
    orgId: string;
    resourceId: string;
    appId: string;
    status: string;
    syncedAt: number;
    createdAt: number;
    updatedAt: number;
}>;
export declare function createResourceGrant(resourceId: string, appId: string): Promise<{
    id: string;
    ownerEmail: string;
    orgId: string;
    resourceId: string;
    appId: string;
    status: string;
    syncedAt: number;
    createdAt: number;
    updatedAt: number;
}>;
export declare function grantWorkspaceResourcesToApp(input: {
    appId: string;
    resourceIds: string[];
}): Promise<{
    appId: string;
    granted: {
        id: string;
        resourceId: string;
        appId: string;
    }[];
    skipped: {
        resourceId: string;
        reason: string;
    }[];
}>;
export declare function revokeResourceGrant(grantId: string, ctx?: WorkspaceResourceCtx): Promise<{
    id: string;
    ownerEmail: string;
    orgId: string;
    resourceId: string;
    appId: string;
    status: string;
    syncedAt: number;
    createdAt: number;
    updatedAt: number;
}>;
export declare function listWorkspaceResourcesOverview(): Promise<{
    skillCount: number;
    instructionCount: number;
    agentCount: number;
    knowledgeCount: number;
    totalResources: number;
    activeGrantCount: number;
}>;
//# sourceMappingURL=workspace-resources-store.d.ts.map