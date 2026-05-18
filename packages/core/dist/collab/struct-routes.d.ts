/**
 * HTTP route handlers for structured (JSON) collaborative editing.
 *
 * Mounted under /_agent-native/collab/ by the collab plugin alongside
 * the text-based routes in routes.ts.
 */
/**
 * POST /_agent-native/collab/:docId/json
 *
 * Apply full JSON content to a collaborative document. The server diffs
 * against the current Yjs state and applies minimal operations.
 *
 * Body: { json: any, fieldName?: string, type?: "map"|"array", requestSource?: string }
 */
export declare const postCollabJson: import("h3").EventHandlerWithFetch<import("h3").EventHandlerRequest, Promise<{
    error: string;
    ok?: undefined;
} | {
    ok: boolean;
    error?: undefined;
}>>;
/**
 * POST /_agent-native/collab/:docId/patch
 *
 * Apply surgical JSON patch operations to a collaborative document.
 *
 * Body: { ops: PatchOp[], fieldName?: string, requestSource?: string }
 */
export declare const postCollabPatch: import("h3").EventHandlerWithFetch<import("h3").EventHandlerRequest, Promise<{
    error: string;
    ok?: undefined;
} | {
    ok: boolean;
    error?: undefined;
}>>;
/**
 * GET /_agent-native/collab/:docId/json
 *
 * Returns the current JSON state of a collaborative document.
 *
 * Query param: fieldName (default: "data")
 */
export declare const getCollabJson: import("h3").EventHandlerWithFetch<import("h3").EventHandlerRequest, Promise<{
    error: string;
    docId?: undefined;
    data?: undefined;
} | {
    docId: string;
    data: any;
    error?: undefined;
}>>;
//# sourceMappingURL=struct-routes.d.ts.map