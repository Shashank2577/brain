/**
 * Unit tests for the mobile workspace bearer-token mint + verify (Phase 8).
 *
 * These tests are dependency-free — they exercise `signMobileToken` and
 * `verifyMobileToken` directly with a known secret. The plugin that uses
 * them is exercised separately.
 */
import { describe, it, expect } from "vitest";
import {
  signMobileToken,
  verifyMobileToken,
  extractBearerToken,
} from "./mobile-token.js";

const SECRET = "test-secret-9f3b8e2d6a1c0f4e7b5a8d3c2e1f0a9b";

describe("signMobileToken", () => {
  it("returns a three-part JWT and exposes the expiry in ms", () => {
    const before = Date.now();
    const { token, expiresAt } = signMobileToken(
      { email: "alice@demo.local" },
      SECRET,
    );

    expect(typeof token).toBe("string");
    expect(token.split(".")).toHaveLength(3);
    // Default TTL is 7 days. Allow a generous window (1 second) for clock skew.
    expect(expiresAt).toBeGreaterThan(before + 60 * 60 * 24 * 7 * 1000 - 1000);
    expect(expiresAt).toBeLessThan(before + 60 * 60 * 24 * 7 * 1000 + 5000);
  });

  it("encodes orgId in the payload when provided", () => {
    const { token } = signMobileToken(
      { email: "alice@demo.local", orgId: "org_42" },
      SECRET,
    );
    const result = verifyMobileToken(token, SECRET);
    expect(result.ok).toBe(true);
    if (result.ok) {
      expect(result.payload.orgId).toBe("org_42");
      expect(result.payload.email).toBe("alice@demo.local");
      expect(result.payload.sub).toBe("alice@demo.local");
      expect(result.payload.scope).toBe("mobile");
    }
  });

  it("respects a custom ttlSeconds override", () => {
    const ttlSeconds = 60; // 1 minute
    const before = Math.floor(Date.now() / 1000);
    const { token } = signMobileToken(
      { email: "alice@demo.local", ttlSeconds },
      SECRET,
    );
    const result = verifyMobileToken(token, SECRET);
    expect(result.ok).toBe(true);
    if (result.ok) {
      expect(result.payload.exp).toBeGreaterThanOrEqual(before + ttlSeconds);
      expect(result.payload.exp).toBeLessThan(before + ttlSeconds + 5);
    }
  });

  it("throws when called without a secret", () => {
    expect(() =>
      signMobileToken({ email: "alice@demo.local" }, ""),
    ).toThrowError(/secret/);
  });

  it("throws when email is missing", () => {
    expect(() => signMobileToken({ email: "" }, SECRET)).toThrowError(/email/);
  });
});

describe("verifyMobileToken", () => {
  it("returns the decoded payload for a token signed with the same secret", () => {
    const { token } = signMobileToken({ email: "alice@demo.local" }, SECRET);
    const result = verifyMobileToken(token, SECRET);
    expect(result.ok).toBe(true);
    if (result.ok) {
      expect(result.payload.email).toBe("alice@demo.local");
      expect(result.payload.scope).toBe("mobile");
    }
  });

  it("rejects a token signed with a different secret", () => {
    const { token } = signMobileToken({ email: "alice@demo.local" }, SECRET);
    const result = verifyMobileToken(token, "different-secret-7e8f");
    expect(result.ok).toBe(false);
    if (!result.ok) expect(result.reason).toBe("bad_signature");
  });

  it("rejects a malformed token (not 3 parts)", () => {
    const result = verifyMobileToken("foo.bar", SECRET);
    expect(result.ok).toBe(false);
    if (!result.ok) expect(result.reason).toBe("malformed");
  });

  it("rejects an empty token", () => {
    const result = verifyMobileToken("", SECRET);
    expect(result.ok).toBe(false);
    if (!result.ok) expect(result.reason).toBe("missing_token");
  });

  it("rejects a token with a tampered payload", () => {
    const { token } = signMobileToken({ email: "alice@demo.local" }, SECRET);
    const [headerB64, , sigB64] = token.split(".");
    // Replace payload with a forged one that claims a different email.
    const forged = Buffer.from(
      JSON.stringify({
        iss: "agent-native/dispatch",
        sub: "mallory@evil.test",
        email: "mallory@evil.test",
        iat: Math.floor(Date.now() / 1000),
        exp: Math.floor(Date.now() / 1000) + 3600,
        scope: "mobile",
      }),
    )
      .toString("base64")
      .replace(/\+/g, "-")
      .replace(/\//g, "_")
      .replace(/=+$/g, "");
    const tampered = `${headerB64}.${forged}.${sigB64}`;
    const result = verifyMobileToken(tampered, SECRET);
    expect(result.ok).toBe(false);
    if (!result.ok) expect(result.reason).toBe("bad_signature");
  });

  it("rejects a token with alg=none (defends against unsigned-JWT trick)", () => {
    const headerB64 = Buffer.from(JSON.stringify({ alg: "none", typ: "JWT" }))
      .toString("base64")
      .replace(/\+/g, "-")
      .replace(/\//g, "_")
      .replace(/=+$/g, "");
    const payloadB64 = Buffer.from(
      JSON.stringify({
        iss: "agent-native/dispatch",
        sub: "mallory@evil.test",
        email: "mallory@evil.test",
        iat: Math.floor(Date.now() / 1000),
        exp: Math.floor(Date.now() / 1000) + 3600,
        scope: "mobile",
      }),
    )
      .toString("base64")
      .replace(/\+/g, "-")
      .replace(/\//g, "_")
      .replace(/=+$/g, "");
    const forged = `${headerB64}.${payloadB64}.`;
    const result = verifyMobileToken(forged, SECRET);
    expect(result.ok).toBe(false);
    if (!result.ok) {
      // Either bad_alg (header parsed first) or bad_signature — both reject.
      expect(["bad_alg", "bad_signature", "malformed"]).toContain(
        result.reason,
      );
    }
  });

  it("rejects an expired token", () => {
    const { token } = signMobileToken(
      { email: "alice@demo.local", ttlSeconds: -10 },
      SECRET,
    );
    const result = verifyMobileToken(token, SECRET);
    expect(result.ok).toBe(false);
    if (!result.ok) expect(result.reason).toBe("expired");
  });

  it("rejects a token without the mobile scope", () => {
    // Hand-craft a token with a different scope but a valid signature.
    const headerB64 = Buffer.from(JSON.stringify({ alg: "HS256", typ: "JWT" }))
      .toString("base64")
      .replace(/\+/g, "-")
      .replace(/\//g, "_")
      .replace(/=+$/g, "");
    const payload = {
      iss: "agent-native/dispatch",
      sub: "alice@demo.local",
      email: "alice@demo.local",
      iat: Math.floor(Date.now() / 1000),
      exp: Math.floor(Date.now() / 1000) + 3600,
      scope: "desktop", // wrong scope
    };
    const payloadB64 = Buffer.from(JSON.stringify(payload))
      .toString("base64")
      .replace(/\+/g, "-")
      .replace(/\//g, "_")
      .replace(/=+$/g, "");
    const crypto = require("node:crypto");
    const sigB64 = crypto
      .createHmac("sha256", SECRET)
      .update(`${headerB64}.${payloadB64}`)
      .digest("base64")
      .replace(/\+/g, "-")
      .replace(/\//g, "_")
      .replace(/=+$/g, "");
    const token = `${headerB64}.${payloadB64}.${sigB64}`;
    const result = verifyMobileToken(token, SECRET);
    expect(result.ok).toBe(false);
    if (!result.ok) expect(result.reason).toBe("bad_scope");
  });
});

describe("extractBearerToken", () => {
  it("extracts the token after a `Bearer ` prefix", () => {
    expect(extractBearerToken("Bearer abc.def.ghi")).toBe("abc.def.ghi");
  });
  it("is case-insensitive on the scheme", () => {
    expect(extractBearerToken("bearer xyz")).toBe("xyz");
    expect(extractBearerToken("BEARER xyz")).toBe("xyz");
  });
  it("trims surrounding whitespace", () => {
    expect(extractBearerToken("  Bearer   xyz  ")).toBe("xyz");
  });
  it("returns undefined when the header is absent or not Bearer", () => {
    expect(extractBearerToken(undefined)).toBeUndefined();
    expect(extractBearerToken(null)).toBeUndefined();
    expect(extractBearerToken("")).toBeUndefined();
    expect(extractBearerToken("Basic foo:bar")).toBeUndefined();
  });
});
