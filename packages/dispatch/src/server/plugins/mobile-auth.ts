/**
 * Mobile bearer-token sign-in endpoint (Phase 8 / ADR-006).
 *
 * Mounts `POST /_agent-native/auth/mobile-token` — the entrypoint the mobile
 * shell uses to exchange `{ email, password }` for a workspace JWT.
 *
 * The endpoint:
 *   1. Validates the request body shape (must be JSON, must include both
 *      fields, both non-empty strings).
 *   2. Calls Better Auth's `signInEmail` to verify the credentials. We
 *      reuse the same provider that owns the password hashes — no parallel
 *      credential store, no drift.
 *   3. On success, mints a stateless JWT via `signMobileToken` and returns
 *      `{ token, expiresAt }`. The mobile shell stores `token` in secure
 *      storage and attaches it as `Authorization: Bearer <token>` on every
 *      subsequent request.
 *   4. On failure, returns 401 with a generic `invalid_credentials` reason
 *      so we don't leak whether the email exists.
 *
 * Existing cookie auth is untouched. The capability-registry plugin layers
 * a bearer-JWT resolver in front of `getSession()` so requests carrying the
 * mobile JWT propagate identity into `runWithRequestContext` exactly like a
 * cookie request would. See `capability-registry.ts` for the resolver shim.
 */
import {
  awaitBootstrap,
  getH3App,
  getAuthSecret,
  getBetterAuth,
  type NitroPluginDef,
} from "@agent-native/core/server";
import {
  defineEventHandler,
  setResponseStatus,
  getMethod,
  readBody,
  type H3Event,
} from "h3";
import { signMobileToken } from "../lib/mobile-token.js";

const MOBILE_TOKEN_ROUTE = "/_agent-native/auth/mobile-token";

function jsonError(event: H3Event, status: number, reason: string) {
  setResponseStatus(event, status);
  return { ok: false, reason };
}

/**
 * Best-effort: read the user's active org id from Better Auth right after
 * sign-in. The framework attaches `activeOrganizationId` to the session row;
 * we don't fail the sign-in path if it isn't there yet (Better Auth fills it
 * lazily for users who haven't selected an org).
 */
async function resolveActiveOrgId(
  signInResult: { token?: string; user?: { id?: string } } | null,
): Promise<string | undefined> {
  if (!signInResult?.token) return undefined;
  try {
    const ba = await getBetterAuth();
    const session = await ba.api.getSession({
      headers: new Headers({ Authorization: `Bearer ${signInResult.token}` }),
    });
    return (
      (session?.session as { activeOrganizationId?: string } | undefined)
        ?.activeOrganizationId ?? undefined
    );
  } catch {
    return undefined;
  }
}

/**
 * Build the `POST /_agent-native/auth/mobile-token` handler. Test code can
 * pass an `auth` override so it does not need to spin up Better Auth.
 */
export function buildMobileTokenHandler(opts?: {
  authForTests?: {
    api: {
      signInEmail: (opts: {
        body: { email: string; password: string };
      }) => Promise<{ token?: string; user?: any } | null>;
      getSession?: (opts: { headers: Headers }) => Promise<any>;
    };
  };
  secretForTests?: string;
}) {
  return defineEventHandler(async (event) => {
    if (getMethod(event) !== "POST") {
      return jsonError(event, 405, "method_not_allowed");
    }

    let body:
      | { email?: unknown; password?: unknown; orgId?: unknown }
      | null
      | undefined;
    try {
      body = await readBody(event);
    } catch {
      return jsonError(event, 400, "invalid_body");
    }
    if (!body || typeof body !== "object") {
      return jsonError(event, 400, "invalid_body");
    }

    const email = typeof body.email === "string" ? body.email.trim() : "";
    const password =
      typeof body.password === "string" ? body.password : "";
    if (!email || !password) {
      return jsonError(event, 400, "missing_credentials");
    }

    // Verify credentials via Better Auth so we share the same password store
    // and rate-limiting as the cookie sign-in path. The test override lets the
    // unit test feed in a fake `signInEmail` without booting Better Auth.
    let result: { token?: string; user?: { id?: string } } | null = null;
    try {
      const auth = opts?.authForTests ?? (await getBetterAuth());
      result = await auth.api.signInEmail({
        body: { email, password },
      });
    } catch {
      // Better Auth throws on bad credentials. Surface as a generic 401 so we
      // don't leak whether the email exists.
      return jsonError(event, 401, "invalid_credentials");
    }
    if (!result?.token) {
      return jsonError(event, 401, "invalid_credentials");
    }

    // Mint the mobile JWT using the framework's signing secret. Sharing one
    // secret across cookie + mobile keeps key rotation simple.
    const secret = opts?.secretForTests ?? getAuthSecret();
    const orgId =
      typeof body.orgId === "string" && body.orgId.length > 0
        ? body.orgId
        : await resolveActiveOrgId(result);

    const { token, expiresAt } = signMobileToken(
      { email, orgId },
      secret,
    );

    return {
      ok: true as const,
      token,
      expiresAt,
      email,
      ...(orgId ? { orgId } : {}),
    };
  });
}

/**
 * Nitro plugin: mount the mobile-token sign-in route.
 */
const dispatchMobileAuthPlugin: NitroPluginDef = async (nitroApp: any) => {
  await awaitBootstrap(nitroApp);
  const h3App = getH3App(nitroApp);
  h3App.use(MOBILE_TOKEN_ROUTE, buildMobileTokenHandler());
};

export default dispatchMobileAuthPlugin;
