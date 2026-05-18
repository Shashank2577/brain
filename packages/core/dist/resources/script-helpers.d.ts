/**
 * Resource helpers for use in scripts.
 *
 * Scripts run inside an authenticated request context (set by the agent
 * runtime) or — in CLI-only contexts — read AGENT_USER_EMAIL. Both paths
 * require a real identity; there is no dev-mode fallback.
 */
import { type ResourceMeta, type EffectiveResourceContext, type ResourceVisibility, type ResourceCreatedBy } from "./store.js";
type ResourceHelperScope = "personal" | "shared" | "workspace";
export declare function readResource(path: string, options?: {
    shared?: boolean;
    scope?: ResourceHelperScope;
}): Promise<string | null>;
export declare function writeResource(path: string, content: string, options?: {
    shared?: boolean;
    scope?: Exclude<ResourceHelperScope, "workspace">;
    mimeType?: string;
    visibility?: ResourceVisibility;
    createdBy?: ResourceCreatedBy;
    threadId?: string | null;
    runId?: string | null;
    expiresAt?: number | null;
    metadata?: string | Record<string, unknown> | null;
}): Promise<void>;
export declare function deleteResource(path: string, options?: {
    shared?: boolean;
    scope?: Exclude<ResourceHelperScope, "workspace">;
}): Promise<boolean>;
export declare function listResources(prefix?: string, options?: {
    shared?: boolean;
    scope?: ResourceHelperScope;
    includeAgentScratch?: boolean;
}): Promise<ResourceMeta[]>;
export declare function listAllResources(prefix?: string, options?: {
    includeAgentScratch?: boolean;
}): Promise<ResourceMeta[]>;
export declare function getEffectiveResourceContext(path: string): Promise<EffectiveResourceContext>;
export {};
//# sourceMappingURL=script-helpers.d.ts.map