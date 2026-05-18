import type { StoreWriteOptions } from "../settings/store.js";
export declare const SHARED_OWNER = "__shared__";
export interface Resource {
    id: string;
    path: string;
    owner: string;
    content: string;
    mimeType: string;
    size: number;
    createdAt: number;
    updatedAt: number;
}
export interface ResourceMeta {
    id: string;
    path: string;
    owner: string;
    mimeType: string;
    size: number;
    createdAt: number;
    updatedAt: number;
}
/**
 * Seed personal AGENTS.md and LEARNINGS.md for a user if they don't exist.
 * Called when listing resources or from the agent chat plugin.
 */
export declare function ensurePersonalDefaults(owner: string): Promise<void>;
export declare function resourceGet(id: string): Promise<Resource | null>;
export declare function resourceGetByPath(owner: string, path: string): Promise<Resource | null>;
export declare function resourcePut(owner: string, path: string, content: string, mimeType?: string, options?: StoreWriteOptions): Promise<Resource>;
export declare function resourceDelete(id: string): Promise<boolean>;
export declare function resourceDeleteByPath(owner: string, path: string): Promise<boolean>;
export declare function resourceList(owner: string, pathPrefix?: string): Promise<ResourceMeta[]>;
export declare function resourceListAccessible(userEmail: string, pathPrefix?: string): Promise<ResourceMeta[]>;
/**
 * List all resources matching a path prefix across ALL owners.
 * Used by the recurring jobs scheduler to find all job resources.
 */
export declare function resourceListAllOwners(pathPrefix: string): Promise<Resource[]>;
export declare function resourceMove(id: string, newPath: string): Promise<boolean>;
//# sourceMappingURL=store.d.ts.map