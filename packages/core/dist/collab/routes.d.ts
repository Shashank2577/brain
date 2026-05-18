/**
 * HTTP route handlers for collaborative editing.
 *
 * Mounted under /_agent-native/collab/ by the collab plugin.
 */
/**
 * GET /_agent-native/collab/:docId/state
 *
 * Returns full Yjs document state as base64 for initial client load.
 */
export declare const getCollabState: import("h3").EventHandlerWithFetch<import("h3").EventHandlerRequest, Promise<{
    error: string;
    docId?: undefined;
    state?: undefined;
} | {
    docId: string;
    state: string;
    error?: undefined;
}>>;
/**
 * POST /_agent-native/collab/:docId/update
 *
 * Client sends a Yjs update (base64). Server applies it, persists, and
 * emits a change event so other clients pick it up via polling.
 *
 * Body: { update: string (base64), requestSource?: string }
 */
export declare const postCollabUpdate: import("h3").EventHandlerWithFetch<import("h3").EventHandlerRequest, Promise<{
    error: string;
    ok?: undefined;
} | {
    ok: boolean;
    error?: undefined;
}>>;
/**
 * POST /_agent-native/collab/:docId/text
 *
 * Agent sends full text content. Server computes diff against current
 * Yjs state and applies minimal operations.
 *
 * Body: { text: string, fieldName?: string, requestSource?: string }
 */
export declare const postCollabText: import("h3").EventHandlerWithFetch<import("h3").EventHandlerRequest, Promise<{
    error: string;
    ok?: undefined;
    text?: undefined;
} | {
    ok: boolean;
    text: string;
    error?: undefined;
}>>;
/**
 * POST /_agent-native/collab/:docId/search-replace
 *
 * Search-and-replace text in the Y.XmlFragment (ProseMirror tree).
 * Produces minimal Yjs operations for cursor-preserving updates.
 *
 * Body: { find: string, replace: string, requestSource?: string }
 */
export declare const postCollabSearchReplace: import("h3").EventHandlerWithFetch<import("h3").EventHandlerRequest, Promise<{
    error: string;
    ok?: undefined;
    found?: undefined;
} | {
    ok: boolean;
    found: boolean;
    error?: undefined;
}>>;
//# sourceMappingURL=routes.d.ts.map