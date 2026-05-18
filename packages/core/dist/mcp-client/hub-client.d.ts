/**
 * Hub consume — fetches a remote agent-native app's org-scope MCP servers
 * and projects them into the local MCP manager's config shape.
 *
 * Opt-in via env:
 *   AGENT_NATIVE_MCP_HUB_URL   = https://dispatch.example.com
 *   AGENT_NATIVE_MCP_HUB_TOKEN = <shared secret, matches hub's token>
 *
 * Failures are non-fatal — if the hub is unreachable or the token is
 * wrong, the app boots with just its local MCP config and logs a warning.
 */
import type { McpServerConfig } from "./config.js";
export type HubFetchResult = {
    state: "disabled";
} | {
    state: "ok";
    servers: Record<string, McpServerConfig>;
} | {
    state: "unreachable";
    /** Last-known-good servers if we have them, otherwise an empty map. */
    servers: Record<string, McpServerConfig>;
    error: string;
};
/**
 * Fetch the remote hub's org-scope servers. Returns a tri-state so callers
 * can distinguish "hub said empty" from "hub is unreachable" and keep the
 * last-known-good set live across transient failures.
 */
export declare function fetchHubServersDetailed(): Promise<HubFetchResult>;
/**
 * Back-compat convenience that always returns a server map. On unreachable,
 * callers get the last-known-good set (empty on first-fetch failure) so one
 * flaky hub call can't wipe loaded servers from the running manager.
 */
export declare function fetchHubServers(): Promise<Record<string, McpServerConfig>>;
/** Reset the in-memory cache. Exposed for tests only. */
export declare function _resetHubCacheForTests(): void;
//# sourceMappingURL=hub-client.d.ts.map