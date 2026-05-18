/**
 * Shared MCP server builder.
 *
 * Extracted from `server.ts` so the stateless Streamable-HTTP mount
 * (`mountMCP`) and the stdio transport (`runMCPStdio --standalone`) build the
 * *same* MCP server from the *same* `ActionEntry` registry. Both surfaces:
 *
 *   - expose every action as an MCP tool (+ the `ask-agent` meta-tool),
 *   - append the framework deep-link block / `_meta` to every tool result,
 *   - wrap `run()` / `askAgent()` in `runWithRequestContext` so per-user /
 *     per-org scoping (accessFilter, resolveCredential, MCP visibility) is
 *     honoured.
 *
 * `server.ts` re-exports `createMCPServerForRequest` and the auth helpers so
 * any (future) external importer of `@agent-native/core/mcp` keeps resolving.
 *
 * Node-only at the SDK level, but this module itself has no Node-only imports
 * — it can be bundled into the serverless function alongside `mountMCP`.
 */
import type { ActionEntry } from "../agent/production-agent.js";
export interface MCPConfig {
    /** App name shown in MCP server info */
    name: string;
    /**
     * Canonical app id (directory under `apps/`, e.g. `mail`) this MCP server
     * is mounted for. Optional & back-compat: when omitted the builtin
     * cross-app tools fall back to lowercasing `name`. Used by `open_app` /
     * `ask_app` / `create_workspace_app` to tell "this app" from a cross-app
     * target so they resolve the *target* app's origin rather than echoing the
     * current request origin.
     */
    appId?: string;
    /** App description */
    description: string;
    /** Version string (default "1.0.0") */
    version?: string;
    /** Action registry — same as agent chat and A2A */
    actions: Record<string, ActionEntry>;
    /**
     * Full ("production") action surface served to an **authenticated real
     * caller** — a connect-minted token, an `agent-native mcp install` stdio
     * proxy (owner-email header / `AGENT_NATIVE_OWNER_EMAIL`), or a deployed /
     * `AGENT_MODE=production` app. In local dev `actions` is intentionally the
     * sparse, dev-toggled surface (builtins + read-only public-agent actions)
     * so the local agent chat and unauthenticated dev probes don't see every
     * mutating tool; but per the external-agents contract a real caller that
     * connected with a token MUST get the full surface even in dev. When unset
     * (production, where `actions` already IS the full set) the swap is a
     * no-op. See `external-agents` skill, "Dev vs production tool surface".
     */
    productionActions?: Record<string, ActionEntry>;
    /** Handler for the ask-agent meta-tool — runs the full agent loop */
    askAgent?: (message: string) => Promise<string>;
    /**
     * Disable the generic cross-app builtin tools (`list_apps`, `open_app`,
     * `ask_app`, `create_workspace_app`, `list_templates`). They are merged in
     * by default so external agents get a stable verb set; a template action of
     * the same name always wins (template precedence). Set to `false` only for
     * a constrained / locked-down mount.
     */
    builtinCrossAppTools?: boolean;
}
/**
 * Identity extracted from a verified MCP bearer token / JWT. Used to wrap
 * `entry.run()` and `config.askAgent()` calls in `runWithRequestContext`
 * so downstream tools (db-query, accessFilter, resolveCredential) honour
 * per-user / per-org scoping. Without this wrap the MCP endpoint would
 * silently bypass tenant isolation. See finding #6 in
 * /tmp/security-audit/12-mcp-a2a-agent.md.
 */
export interface MCPCallerIdentity {
    userEmail: string | undefined;
    orgDomain: string | undefined;
}
/** Per-request context used to turn an action's relative deep link into the
 *  absolute web URL (and desktop `agentnative://` URL) the external agent
 *  surfaces. Derived from the inbound request headers in `mountMCP`, or from
 *  the resolved local app origin in the stdio standalone path. */
export interface MCPRequestMeta {
    /** Origin of the running app, e.g. `http://localhost:8100`. */
    origin?: string;
    /** Optional client preference for which URL the *markdown* link uses. */
    target?: "browser" | "desktop" | "terminal";
    /**
     * The caller authenticated with a real credential (verified A2A/connect
     * JWT, matching ACCESS_TOKEN, or a forwarded owner-email header from
     * `agent-native mcp install`) — not the unauthenticated local dev-open
     * path. When true, `createMCPServerForRequest` serves
     * `config.productionActions` (the full surface) instead of the sparse dev
     * `config.actions`. Set by `mountMCP` from `verifyAuth`.
     */
    fullSurface?: boolean;
}
/**
 * Build the deep-link content block + structured `_meta` for a tool result.
 * Best-effort: any throw / nullish link is swallowed so a bad `link` builder
 * never fails the tool call.
 */
export declare function buildLinkArtifacts(entry: ActionEntry, args: Record<string, any>, result: any, meta: MCPRequestMeta | undefined): {
    block?: {
        type: "text";
        text: string;
    };
    _meta?: Record<string, unknown>;
};
/**
 * Build a fully-wired MCP `Server` for a single request / session.
 *
 * Shared by the stateless Streamable-HTTP mount (`mountMCP`) and the stdio
 * standalone transport. The HTTP mount passes the per-request origin via
 * `requestMeta`; the stdio standalone path passes the resolved local app
 * origin so deep links still become absolute URLs.
 */
export declare function createMCPServerForRequest(config: MCPConfig, identity: MCPCallerIdentity | undefined, requestMeta?: MCPRequestMeta): Promise<import("@modelcontextprotocol/sdk/server").Server<{
    method: string;
    params?: {
        [x: string]: unknown;
        _meta?: {
            [x: string]: unknown;
            progressToken?: string | number;
            "io.modelcontextprotocol/related-task"?: {
                taskId: string;
            };
        };
    };
}, {
    method: string;
    params?: {
        [x: string]: unknown;
        _meta?: {
            [x: string]: unknown;
            progressToken?: string | number;
            "io.modelcontextprotocol/related-task"?: {
                taskId: string;
            };
        };
    };
}, {
    [x: string]: unknown;
    _meta?: {
        [x: string]: unknown;
        progressToken?: string | number;
        "io.modelcontextprotocol/related-task"?: {
            taskId: string;
        };
    };
}>>;
export declare function getAccessTokens(): string[];
/**
 * Verify the inbound auth header. Returns:
 *   - { authed: true, identity } when verified — `identity` is derived from
 *     the JWT (`sub` / `org_domain`) for JWT auth, or from the
 *     `AGENT_NATIVE_OWNER_EMAIL` env / `X-Agent-Native-Owner-Email` header
 *     for static-token auth (the `agent-native mcp install` flow). `identity`
 *     is undefined only for true dev-open with no owner hint.
 *   - { authed: false } on rejection.
 *
 * When A2A_SECRET is set we extract the JWT's `sub` (caller email) and
 * `org_domain` claims so the MCP endpoint can wrap tool runs in
 * `runWithRequestContext({ userEmail, orgId })`. Without that wrap, the
 * MCP endpoint loses tenant identity and downstream `accessFilter` /
 * `resolveCredential` calls fall back to platform-wide defaults.
 *
 * `ownerEmailHeader` is the forwarded `X-Agent-Native-Owner-Email` value; it
 * is consulted ONLY on the static-token / dev-open path (never to influence
 * verified JWT identity), so the install flow runs tools as the configured
 * owner instead of an unscoped anonymous caller.
 */
export declare function verifyAuth(authHeader: string | undefined, ownerEmailHeader?: string | undefined, options?: {
    allowDevOpen?: boolean;
}): Promise<{
    authed: boolean;
    identity?: MCPCallerIdentity;
    /**
     * The caller presented a real credential — a verified A2A/connect JWT, a
     * matching ACCESS_TOKEN, or (on the no-auth-configured path) a forwarded
     * owner-email header from `agent-native mcp install`. Drives the full vs
     * sparse MCP tool surface in local dev. The pure unauthenticated dev-open
     * path (no secret, no token, no owner header) is `false`.
     */
    fullSurface?: boolean;
}>;
export declare function resolveOrgIdFromDomain(orgDomain: string | undefined): Promise<string | undefined>;
//# sourceMappingURL=build-server.d.ts.map