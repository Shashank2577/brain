import type { IdentityProvider } from "../identity/session.js";
import type { CapabilityRegistry } from "../registry.js";
import type { CapabilityContext } from "../manifest/types.js";
import type { AgentClient } from "../agent/client.js";
import { StubAgentClient } from "../agent/client.js";
import {
  LIST_APPS_PATH,
  LIST_CAPABILITIES_PATH,
  RPC_PATH,
  type RpcRequest,
  type RpcResponse,
} from "./protocol.js";

export interface RpcHandlerOpts {
  registry: CapabilityRegistry;
  identity: IdentityProvider;
  osAppId?: string;
  agent?: AgentClient;
}

export interface RpcHandler {
  handle(req: Request): Promise<Response>;
}

export function createRpcHandler(opts: RpcHandlerOpts): RpcHandler {
  const { registry, identity } = opts;
  const osAppId = opts.osAppId ?? "fluid-os";
  const agent: AgentClient = opts.agent ?? new StubAgentClient();

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
        const auth = req.headers.get("authorization") ?? "";
        const match = auth.match(/^Bearer (.+)$/);
        if (!match) return errorResponse(401, "missing_token", "Authorization Bearer token required");

        const callerAppId = req.headers.get("x-fluid-app-id");
        if (!callerAppId) return errorResponse(400, "missing_caller", "x-fluid-app-id header required");

        let claims;
        try {
          claims = await identity.verify(match[1], { audienceAppId: osAppId });
        } catch (err) {
          return errorResponse(401, "invalid_token", (err as Error).message);
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

        const user = identity.toUser(claims);
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
            return agent.ask({ prompt, user, callerAppId, schema: agentOpts?.schema });
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
