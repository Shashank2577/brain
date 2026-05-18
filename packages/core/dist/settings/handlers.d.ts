/** GET /_agent-native/settings/:key */
export declare const getSettingHandler: import("h3").EventHandlerWithFetch<import("h3").EventHandlerRequest, Promise<Record<string, unknown>>>;
/** PUT /_agent-native/settings/:key */
export declare const putSettingHandler: import("h3").EventHandlerWithFetch<import("h3").EventHandlerRequest, Promise<any>>;
/** DELETE /_agent-native/settings/:key */
export declare const deleteSettingHandler: import("h3").EventHandlerWithFetch<import("h3").EventHandlerRequest, Promise<{
    ok: boolean;
}>>;
//# sourceMappingURL=handlers.d.ts.map