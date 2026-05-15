import { CapabilityRegistry } from "../registry.js";
import { IdentityProvider } from "../identity/session.js";
import { createRpcHandler } from "../rpc/server.js";
import type { AppManifest, OsUser } from "../manifest/types.js";
import {
  LIST_APPS_PATH,
  LIST_CAPABILITIES_PATH,
  RPC_PATH,
} from "../rpc/protocol.js";

export interface FluidOsOpts {
  secret: string;
  issuer?: string;
  osAppId?: string;
}

export class FluidOs {
  readonly registry: CapabilityRegistry;
  readonly identity: IdentityProvider;
  readonly osAppId: string;
  private rpc: ReturnType<typeof createRpcHandler>;

  constructor(opts: FluidOsOpts) {
    this.registry = new CapabilityRegistry();
    this.identity = new IdentityProvider({ secret: opts.secret, issuer: opts.issuer });
    this.osAppId = opts.osAppId ?? "fluid-os";
    this.rpc = createRpcHandler({
      registry: this.registry,
      identity: this.identity,
      osAppId: this.osAppId,
    });
  }

  install(manifest: AppManifest): void {
    this.registry.register(manifest);
  }

  issueSession(user: OsUser, opts?: { appId?: string; ttlSeconds?: number; scope?: string[] }): Promise<string> {
    return this.identity.sign(user, {
      audienceAppId: opts?.appId ?? this.osAppId,
      ttlSeconds: opts?.ttlSeconds,
      scope: opts?.scope,
    });
  }

  handle(req: Request): Promise<Response> {
    return this.rpc.handle(req);
  }

  routes(): { rpc: string; apps: string; capabilities: string } {
    return {
      rpc: RPC_PATH,
      apps: LIST_APPS_PATH,
      capabilities: LIST_CAPABILITIES_PATH,
    };
  }
}
