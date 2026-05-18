/**
 * H3 event handlers for the agent-runs progress primitive.
 *
 * Mounted under `/_agent-native/runs/*` by `core-routes-plugin`.
 *
 *   GET    /_agent-native/runs?active=true&limit=50
 *   GET    /_agent-native/runs/:id
 *   DELETE /_agent-native/runs/:id
 *
 * Writes happen through the `manage-progress` agent tool, not HTTP —
 * the agent is the canonical writer, the UI only reads. (We can add write
 * routes later if a non-agent producer needs them.)
 */
export declare function createProgressHandler(): import("h3").EventHandlerWithFetch<import("h3").EventHandlerRequest, Promise<"" | import("./types.js").AgentRun | import("./types.js").AgentRun[] | {
    error: string;
    ok?: undefined;
} | {
    ok: boolean;
    error?: undefined;
}>>;
//# sourceMappingURL=routes.d.ts.map