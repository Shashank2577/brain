import * as jose from "jose";
import { getH3App } from "../server/framework-request-handler.js";
import { defineEventHandler, setResponseStatus, getMethod, getRequestHeader, } from "h3";
import { readBody } from "../server/h3-helpers.js";
import { runWithRequestContext } from "../server/request-context.js";
// ---------------------------------------------------------------------------
// Auth — reuses the same pattern as A2A (Bearer token or JWT)
// ---------------------------------------------------------------------------
function getAccessTokens() {
    const single = process.env.ACCESS_TOKEN;
    const multi = process.env.ACCESS_TOKENS;
    const tokens = [];
    if (single)
        tokens.push(single);
    if (multi) {
        tokens.push(...multi
            .split(",")
            .map((t) => t.trim())
            .filter(Boolean));
    }
    return tokens;
}
/**
 * Verify the inbound auth header. Returns:
 *   - { authed: true, identity } when verified — `identity` may be empty
 *     when authed via a static ACCESS_TOKEN (no caller email available).
 *   - { authed: false } on rejection.
 *
 * When A2A_SECRET is set we extract the JWT's `sub` (caller email) and
 * `org_domain` claims so the MCP endpoint can wrap tool runs in
 * `runWithRequestContext({ userEmail, orgId })`. Without that wrap, the
 * MCP endpoint loses tenant identity and downstream `accessFilter` /
 * `resolveCredential` calls fall back to platform-wide defaults.
 */
async function verifyAuth(authHeader) {
    // No auth configured → allow (dev mode), but no identity to propagate.
    const accessTokens = getAccessTokens();
    const hasA2ASecret = !!process.env.A2A_SECRET;
    if (accessTokens.length === 0 && !hasA2ASecret) {
        return { authed: true };
    }
    if (!authHeader?.startsWith("Bearer "))
        return { authed: false };
    const token = authHeader.slice(7);
    // Try JWT via A2A_SECRET
    if (hasA2ASecret) {
        try {
            const { payload } = await jose.jwtVerify(token, new TextEncoder().encode(process.env.A2A_SECRET));
            return {
                authed: true,
                identity: {
                    userEmail: typeof payload.sub === "string" ? payload.sub : undefined,
                    orgDomain: typeof payload.org_domain === "string"
                        ? payload.org_domain
                        : undefined,
                },
            };
        }
        catch {
            // Not a valid JWT — fall through to token check
        }
    }
    // Try ACCESS_TOKEN / ACCESS_TOKENS exact match (no per-caller identity).
    if (accessTokens.length > 0 && accessTokens.includes(token)) {
        return { authed: true };
    }
    return { authed: false };
}
async function resolveOrgIdFromDomain(orgDomain) {
    if (!orgDomain)
        return undefined;
    try {
        const { resolveOrgByDomain } = await import("../org/context.js");
        const org = await resolveOrgByDomain(orgDomain);
        return org?.orgId ?? undefined;
    }
    catch {
        return undefined;
    }
}
// ---------------------------------------------------------------------------
// MCP Server creation — converts ActionEntry registry to MCP tools
// ---------------------------------------------------------------------------
async function createMCPServerForRequest(config, identity) {
    const { Server } = await import("@modelcontextprotocol/sdk/server/index.js");
    const { ListToolsRequestSchema, CallToolRequestSchema } = await import("@modelcontextprotocol/sdk/types.js");
    const server = new Server({ name: config.name, version: config.version ?? "1.0.0" }, { capabilities: { tools: {} } });
    // Resolve orgId once per request (DB lookup) so subsequent wraps are
    // synchronous. The caller identity may be undefined for ACCESS_TOKEN
    // auth — in that case we run with no userEmail/orgId, which makes
    // downstream tools that require per-user scope return empty results
    // rather than cross-tenant data (the safe default).
    const orgIdPromise = resolveOrgIdFromDomain(identity?.orgDomain);
    /**
     * Wrap a callback in `runWithRequestContext({ userEmail, orgId }, fn)`.
     * Both the tools/list and tools/call handlers go through this so
     * downstream `accessFilter`, `resolveCredential`, and per-user MCP
     * visibility checks see the verified caller's identity.
     */
    async function withCallerContext(fn) {
        const orgId = await orgIdPromise;
        return runWithRequestContext({ userEmail: identity?.userEmail, orgId }, fn);
    }
    // tools/list — return all actions + ask-agent meta-tool. Wrapped in the
    // request context so per-user MCP visibility (mcp-client/visibility.ts)
    // applies to the listing too.
    server.setRequestHandler(ListToolsRequestSchema, async () => {
        return withCallerContext(async () => {
            const tools = Object.entries(config.actions).map(([name, entry]) => ({
                name,
                description: entry.tool.description ?? name,
                inputSchema: entry.tool.parameters ?? {
                    type: "object",
                    properties: {},
                },
            }));
            if (config.askAgent) {
                tools.push({
                    name: "ask-agent",
                    description: "Send a natural-language message to the app's AI agent and get a response. " +
                        "Use this for complex, multi-step tasks that require the agent's reasoning " +
                        "and full context about the app.",
                    inputSchema: {
                        type: "object",
                        properties: {
                            message: {
                                type: "string",
                                description: "The message to send to the agent",
                            },
                        },
                        required: ["message"],
                    },
                });
            }
            return { tools };
        });
    });
    // tools/call — dispatch to action registry or ask-agent. Wrapped in the
    // request context so the action's `run(args)` and `askAgent()` execute
    // with the verified caller's identity, not the platform default.
    server.setRequestHandler(CallToolRequestSchema, async (request) => {
        return withCallerContext(async () => {
            const { name, arguments: args } = request.params;
            if (name === "ask-agent" && config.askAgent) {
                const message = args?.message ?? "";
                try {
                    const result = await config.askAgent(message);
                    return { content: [{ type: "text", text: result }] };
                }
                catch (err) {
                    return {
                        content: [{ type: "text", text: `Error: ${err.message}` }],
                        isError: true,
                    };
                }
            }
            const entry = config.actions[name];
            if (!entry) {
                return {
                    content: [{ type: "text", text: `Unknown tool: ${name}` }],
                    isError: true,
                };
            }
            try {
                const result = await entry.run(args ?? {});
                return { content: [{ type: "text", text: result }] };
            }
            catch (err) {
                return {
                    content: [{ type: "text", text: `Error: ${err.message}` }],
                    isError: true,
                };
            }
        });
    });
    return server;
}
// ---------------------------------------------------------------------------
// mountMCP — register MCP Streamable HTTP endpoint on H3/Nitro
// ---------------------------------------------------------------------------
/**
 * Mount an MCP remote server on an H3/Nitro app.
 *
 * Endpoint: `{routePrefix}/mcp` (default `/_agent-native/mcp`)
 *
 * Uses stateless Streamable HTTP transport — no in-memory sessions,
 * compatible with serverless deployments.
 *
 * Auth: Bearer token matching ACCESS_TOKEN/ACCESS_TOKENS or JWT via A2A_SECRET.
 * No auth required when neither is configured (dev mode).
 */
export function mountMCP(nitroApp, config, routePrefix = "/_agent-native") {
    getH3App(nitroApp).use(`${routePrefix}/mcp`, defineEventHandler(async (event) => {
        const pathname = event.url?.pathname || "/";
        const subpath = pathname.replace(/^\/+/, "").replace(/\/+$/, "");
        if (subpath) {
            // Let management/status routes mounted under /_agent-native/mcp/*
            // handle their own requests instead of treating them as MCP protocol
            // traffic.
            return;
        }
        const method = getMethod(event);
        // Auth check — also extracts the caller's identity from the JWT so
        // downstream tools run inside `runWithRequestContext`.
        const authHeader = getRequestHeader(event, "authorization");
        const authResult = await verifyAuth(authHeader);
        if (!authResult.authed) {
            setResponseStatus(event, 401);
            return { error: "Unauthorized" };
        }
        // Stateless mode: only POST is meaningful
        if (method === "DELETE") {
            setResponseStatus(event, 204);
            return "";
        }
        if (method === "GET") {
            // SSE stream endpoint — not used in stateless mode but the SDK
            // handles it gracefully. Let it through for protocol compliance.
        }
        if (method !== "POST" && method !== "GET") {
            setResponseStatus(event, 405);
            return { error: "Method not allowed" };
        }
        // Read body for POST (GET has no body)
        const body = method === "POST" ? await readBody(event) : undefined;
        // Create per-request stateless transport + server
        const { StreamableHTTPServerTransport } = await import("@modelcontextprotocol/sdk/server/streamableHttp.js");
        const transport = new StreamableHTTPServerTransport({
            sessionIdGenerator: undefined, // stateless
        });
        const server = await createMCPServerForRequest(config, authResult.identity);
        await server.connect(transport);
        // Delegate to the transport — it writes directly to the Node response.
        // MCP's HTTP transport requires Node streams; this route is Node-only.
        const nodeReq = event.node?.req ?? event.req?.runtime?.node?.req;
        const nodeRes = event.node?.res ?? event.req?.runtime?.node?.res;
        if (!nodeReq || !nodeRes) {
            setResponseStatus(event, 501);
            return { error: "MCP requires Node runtime" };
        }
        await transport.handleRequest(nodeReq, nodeRes, body);
        // Prevent H3 from double-writing the response
        event._handled = true;
    }));
    if (process.env.DEBUG)
        console.log(`[mcp] Mounted MCP server at ${routePrefix}/mcp (${Object.keys(config.actions).length} tools${config.askAgent ? " + ask-agent" : ""})`);
}
//# sourceMappingURL=server.js.map