import type { H3Event } from "h3";
import { createMCPServerForRequest, verifyAuth, getAccessTokens, resolveOrgIdFromDomain, buildLinkArtifacts, type MCPConfig, type MCPCallerIdentity, type MCPRequestMeta } from "./build-server.js";
export { createMCPServerForRequest, verifyAuth, getAccessTokens, resolveOrgIdFromDomain, buildLinkArtifacts, };
export type { MCPConfig, MCPCallerIdentity, MCPRequestMeta };
/**
 * Handle a single `{routePrefix}/mcp` request on either runtime.
 *
 * - **Node fast-path** (real Node HTTP server): unchanged — delegate to the
 *   SDK's `StreamableHTTPServerTransport.handleRequest(nodeReq, nodeRes,
 *   body)`, which writes directly to the Node response (full protocol incl.
 *   SSE).
 * - **Web-standard fallback** (Nitro 3 / Netlify web runtime, Cloudflare,
 *   Deno, Bun — where there is no Node req/res): build the SAME MCP `Server`
 *   from the SAME config + identity, drive it through the SDK's
 *   `WebStandardStreamableHTTPServerTransport` (which the Node transport is
 *   itself just a thin wrapper around), and return the resulting Web
 *   `Response` as a normal h3 return value.
 *
 * Auth, the `runWithRequestContext` identity wrap, the deep-link `_meta` /
 * markdown append, `requestMeta` origin/target derivation and the stateless
 * semantics are IDENTICAL on both paths because both build the same server
 * via `createMCPServerForRequest` and both transports funnel into the same
 * `WebStandardStreamableHTTPServerTransport.handleRequest(webRequest, {
 * parsedBody })` with the same options.
 *
 * Returns:
 *   - `undefined` when the request targets a sub-route (so management/status
 *     routes mounted under `/_agent-native/mcp/*` handle it themselves) — the
 *     h3 mount falls through to the next handler.
 *   - a Web `Response` (web fallback) or a string/object (Node path /
 *     auth-error path) otherwise. The Node path also sets `_handled` so h3
 *     doesn't double-write.
 */
export declare function handleMcpRequest(event: H3Event, config: MCPConfig): Promise<Response | string | {
    error: string;
} | undefined>;
/**
 * Mount an MCP remote server on an H3/Nitro app.
 *
 * Endpoint: `{routePrefix}/mcp` (default `/_agent-native/mcp`)
 *
 * Uses stateless Streamable HTTP transport — no in-memory sessions,
 * compatible with serverless deployments. Runtime-agnostic: a real Node
 * server uses the SDK's Node transport; the web-standard runtime (Nitro 3 /
 * Netlify web runtime, Cloudflare, Deno, Bun) uses the SDK's web-standard
 * transport. Both build the same server and produce identical JSON-RPC
 * output.
 *
 * Auth: Bearer token matching ACCESS_TOKEN/ACCESS_TOKENS or JWT via A2A_SECRET.
 * No auth required when neither is configured (dev mode).
 */
export declare function mountMCP(nitroApp: any, config: MCPConfig, routePrefix?: string): void;
//# sourceMappingURL=server.d.ts.map