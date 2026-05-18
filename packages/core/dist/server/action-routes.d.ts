import type { ActionEntry } from "../agent/production-agent.js";
export interface MountActionRoutesOptions {
    /** Resolve owner email from the H3 event (for data scoping). */
    getOwnerFromEvent?: (event: any) => string | Promise<string>;
    /** Resolve display name from the H3 event, when available. */
    getUserNameFromEvent?: (event: any) => string | undefined | Promise<string | undefined>;
    /** Resolve org ID from the H3 event (for org scoping). */
    resolveOrgId?: (event: any) => string | null | Promise<string | null>;
}
/**
 * Mount discovered actions as HTTP endpoints.
 *
 * Only actions from `autoDiscoverActions` (template actions) are mounted.
 * Built-in actions (resource-*, chat-*, shell, etc.) are NOT passed here.
 */
export declare function mountActionRoutes(nitroApp: any, actions: Record<string, ActionEntry>, options?: MountActionRoutesOptions): void;
//# sourceMappingURL=action-routes.d.ts.map