/**
 * `ctx.call(fqid, input)` for cross-app capability invocation (Item A3).
 *
 * Routing decision:
 *   - If the current process IS dispatch AND the target FQID is locally
 *     registered → run the capability in-process (zero hop, preserves the
 *     existing 33+ in-process tests).
 *   - Otherwise → POST to the dispatch broker at `DISPATCH_URL`, with a
 *     short-TTL signed identity header carrying ONLY the acting user's
 *     `{ userEmail, orgId }`. The header is signed here using
 *     `BETTER_AUTH_SECRET` via `getAuthSecret()` — no new secret.
 *
 * Identity propagation (CLAUDE.md, load-bearing rule): the propagated
 * identity is the **end user's**, never the calling app's. The current
 * user is read from the ALS scope set up by `runWithRequestContext`
 * (`getRequestUserEmail()` / `getRequestOrgId()`); we never read or
 * forward any "caller app id".
 *
 * Public surface:
 *
 *   callCapability("notes.create-note", { title })
 *     → fast path (in-process) when running inside dispatch and notes is local
 *     → HTTP (callViaDispatch) otherwise
 *
 * This module deliberately avoids importing dispatch at the top level so
 * a non-dispatch worker can use it without pulling the dispatch bundle.
 * The in-process fast path uses a dynamic import that no-ops in non-dispatch
 * processes.
 */
import { getAuthSecret } from "./better-auth-instance.js";
import { signIdentity } from "./identity-header.js";
import { getRequestOrgId, getRequestUserEmail } from "./request-context.js";
import { callViaDispatch, RpcError } from "./rpc-client.js";

/**
 * Resolved environment we run in. Computed once per call so tests can mutate
 * `process.env.DISPATCH_URL` between invocations.
 */
interface RouteEnv {
  dispatchUrl: string | undefined;
  /**
   * Whether THIS process is the dispatch worker. Detected via dynamic import
   * of `@agent-native/dispatch/server` + presence of the live registry.
   * Falsy in workers that don't have dispatch installed.
   */
  isDispatch: boolean;
  /**
   * Lazily-imported `dispatchCapability` for the in-process fast path. Only
   * present when `isDispatch` is true.
   */
  dispatch?: typeof import("@agent-native/dispatch/server");
}

let cachedEnv: RouteEnv | null = null;

/**
 * Detect whether we're running inside the dispatch worker. We dynamic-import
 * `@agent-native/dispatch/server` and treat the presence of a live registry
 * (via `getCapabilityRegistry()`) as the signal — exactly the same check the
 * legacy tasks template already used.
 *
 * If dispatch is not installed in this worker, the import throws and we
 * resolve to `{ isDispatch: false }`. We cache the result so the dynamic
 * import only happens once per process.
 */
async function resolveEnv(): Promise<RouteEnv> {
  if (cachedEnv) return cachedEnv;
  const dispatchUrl =
    process.env.DISPATCH_URL || process.env.FLUID_DISPATCH_URL;
  // We only attempt the dynamic import of `@agent-native/dispatch/server`
  // when the caller has explicitly opted in via `FLUID_IS_DISPATCH=1` (set
  // by dispatch's own boot path) — otherwise importing the dispatch bundle
  // in a non-dispatch worker would run all of its side-effect registrations
  // for nothing. Tests that need the fast path set this env explicitly.
  const isDispatchHint =
    process.env.FLUID_IS_DISPATCH === "1" ||
    process.env.FLUID_IS_DISPATCH === "true";
  if (!isDispatchHint) {
    cachedEnv = { dispatchUrl, isDispatch: false };
    return cachedEnv;
  }
  try {
    const mod = await import("@agent-native/dispatch/server");
    const registry = mod.getCapabilityRegistry?.();
    const isDispatch = !!registry;
    cachedEnv = {
      dispatchUrl,
      isDispatch,
      dispatch: isDispatch ? mod : undefined,
    };
  } catch {
    cachedEnv = { dispatchUrl, isDispatch: false };
  }
  return cachedEnv;
}

/**
 * Reset the cached routing env. Tests only.
 * @internal
 */
export function __resetCallCapabilityEnv(): void {
  cachedEnv = null;
}

export interface CallCapabilityOpts {
  /** Override DISPATCH_URL for this call (tests / explicit routing). */
  dispatchUrl?: string;
  /** Override the BETTER_AUTH_SECRET resolution (tests). */
  secret?: string;
  /** Override the userEmail (defaults to the ALS scope). */
  userEmail?: string;
  /** Override the orgId (defaults to the ALS scope). */
  orgId?: string;
  /** Override the HTTP fetcher (tests). */
  fetchImpl?: typeof fetch;
  /** Override the request timeout. */
  timeoutMs?: number;
}

/**
 * Invoke a capability by fully-qualified id (`<app>.<capability>`). Returns
 * the capability's output on success; throws `RpcError` (HTTP path) or
 * the capability's own error (in-process path) on failure.
 */
export async function callCapability<T = unknown>(
  fqid: string,
  input: unknown,
  opts: CallCapabilityOpts = {},
): Promise<T> {
  const env = await resolveEnv();

  const userEmail = opts.userEmail ?? getRequestUserEmail();
  const orgId = opts.orgId ?? getRequestOrgId();

  // Fast path: we ARE dispatch AND the target is registered locally.
  if (env.isDispatch && env.dispatch) {
    const registry = env.dispatch.getCapabilityRegistry();
    if (registry?.resolve(fqid)) {
      const result = await env.dispatch.dispatchCapability({
        registry,
        fqid,
        input,
        user: {
          id: userEmail ?? "anonymous",
          email: userEmail ?? "anonymous",
          orgId: orgId ?? undefined,
        },
      });
      if (result.ok === false) {
        throw new RpcError(
          { code: result.error.code, message: result.error.message, fqid },
          fqid,
          result.error.code === "unknown_capability" ? 404 : 500,
        );
      }
      return result.output as T;
    }
    // Fall through to HTTP if FQID isn't local. Dispatch normally owns every
    // capability, but in tests / edge configs a sibling worker may host one.
  }

  // HTTP path. Requires DISPATCH_URL + an authenticated user (we never sign
  // a header without a real user; that's the load-bearing identity rule).
  const dispatchUrl = opts.dispatchUrl ?? env.dispatchUrl;
  if (!dispatchUrl) {
    throw new RpcError(
      {
        code: "no_dispatch_url",
        message:
          "DISPATCH_URL is not set; cross-app ctx.call requires the dispatch broker",
        fqid,
      },
      fqid,
      500,
    );
  }
  if (!userEmail) {
    throw new RpcError(
      {
        code: "no_identity",
        message: "ctx.call has no authenticated user to propagate",
        fqid,
      },
      fqid,
      401,
    );
  }
  const secret = opts.secret ?? getAuthSecret();
  const identityHeader = signIdentity(
    { userEmail, orgId: orgId ?? undefined },
    secret,
  );
  return callViaDispatch<T>(fqid, input, {
    identityHeader,
    dispatchUrl,
    fetchImpl: opts.fetchImpl,
    timeoutMs: opts.timeoutMs,
  });
}
