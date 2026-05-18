export interface OpenRouteOptions {
    /** Per-template override that turns the parsed deep-link params into the
     *  client-side SPA path to redirect to. Return `null` to use the default
     *  (`/<view>`). Filter params (`f_*`) are appended automatically. */
    resolveOpenPath?: (params: {
        app?: string;
        view?: string;
        params: Record<string, string>;
    }) => string | null | undefined;
}
export declare function createOpenRouteHandler(options?: OpenRouteOptions): import("h3").EventHandlerWithFetch<import("h3").EventHandlerRequest, Promise<Response>>;
//# sourceMappingURL=open-route.d.ts.map