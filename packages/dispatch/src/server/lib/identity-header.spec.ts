import { describe, expect, it } from "vitest";
import {
  IdentityHeaderError,
  signIdentity,
  verifyIdentity,
} from "./identity-header.js";

const SECRET = "test-secret-aaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaa";

describe("identity-header", () => {
  it("signs and round-trips a basic identity", () => {
    const token = signIdentity({ userEmail: "alice@example.com" }, SECRET);
    const out = verifyIdentity(token, SECRET);
    expect(out.userEmail).toBe("alice@example.com");
    expect(out.orgId).toBeUndefined();
  });

  it("round-trips orgId when present", () => {
    const token = signIdentity(
      { userEmail: "bob@example.com", orgId: "org_123" },
      SECRET,
    );
    const out = verifyIdentity(token, SECRET);
    expect(out.userEmail).toBe("bob@example.com");
    expect(out.orgId).toBe("org_123");
  });

  it("rejects a token signed with a different secret", () => {
    const token = signIdentity({ userEmail: "x@y" }, SECRET);
    expect(() => verifyIdentity(token, "other-secret")).toThrow(
      IdentityHeaderError,
    );
    try {
      verifyIdentity(token, "other-secret");
    } catch (err) {
      expect((err as IdentityHeaderError).code).toBe("bad_signature");
    }
  });

  it("rejects an expired token", () => {
    const now = 1_000_000_000;
    const token = signIdentity({ userEmail: "exp@y" }, SECRET, {
      ttlSeconds: 10,
      nowSeconds: now,
    });
    // Verify well past expiry + leeway
    expect(() =>
      verifyIdentity(token, SECRET, { nowSeconds: now + 100 }),
    ).toThrow(/expired/);
  });

  it("honours leeway around exp", () => {
    const now = 1_000_000_000;
    const token = signIdentity({ userEmail: "lee@y" }, SECRET, {
      ttlSeconds: 10,
      nowSeconds: now,
    });
    // 2s past exp, within default 5s leeway
    expect(
      verifyIdentity(token, SECRET, { nowSeconds: now + 12 }).userEmail,
    ).toBe("lee@y");
  });

  it("rejects a malformed token", () => {
    expect(() => verifyIdentity("not.a.jwt.too.many", SECRET)).toThrow(/three/);
  });

  it("rejects a missing token", () => {
    expect(() => verifyIdentity(undefined, SECRET)).toThrow(/missing/);
  });

  it("rejects a tampered payload (signature mismatch)", () => {
    const token = signIdentity({ userEmail: "alice@y" }, SECRET);
    const [h, _p, sig] = token.split(".");
    const tampered = `${h}.eyJzdWIiOiJtYWxsb3J5QHkiLCJleHAiOjk5OTk5OTk5OTl9.${sig}`;
    expect(() => verifyIdentity(tampered, SECRET)).toThrow(/signature/);
  });

  it("refuses to sign without a userEmail", () => {
    expect(() =>
      signIdentity({ userEmail: "" } as { userEmail: string }, SECRET),
    ).toThrow(/userEmail/);
  });
});
