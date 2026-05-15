import type { AppManifest, CapabilityEntry } from "../manifest/types.js";
import {
  LIST_APPS_PATH,
  LIST_CAPABILITIES_PATH,
  RPC_PATH,
  type RpcResponse,
} from "./protocol.js";

export interface OsClientOpts {
  osUrl: string;
  appId: string;
  getToken: () => Promise<string> | string;
  fetchImpl?: typeof fetch;
}

export interface OsClient {
  call<O = unknown>(capability: string, input?: unknown): Promise<O>;
  listApps(): Promise<Omit<AppManifest, "capabilities">[]>;
  listCapabilities(): Promise<CapabilityEntry[]>;
}

export function createOsClient(opts: OsClientOpts): OsClient {
  const fetchFn = opts.fetchImpl ?? fetch;
  const base = opts.osUrl.replace(/\/$/, "");

  const auth = async () => ({
    authorization: `Bearer ${await opts.getToken()}`,
    "x-fluid-app-id": opts.appId,
  });

  return {
    async call<O>(capability: string, input?: unknown): Promise<O> {
      const headers = await auth();
      const res = await fetchFn(base + RPC_PATH, {
        method: "POST",
        headers: { ...headers, "content-type": "application/json" },
        body: JSON.stringify({ capability, input }),
      });
      const body = (await res.json()) as RpcResponse<O>;
      if (!body.ok) {
        throw new RpcError(body.error.code, body.error.message);
      }
      return body.output;
    },

    async listApps() {
      const res = await fetchFn(base + LIST_APPS_PATH);
      const body = (await res.json()) as { apps: Omit<AppManifest, "capabilities">[] };
      return body.apps;
    },

    async listCapabilities() {
      const res = await fetchFn(base + LIST_CAPABILITIES_PATH);
      const body = (await res.json()) as { capabilities: CapabilityEntry[] };
      return body.capabilities;
    },
  };
}

export class RpcError extends Error {
  constructor(public code: string, message: string) {
    super(message);
    this.name = "RpcError";
  }
}
