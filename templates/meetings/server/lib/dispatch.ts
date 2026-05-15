/**
 * Cross-app capability dispatch helper.
 *
 * Uses the Phase 1 capability registry via `@agent-native/dispatch/server`.
 * Identity propagates through `runWithRequestContext` so the called action
 * sees the original caller, not the meetings app.
 *
 * In tests, a `globalThis.__meetingsCallOtherApp` hook short-circuits the
 * dispatch so unit tests don't need the registry wired up.
 */
import {
  getRequestUserEmail,
  getRequestOrgId,
} from "@agent-native/core/server/request-context";

export interface DispatchResult {
  ok: boolean;
  output?: unknown;
  error?: { message: string };
}

/**
 * Dispatch a capability by FQID. Returns the action's output (or null on
 * failure). The caller's identity is propagated via `runWithRequestContext`
 * inside `dispatchCapability`.
 *
 * Failures are surfaced as `null` so callers can degrade gracefully.
 */
export async function dispatchCrossApp(
  fqid: string,
  input: unknown,
): Promise<unknown> {
  // Test hook — short-circuit when set so unit tests can stub.
  const hook = (globalThis as any).__meetingsCallOtherApp;
  if (typeof hook === "function") {
    return await hook(fqid, input);
  }

  try {
    const dispatchMod = await import("@agent-native/dispatch/server");
    const registry = (dispatchMod as any).getCapabilityRegistry?.();
    if (!registry) {
      console.warn(
        `[meetings] capability registry not available; ${fqid} returned null`,
      );
      return null;
    }
    const userEmail = getRequestUserEmail();
    const orgId = getRequestOrgId();
    if (!userEmail) {
      throw new Error("no authenticated user for cross-app dispatch");
    }
    const result: DispatchResult = await (dispatchMod as any).dispatchCapability(
      {
        registry,
        fqid,
        input,
        user: {
          id: userEmail,
          email: userEmail,
          orgId: orgId ?? undefined,
        },
      },
    );
    if (!result.ok) {
      console.warn(
        `[meetings] ${fqid} failed: ${result.error?.message ?? "unknown"}`,
      );
      return null;
    }
    return result.output;
  } catch (err) {
    console.warn(
      `[meetings] dispatch to ${fqid} threw: ${
        err instanceof Error ? err.message : String(err)
      }`,
    );
    return null;
  }
}
