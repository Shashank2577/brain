/**
 * Hub serve — exposes this app's org-scope MCP servers to other agent-native
 * apps in the same workspace.
 *
 * An app becomes a hub by setting `AGENT_NATIVE_MCP_HUB_TOKEN=<secret>` in
 * its environment. Consuming apps set the same token plus
 * `AGENT_NATIVE_MCP_HUB_URL` pointing at the hub; at startup they pull the
 * hub's org-scope server list (URL + headers + description) and merge it
 * into their own running MCP manager.
 *
 * Convention: dispatch is the hub. Any template can consume from it.
 *
 * User-scope servers are intentionally NOT shared — personal credentials
 * stay with the user who added them. Only `o:<orgId>:mcp-servers-remote`
 * entries are returned.
 *
 * SECURITY — TRUST BOUNDARY:
 * The hub bearer (`AGENT_NATIVE_MCP_HUB_TOKEN`) is a SHARED secret. Anyone
 * who possesses it can list every org's MCP servers on the hub, regardless
 * of their org membership. This is acceptable for the standard convention
 * — one hub per workspace, a single-tenant deployment where every consumer
 * already operates inside the same trust circle. It is NOT acceptable on a
 * multi-tenant hub where different orgs must be isolated from each other.
 *
 * To prevent an accidental cross-tenant leak we refuse to serve hub
 * responses when the database contains MCP rows for multiple distinct orgs
 * AND the operator hasn't explicitly opted in to multi-org mode via
 * `AGENT_NATIVE_MCP_HUB_MULTI_ORG=1`. The check runs in production only;
 * local dev can serve a heterogeneous database without ceremony.
 */
export interface HubServerRecord {
    /** `<orgId>-<name>` — unique within the hub response. */
    id: string;
    orgId: string;
    name: string;
    url: string;
    headers?: Record<string, string>;
    description?: string;
}
export interface HubServersResponse {
    servers: HubServerRecord[];
    generatedAt: number;
}
/** Is this process configured to serve as a hub for other apps? */
export declare function isHubServeEnabled(): boolean;
/** Is this process configured to consume from a remote hub? */
export declare function isHubConsumeEnabled(): boolean;
export declare function listHubServers(): Promise<HubServerRecord[]>;
export declare function mountMcpHubRoutes(nitroApp: any): void;
/** Status used by the UI to show a "hub mode" card. */
export declare function getHubStatus(): {
    serving: boolean;
    consuming: boolean;
    hubUrl: string | null;
};
//# sourceMappingURL=hub-routes.d.ts.map