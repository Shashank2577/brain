/**
 * Workspace bearer-token (JWT) mint + verify for the mobile shell.
 *
 * Phase 8 (ADR-006) introduced a mobile shell that talks to dispatch from
 * outside a browser cookie jar. Cookies do not propagate cleanly into a
 * `react-native-webview` session, so the mobile shell exchanges email +
 * password for a short-lived JWT and attaches it as `Authorization: Bearer`
 * on every subsequent request.
 *
 * Token shape (compact, three-part): `<headerB64>.<payloadB64>.<sigB64>`
 *   header  = `{ "alg": "HS256", "typ": "JWT" }`
 *   payload = `{ iss, sub, email, orgId?, iat, exp, scope: "mobile" }`
 *   sig     = base64url(HMAC-SHA256(header + "." + payload, secret))
 *
 * The same secret used by Better Auth signs the JWT (`BETTER_AUTH_SECRET`).
 *
 * Lives in core (not dispatch) so `getSession()` in `core/server/auth.ts`
 * can verify the JWT BEFORE the framework's global 401 guard fires. The
 * previous home for this code was `packages/dispatch/src/server/lib/`,
 * which left the bearer-JWT resolver running too late in the request
 * lifecycle — the auth guard 401'd every mobile request before dispatch
 * had a chance to resolve the token. Dispatch re-exports these symbols
 * for backward compatibility.
 *
 * Tokens are stateless. They do NOT live in the `session` table. Revocation
 * is implicit (short TTL — default 7 days) and explicit (sign in again from
 * the mobile app to mint a fresh token). For tighter revocation the v2 path
 * would mirror to the existing `sessions` table; v1 keeps it stateless.
 */

import crypto from "node:crypto";

/** Token type — only "mobile" today, but the field reserves room for tablet/watch shells. */
export type MobileTokenScope = "mobile";

/** Claims captured in the signed payload. */
export interface MobileTokenClaims {
  /** User's workspace email (the primary identity key — see auth.ts). */
  email: string;
  /** Active organization id, if any. */
  orgId?: string;
  /**
   * Token TTL in seconds. Defaults to 7 days. The mobile shell stores the
   * resulting token in secure storage and re-mints on 401.
   */
  ttlSeconds?: number;
  /** Issuer string baked into the payload — defaults to "agent-native/dispatch". */
  issuer?: string;
}

/** Decoded payload (what verify returns). */
export interface DecodedMobileTokenPayload {
  iss: string;
  sub: string;
  email: string;
  orgId?: string;
  iat: number;
  exp: number;
  scope: MobileTokenScope;
}

/** Discriminated union: `ok:true` carries the payload, `ok:false` a reason. */
export type MobileTokenVerifyResult =
  | { ok: true; payload: DecodedMobileTokenPayload }
  | { ok: false; reason: string };

const DEFAULT_TTL_SECONDS = 60 * 60 * 24 * 7; // 7 days
const DEFAULT_ISSUER = "agent-native/dispatch";

function base64UrlEncode(buf: Buffer | string): string {
  const b = typeof buf === "string" ? Buffer.from(buf, "utf8") : buf;
  return b
    .toString("base64")
    .replace(/\+/g, "-")
    .replace(/\//g, "_")
    .replace(/=+$/g, "");
}

function base64UrlDecode(s: string): Buffer {
  const padded = s + "=".repeat((4 - (s.length % 4)) % 4);
  return Buffer.from(padded.replace(/-/g, "+").replace(/_/g, "/"), "base64");
}

/**
 * Mint a workspace bearer JWT for the mobile shell. The caller must already
 * have authenticated the user via Better Auth's `signInEmail` (or another
 * trusted path); this function only signs the resulting identity claim.
 *
 * @param claims  identity + TTL
 * @param secret  HMAC signing key (typically `BETTER_AUTH_SECRET`)
 */
export function signMobileToken(
  claims: MobileTokenClaims,
  secret: string,
): { token: string; expiresAt: number } {
  if (!secret) {
    throw new Error(
      "[mobile-token] Cannot sign without a secret. Pass BETTER_AUTH_SECRET.",
    );
  }
  if (!claims.email) {
    throw new Error("[mobile-token] claims.email is required");
  }

  const now = Math.floor(Date.now() / 1000);
  const ttl = claims.ttlSeconds ?? DEFAULT_TTL_SECONDS;
  const exp = now + ttl;

  const header = { alg: "HS256", typ: "JWT" };
  const payload: DecodedMobileTokenPayload = {
    iss: claims.issuer ?? DEFAULT_ISSUER,
    sub: claims.email,
    email: claims.email,
    iat: now,
    exp,
    scope: "mobile",
  };
  if (claims.orgId) payload.orgId = claims.orgId;

  const headerB64 = base64UrlEncode(JSON.stringify(header));
  const payloadB64 = base64UrlEncode(JSON.stringify(payload));
  const sigInput = `${headerB64}.${payloadB64}`;
  const sig = base64UrlEncode(
    crypto.createHmac("sha256", secret).update(sigInput).digest(),
  );

  return { token: `${sigInput}.${sig}`, expiresAt: exp * 1000 };
}

/**
 * Verify a mobile bearer JWT. Returns the decoded payload on success.
 *
 * Validation:
 *  - Token shape: three segments separated by `.`
 *  - HS256 signature matches via constant-time comparison
 *  - `scope === "mobile"` (so we don't accept a non-mobile JWT here)
 *  - `exp` is in the future
 *  - `email` is present
 *
 * Reasons are surfaced for server-side logging; never echo them to clients.
 */
export function verifyMobileToken(
  token: string,
  secret: string,
): MobileTokenVerifyResult {
  if (!token || typeof token !== "string") {
    return { ok: false, reason: "missing_token" };
  }
  if (!secret) {
    return { ok: false, reason: "missing_secret" };
  }

  const parts = token.split(".");
  if (parts.length !== 3) return { ok: false, reason: "malformed" };
  const [headerB64, payloadB64, sigB64] = parts;
  if (!headerB64 || !payloadB64 || !sigB64) {
    return { ok: false, reason: "malformed" };
  }

  // Validate header.alg first — defends against alg=none.
  let header: { alg?: string; typ?: string };
  try {
    header = JSON.parse(base64UrlDecode(headerB64).toString("utf8"));
  } catch {
    return { ok: false, reason: "bad_header" };
  }
  if (header.alg !== "HS256") return { ok: false, reason: "bad_alg" };

  const expected = base64UrlEncode(
    crypto
      .createHmac("sha256", secret)
      .update(`${headerB64}.${payloadB64}`)
      .digest(),
  );

  // Constant-time compare with a length guard so timingSafeEqual never throws.
  const sigBuf = Buffer.from(sigB64, "utf8");
  const expBuf = Buffer.from(expected, "utf8");
  if (sigBuf.length !== expBuf.length) {
    crypto.timingSafeEqual(expBuf, expBuf); // burn ~equal cycles
    return { ok: false, reason: "bad_signature" };
  }
  if (!crypto.timingSafeEqual(sigBuf, expBuf)) {
    return { ok: false, reason: "bad_signature" };
  }

  let payload: DecodedMobileTokenPayload;
  try {
    payload = JSON.parse(base64UrlDecode(payloadB64).toString("utf8"));
  } catch {
    return { ok: false, reason: "bad_payload" };
  }

  if (payload.scope !== "mobile") return { ok: false, reason: "bad_scope" };
  if (typeof payload.exp !== "number") return { ok: false, reason: "bad_exp" };
  if (payload.exp * 1000 < Date.now()) return { ok: false, reason: "expired" };
  if (!payload.email || typeof payload.email !== "string") {
    return { ok: false, reason: "missing_email" };
  }

  return { ok: true, payload };
}

/**
 * Extract a bearer JWT from an Authorization header. Case-insensitive match
 * on the `Bearer` prefix. Returns `undefined` when the header is absent or
 * not a Bearer scheme.
 */
export function extractBearerToken(
  authorizationHeader: string | null | undefined,
): string | undefined {
  if (!authorizationHeader) return undefined;
  const m = /^Bearer\s+(.+)$/i.exec(authorizationHeader.trim());
  return m?.[1]?.trim() || undefined;
}
