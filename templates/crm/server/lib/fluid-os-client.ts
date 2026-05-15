/**
 * Lightweight HTTP shim for calling other Fluid OS apps from inside the
 * standalone CRM template. The fluid-os RPC layer is one POST endpoint —
 * `/_fluid-os/rpc` (alias `/_fluid/rpc` historically) — that takes a
 * capability id + input and returns the same JSON shape the in-process
 * registry would.
 *
 * The template trusts an env-configured host (defaults to localhost) plus
 * a bearer token issued at boot. In a real workspace these resolve to the
 * same fluid-os host that owns the user's identity; here we make the dep
 * pluggable so tests can stub it without spinning up a server.
 */

import { RPC_PATH } from "@agent-native/fluid-os";

export type CrossAppCaller = <O = unknown>(
  capability: string,
  input: unknown,
) => Promise<O>;

const DEFAULT_HOST = process.env.FLUID_OS_URL ?? "http://localhost:4100";

export function makeRpcCaller(opts: {
  host?: string;
  token: string;
  callerAppId?: string;
}): CrossAppCaller {
  const host = opts.host ?? DEFAULT_HOST;
  const callerAppId = opts.callerAppId ?? "crm";

  return async <O = unknown>(capability: string, input: unknown): Promise<O> => {
    const res = await fetch(`${host}${RPC_PATH}`, {
      method: "POST",
      headers: {
        "content-type": "application/json",
        authorization: `Bearer ${opts.token}`,
        "x-fluid-app-id": callerAppId,
      },
      body: JSON.stringify({ capability, input }),
    });
    if (!res.ok) {
      const text = await res.text().catch(() => "");
      throw new Error(
        `fluid-os RPC call ${capability} failed: ${res.status} ${text}`,
      );
    }
    const body = (await res.json()) as { ok: boolean; output?: O; error?: { code: string; message: string } };
    if (!body.ok) {
      throw new Error(
        `fluid-os RPC call ${capability} returned error: ${body.error?.code} ${body.error?.message}`,
      );
    }
    return body.output as O;
  };
}

/**
 * Resolve a caller from the current request context. The template's
 * standalone-action surface only needs this when a write goes through
 * mail/calendar/notes/tasks; pure-CRM writes never call it.
 *
 * For now this throws unless `FLUID_OS_TOKEN` is set (workspace dev mode
 * pre-issues a session). Wiring up real per-user token mint will land
 * with Phase 5's identity work — see docs/delivery/phase-5-*.
 */
export function callerFromEnv(): CrossAppCaller {
  const token = process.env.FLUID_OS_TOKEN;
  if (!token) {
    throw new Error(
      "FLUID_OS_TOKEN not set — cannot make cross-app RPC call from standalone template. Run via the fluid-os host (or set FLUID_OS_TOKEN to a dev token).",
    );
  }
  return makeRpcCaller({ token });
}
