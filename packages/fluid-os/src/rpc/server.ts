/**
 * Registry-only RPC handler. After Phase 4 the fluid-os package is a library
 * shipped to dispatch (which wires identity, agent, and cookies via its own
 * Nitro plugin at `packages/dispatch/src/server/plugins/capability-registry.ts`).
 *
 * This handler is preserved for two consumers:
 *   1. Mobile shells that want a thin standalone RPC layer over an existing
 *      capability registry — they pass `resolveUser` and (optionally) `agent`.
 *   2. Integration tests / fixtures that need an HTTP front for a programmatic
 *      registry without booting the full dispatch server.
 *
 * Identity is now caller-supplied (`resolveUser(req)`) rather than baked in
 * via JWT — that's what dispatch supersedes. Anything new should call into
 * the dispatch plugin instead.
 */
import type { CapabilityRegistry } from "../registry.js";
import type { CapabilityContext, OsUser } from "../manifest/types.js";
import {
  LIST_APPS_PATH,
  LIST_CAPABILITIES_PATH,
  RPC_PATH,
  type RpcRequest,
  type RpcResponse,
} from "./protocol.js";

export interface RpcHandlerOpts {
  registry: CapabilityRegistry;
  /**
   * Resolve the calling user from the inbound request. Return `null` to reject
   * with a 401. Implementations should validate any bearer token / session
   * cookie they trust.
   */
  resolveUser: (req: Request) => Promise<OsUser | null> | OsUser | null;
  /**
   * Optional agent escalation. When omitted, `ctx.agent(prompt)` returns the
   * empty string — useful for tests and shells that don't need agent fallback.
   */
  agent?: (opts: {
    prompt: string;
    user: OsUser;
    callerAppId: string;
    schema?: unknown;
  }) => Promise<string>;
}

export interface RpcHandler {
  handle(req: Request): Promise<Response>;
}

export function createRpcHandler(opts: RpcHandlerOpts): RpcHandler {
  const { registry, resolveUser } = opts;
  const agent =
    opts.agent ??
    (async (_a: {
      prompt: string;
      user: OsUser;
      callerAppId: string;
      schema?: unknown;
    }) => "");

  return {
    async handle(req: Request): Promise<Response> {
      const url = new URL(req.url);
      const path = url.pathname;

      if (req.method === "GET" && path === LIST_APPS_PATH) {
        const apps = registry.listApps().map(({ capabilities: _c, ...rest }) => rest);
        return json({ apps });
      }

      if (req.method === "GET" && path === LIST_CAPABILITIES_PATH) {
        return json({ capabilities: registry.listCapabilities() });
      }

      if (req.method === "POST" && path === RPC_PATH) {
        const callerAppId = req.headers.get("x-fluid-app-id");
        if (!callerAppId) {
          return errorResponse(400, "missing_caller", "x-fluid-app-id header required");
        }

        const user = await resolveUser(req);
        if (!user) {
          return errorResponse(401, "unauthenticated", "resolveUser returned null");
        }

        let body: RpcRequest;
        try {
          body = (await req.json()) as RpcRequest;
        } catch {
          return errorResponse(400, "invalid_body", "Body must be JSON { capability, input }");
        }
        if (!body?.capability) {
          return errorResponse(400, "missing_capability", "capability is required");
        }

        const resolved = registry.resolve(body.capability);
        if (!resolved) {
          return errorResponse(404, "unknown_capability", `Capability "${body.capability}" not found`);
        }

        const parsed = resolved.def.input.safeParse(body.input);
        if (!parsed.success) {
          return errorResponse(400, "invalid_input", parsed.error.message);
        }

        const ctx: CapabilityContext = {
          user,
          caller: { appId: callerAppId },
          call: async (fqid, input) => {
            const sub = registry.resolve(fqid);
            if (!sub) throw new Error(`Capability "${fqid}" not found`);
            const subInput = sub.def.input.parse(input);
            return (await sub.def.handler(subInput, { ...ctx, caller: { appId: resolved.app.id } })) as never;
          },
          agent: async (prompt, agentOpts) => {
            return agent({ prompt, user, callerAppId, schema: agentOpts?.schema });
          },
        };

        try {
          const output = await resolved.def.handler(parsed.data, ctx);
          return json<RpcResponse>({ ok: true, output });
        } catch (err) {
          return errorResponse(500, "handler_error", (err as Error).message);
        }
      }

      return new Response("Not Found", { status: 404 });
    },
  };
}

function json<T>(body: T, init?: ResponseInit): Response {
  return new Response(JSON.stringify(body), {
    ...init,
    headers: { "content-type": "application/json", ...(init?.headers ?? {}) },
  });
}

function errorResponse(status: number, code: string, message: string): Response {
  return json<RpcResponse>({ ok: false, error: { code, message } }, { status });
}
