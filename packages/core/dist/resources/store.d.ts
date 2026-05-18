import type { StoreWriteOptions } from "../settings/store.js";
export declare const SHARED_OWNER = "__shared__";
export declare const WORKSPACE_OWNER = "__workspace__";
export interface Resource {
    id: string;
    path: string;
    owner: string;
    content: string;
    mimeType: string;
    size: number;
    createdAt: number;
    updatedAt: number;
    createdBy: ResourceCreatedBy;
    visibility: ResourceVisibility;
    threadId: string | null;
    runId: string | null;
    expiresAt: number | null;
    metadata: string | null;
}
export interface ResourceMeta {
    id: string;
    path: string;
    owner: string;
    mimeType: string;
    size: number;
    createdAt: number;
    updatedAt: number;
    createdBy: ResourceCreatedBy;
    visibility: ResourceVisibility;
    threadId: string | null;
    runId: string | null;
    expiresAt: number | null;
    metadata: string | null;
}
export type ResourceCreatedBy = "user" | "agent" | "system";
export type ResourceVisibility = "workspace" | "agent_scratch";
export interface ResourceWriteOptions extends StoreWriteOptions {
    createdBy?: ResourceCreatedBy;
    visibility?: ResourceVisibility;
    threadId?: string | null;
    runId?: string | null;
    expiresAt?: number | null;
    metadata?: string | Record<string, unknown> | null;
}
export interface ResourceListOptions {
    includeAgentScratch?: boolean;
}
export type ResourceInheritanceScope = "workspace" | "shared" | "personal";
export interface EffectiveResourceLayer {
    scope: ResourceInheritanceScope;
    label: string;
    owner: string;
    resource: ResourceMeta | null;
    exists: boolean;
    effective: boolean;
    overridden: boolean;
    canWrite: boolean;
}
export interface EffectiveResourceContext {
    path: string;
    effectiveResource: ResourceMeta | null;
    effectiveScope: ResourceInheritanceScope | null;
    layers: EffectiveResourceLayer[];
}
/**
 * Seed personal AGENTS.md and LEARNINGS.md for a user if they don't exist.
 * Called when listing resources or from the agent chat plugin.
 */
export declare function ensurePersonalDefaults(owner: string): Promise<void>;
export declare function resourceGet(id: string): Promise<Resource | null>;
export declare function resourceGetByPath(owner: string, path: string): Promise<Resource | null>;
export declare function resourcePut(owner: string, path: string, content: string, mimeType?: string, options?: ResourceWriteOptions): Promise<Resource>;
export declare function resourceDelete(id: string): Promise<boolean>;
export declare function resourceDeleteByPath(owner: string, path: string): Promise<boolean>;
export declare function resourceList(owner: string, pathPrefix?: string, options?: ResourceListOptions): Promise<ResourceMeta[]>;
export declare function resourceListAccessible(userEmail: string, pathPrefix?: string, options?: ResourceListOptions): Promise<ResourceMeta[]>;
export declare function resourceEffectiveContext(userEmail: string, path: string): Promise<EffectiveResourceContext>;
/**
 * List all resources matching a path prefix across ALL owners.
 * Used by the recurring jobs scheduler to find all job resources.
 */
export declare function resourceListAllOwners(pathPrefix: string): Promise<Resource[]>;
export declare function resourceMove(id: string, newPath: string): Promise<boolean>;
//# sourceMappingURL=store.d.ts.map