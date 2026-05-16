/**
 * Short-TTL signed identity header for the dispatch RPC broker (Item A3).
 *
 * The broker route `/_agent-native/rpc/dispatch` is the only path cross-app
 * `ctx.call(...)` takes when the target capability is owned by a different
 * mini-app. Workers (e.g. tasks) sign a tiny envelope carrying ONLY the
 * acting user's identity (email + optional orgId) and POST it as
 * `x-fluid-identity`. Dispatch verifies the signature, drops the header into
 * `runWithRequestContext`, and the target capability sees the **user**, not
 * the calling app — that's the load-bearing security invariant from CLAUDE.md.
 *
 * Format: `<base64url(header)>.<base64url(payload)>.<base64url(sig)>`
 *   header  = { alg: "HS256", typ: "FID" }
 *   payload = { sub: userEmail, org?: orgId, exp: <unix-seconds> }
 *   sig     = HMAC-SHA256(`${header}.${payload}`, BETTER_AUTH_SECRET)
 *
 * No new npm dep — uses node:crypto only.
 */
import { createHmac, timingSafeEqual } from "node:crypto";

const HEADER = { alg: "HS256", typ: "FID" } as const;

export interface Identity {
  userEmail: string;
  orgId?: string | undefined;
}

export interface SignOpts {
  /** TTL in seconds. Defaults to 30s. */
  ttlSeconds?: number;
  /** Override the current time (seconds since epoch) — tests only. */
  nowSeconds?: number;
}

function b64url(buf: Buffer | string): string {
  const b = typeof buf === "string" ? Buffer.from(buf, "utf8") : buf;
  return b
    .toString("base64")
    .replace(/=+$/g, "")
    .replace(/\+/g, "-")
    .replace(/\//g, "_");
}

function b64urlDecode(s: string): Buffer {
  const pad = s.length % 4 === 0 ? "" : "=".repeat(4 - (s.length % 4));
  const normalized = s.replace(/-/g, "+").replace(/_/g, "/") + pad;
  return Buffer.from(normalized, "base64");
}

function hmac(secret: string, data: string): Buffer {
  return createHmac("sha256", secret).update(data).digest();
}

/**
 * Sign an identity envelope. Throws if `userEmail` is missing — the broker
 * route should reject the call earlier, but defence-in-depth.
 */
export function signIdentity(
  identity: Identity,
  secret: string,
  opts: SignOpts = {},
): string {
  if (!identity.userEmail || typeof identity.userEmail !== "string") {
    throw new Error("signIdentity: userEmail is required");
  }
  if (!secret) {
    throw new Error("signIdentity: secret is required");
  }
  const ttl = opts.ttlSeconds ?? 30;
  const now = opts.nowSeconds ?? Math.floor(Date.now() / 1000);
  const payload: { sub: string; org?: string; exp: number } = {
    sub: identity.userEmail,
    exp: now + ttl,
  };
  if (identity.orgId) payload.org = identity.orgId;

  const h = b64url(JSON.stringify(HEADER));
  const p = b64url(JSON.stringify(payload));
  const sig = b64url(hmac(secret, `${h}.${p}`));
  return `${h}.${p}.${sig}`;
}

export class IdentityHeaderError extends Error {
  constructor(
    public code:
      | "missing"
      | "malformed"
      | "bad_signature"
      | "expired"
      | "bad_payload",
    message: string,
  ) {
    super(message);
    this.name = "IdentityHeaderError";
  }
}

export interface VerifyOpts {
  /** Override the current time (seconds since epoch) — tests only. */
  nowSeconds?: number;
  /** Allowed clock skew in seconds (default 5). */
  leewaySeconds?: number;
}

/**
 * Verify a signed identity header. Throws `IdentityHeaderError` with a
 * machine-readable `code` on any failure.
 */
export function verifyIdentity(
  headerValue: string | undefined | null,
  secret: string,
  opts: VerifyOpts = {},
): Identity {
  if (!headerValue) {
    throw new IdentityHeaderError("missing", "identity header missing");
  }
  if (!secret) {
    throw new IdentityHeaderError("bad_signature", "no secret configured");
  }
  const parts = headerValue.split(".");
  if (parts.length !== 3) {
    throw new IdentityHeaderError("malformed", "expected three segments");
  }
  const [h, p, sig] = parts;
  const expected = hmac(secret, `${h}.${p}`);
  const actual = b64urlDecode(sig!);
  if (expected.length !== actual.length || !timingSafeEqual(expected, actual)) {
    throw new IdentityHeaderError("bad_signature", "signature mismatch");
  }

  let payload: { sub?: unknown; org?: unknown; exp?: unknown };
  try {
    payload = JSON.parse(b64urlDecode(p!).toString("utf8"));
  } catch {
    throw new IdentityHeaderError("malformed", "payload not JSON");
  }
  const sub = payload.sub;
  const exp = payload.exp;
  const org = payload.org;
  if (typeof sub !== "string" || !sub) {
    throw new IdentityHeaderError("bad_payload", "sub (userEmail) missing");
  }
  if (typeof exp !== "number") {
    throw new IdentityHeaderError("bad_payload", "exp missing");
  }
  const now = opts.nowSeconds ?? Math.floor(Date.now() / 1000);
  const leeway = opts.leewaySeconds ?? 5;
  if (exp + leeway < now) {
    throw new IdentityHeaderError("expired", "identity header expired");
  }
  const identity: Identity = { userEmail: sub };
  if (typeof org === "string" && org) identity.orgId = org;
  return identity;
}

/** Header name (case-insensitive on the wire). */
export const IDENTITY_HEADER_NAME = "x-fluid-identity" as const;
