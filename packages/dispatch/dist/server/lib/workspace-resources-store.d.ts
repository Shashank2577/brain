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
/**
 * Push workspace resources to an app via its /_agent-native/resources endpoint.
 * Resources with scope="all" are always pushed. Resources with scope="selected"
 * are only pushed if there's an active grant for that app.
 */
export declare function syncResourcesToApp(appId: string): Promise<{
    appId: string;
    synced: number;
    resources: string[];
}>;
/**
 * Sync all workspace resources to all apps that have grants or scope="all" resources.
 */
export declare function syncResourcesToAllApps(): Promise<{
    appId: string;
    synced: number;
}[]>;
export declare function listWorkspaceResourcesOverview(): Promise<{
    skillCount: number;
    instructionCount: number;
    agentCount: number;
    knowledgeCount: number;
    totalResources: number;
    activeGrantCount: number;
}>;
//# sourceMappingURL=workspace-resources-store.d.ts.map