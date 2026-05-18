export declare const getState: import("h3").EventHandlerWithFetch<import("h3").EventHandlerRequest, Promise<Record<string, unknown>>>;
export declare const putState: import("h3").EventHandlerWithFetch<import("h3").EventHandlerRequest, Promise<any>>;
export declare const deleteState: import("h3").EventHandlerWithFetch<import("h3").EventHandlerRequest, Promise<{
    ok: boolean;
}>>;
/** List all compose drafts */
export declare const listComposeDrafts: import("h3").EventHandlerWithFetch<import("h3").EventHandlerRequest, Promise<Record<string, unknown>[]>>;
/** Get a single compose draft */
export declare const getComposeDraft: import("h3").EventHandlerWithFetch<import("h3").EventHandlerRequest, Promise<Record<string, unknown>>>;
/** Create or update a compose draft */
export declare const putComposeDraft: import("h3").EventHandlerWithFetch<import("h3").EventHandlerRequest, Promise<any>>;
/** Delete a single compose draft */
export declare const deleteComposeDraft: import("h3").EventHandlerWithFetch<import("h3").EventHandlerRequest, Promise<{
    ok: boolean;
}>>;
/** Delete all compose drafts */
export declare const deleteAllComposeDrafts: import("h3").EventHandlerWithFetch<import("h3").EventHandlerRequest, Promise<{
    ok: boolean;
}>>;
//# sourceMappingURL=handlers.d.ts.map