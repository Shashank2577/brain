/**
 * `/_agent-native/mcp/connect` — frictionless external-agent connection.
 *
 * A logged-in user on a deployed agent-native app (e.g. mail.agent-native.com)
 * mints a per-user, scoped, revocable MCP bearer token WITHOUT ever copying a
 * shared deployment secret. Two surfaces:
 *
 *   1. Browser  — `GET /connect` renders a minimal in-app page (same inline
 *      HTML approach as the auth pages). The Authorize button POSTs to
 *      `/connect/token`, then shows the ready-to-paste `.mcp.json` entry, the
 *      `agent-native connect <origin>` one-liner, and the user's existing
 *      tokens with Revoke buttons.
 *   2. CLI      — an OAuth-2.0-device-authorization-style flow:
 *        POST /connect/device/start      (unauth)  → device_code + user_code
 *        GET  /connect?user_code=…       (browser) → user signs in & approves
 *        POST /connect/device/authorize  (session) → binds user to the code
 *        POST /connect/device/poll       (unauth)  → mints + returns the token
 *
 * The minted token reuses the existing A2A signer (`signA2AToken`) — no new
 * crypto. We only add a random `jti` + `scope: "mcp-connect"` claim so it can
 * be revoked. `verifyAuth` already verifies A2A_SECRET JWTs and extracts
 * `sub`/`org_domain`, so a minted token works against `/_agent-native/mcp`
 * with no verify changes for the happy path (the revoke check is the only
 * addition there).
 *
 * Node-only (crypto + the A2A signer), bundled alongside the other framework
 * routes. Dialect-agnostic SQL lives in `connect-store.ts`.
 */
import type { H3Event } from "h3";
export interface McpConnectRouteOptions {
    /** App id (directory under apps/, e.g. `mail`). Used for the server name. */
    appId?: string;
    /** Human app name shown on the connect page. */
    appName?: string;
}
/**
 * Handle a `/_agent-native/mcp/connect[...]` request. `subpath` is the part
 * after `/connect` (empty string = the page itself, otherwise e.g.
 * `/token`, `/device/start`). The core-routes-plugin computes it from the
 * stripped event path so this module stays mount-agnostic.
 */
export declare function handleMcpConnect(event: H3Event, subpath: string, options?: McpConnectRouteOptions): Promise<Response>;
//# sourceMappingURL=connect-route.d.ts.map