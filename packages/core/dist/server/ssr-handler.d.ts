/**
 * Create an h3 catch-all that hands page routes to React Router and
 * returns 404 for framework / asset paths that React Router doesn't own.
 */
export declare function createH3SSRHandler(getBuild: () => Promise<unknown> | unknown): import("h3").EventHandlerWithFetch<import("h3").EventHandlerRequest, Promise<Response>>;
//# sourceMappingURL=ssr-handler.d.ts.map