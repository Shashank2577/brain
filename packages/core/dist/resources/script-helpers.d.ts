/**
 * Resource helpers for use in scripts.
 *
 * Scripts run inside an authenticated request context (set by the agent
 * runtime) or — in CLI-only contexts — read AGENT_USER_EMAIL. Both paths
 * require a real identity; there is no dev-mode fallback.
 */
import { type ResourceMeta } from "./store.js";
export declare function readResource(path: string, options?: {
    shared?: boolean;
}): Promise<string | null>;
export declare function writeResource(path: string, content: string, options?: {
    shared?: boolean;
    mimeType?: string;
}): Promise<void>;
export declare function deleteResource(path: string, options?: {
    shared?: boolean;
}): Promise<boolean>;
export declare function listResources(prefix?: string, options?: {
    shared?: boolean;
}): Promise<ResourceMeta[]>;
export declare function listAllResources(prefix?: string): Promise<ResourceMeta[]>;
//# sourceMappingURL=script-helpers.d.ts.map