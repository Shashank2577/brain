/**
 * Unit tests for the mobile-auth Nitro plugin (Phase 8 / ADR-006).
 *
 * Each test bypasses Nitro by invoking the h3 handler directly with a fake
 * event. The handler factory accepts a test-only `authForTests` override
 * that stands in for the real Better Auth instance, so we don't need to
 * boot Better Auth or touch a real database.
 */
import { describe, it, expect, vi } from "vitest";
import { buildMobileTokenHandler } from "./mobile-auth.js";
import { verifyMobileToken } from "../lib/mobile-token.js";

const SECRET = "mobile-auth-test-secret-7a3c9f1e8b2d4e6a";

/**
 * Construct a minimal H3-compatible event shim. Only the fields the handler
 * touches are filled in — method, headers (for readBody), and the response
 * status setter.
 */
function makeEvent(opts: {
  method?: string;
  body?: unknown;
}): { event: any; getStatus: () => number } {
  const headers = new Map<string, string>();
  let status = 200;
  const event = {
    node: {
      req: {
        method: opts.method ?? "POST",
        headers: {
          "content-type": "application/json",
        },
      },
      res: {
        statusCode: 200,
        setHeader: () => {},
      },
    },
    method: opts.method ?? "POST",
    headers: new Headers({
      "content-type": "application/json",
    }),
    _body: opts.body,
  };
  // h3 v2 helpers operate on the event; we stub the bits we need.
  (event as any).context = {};
  (event as any).path = "/_agent-native/auth/mobile-token";
  return {
    event,
    getStatus: () => {
      // h3 v2 stores status on the response object via `node.res.statusCode`.
      return event.node.res.statusCode;
    },
  };
}

// We use vi.mock to substitute h3's readBody / getMethod / setResponseStatus
// — these are imported by mobile-auth.ts and we can't otherwise control them
// without a Nitro server. Mocking the module here is cleaner than wiring up
// a real h3 app.
vi.mock("h3", async (importOriginal) => {
  const actual = await importOriginal<typeof import("h3")>();
  return {
    ...actual,
    defineEventHandler: (h: any) => h,
    getMethod: (event: any) => event.method ?? "POST",
    readBody: async (event: any) => event._body,
    setResponseStatus: (event: any, status: number) => {
      event.node.res.statusCode = status;
    },
  };
});

describe("buildMobileTokenHandler", () => {
  it("rejects non-POST methods with 405", async () => {
    const handler = buildMobileTokenHandler({
      authForTests: {
        api: {
          signInEmail: vi.fn(),
        },
      },
      secretForTests: SECRET,
    });
    const { event, getStatus } = makeEvent({ method: "GET" });
    const res: any = await handler(event);
    expect(getStatus()).toBe(405);
    expect(res.ok).toBe(false);
    expect(res.reason).toBe("method_not_allowed");
  });

  it("rejects missing credentials with 400", async () => {
    const handler = buildMobileTokenHandler({
      authForTests: {
        api: {
          signInEmail: vi.fn(),
        },
      },
      secretForTests: SECRET,
    });
    const { event, getStatus } = makeEvent({ body: { email: "alice@demo.local" } });
    const res: any = await handler(event);
    expect(getStatus()).toBe(400);
    expect(res.ok).toBe(false);
    expect(res.reason).toBe("missing_credentials");
  });

  it("rejects invalid body shape with 400", async () => {
    const handler = buildMobileTokenHandler({
      authForTests: {
        api: {
          signInEmail: vi.fn(),
        },
      },
      secretForTests: SECRET,
    });
    const { event, getStatus } = makeEvent({ body: null });
    const res: any = await handler(event);
    expect(getStatus()).toBe(400);
    expect(res.ok).toBe(false);
    expect(res.reason).toBe("invalid_body");
  });

  it("returns 401 when Better Auth rejects credentials (no token)", async () => {
    const signInEmail = vi.fn(async () => ({ token: undefined }));
    const handler = buildMobileTokenHandler({
      authForTests: { api: { signInEmail } },
      secretForTests: SECRET,
    });
    const { event, getStatus } = makeEvent({
      body: { email: "alice@demo.local", password: "wrong" },
    });
    const res: any = await handler(event);
    expect(getStatus()).toBe(401);
    expect(res.ok).toBe(false);
    expect(res.reason).toBe("invalid_credentials");
    expect(signInEmail).toHaveBeenCalledWith({
      body: { email: "alice@demo.local", password: "wrong" },
    });
  });

  it("returns 401 when Better Auth throws on bad credentials", async () => {
    const signInEmail = vi.fn(async () => {
      throw new Error("Invalid email or password");
    });
    const handler = buildMobileTokenHandler({
      authForTests: { api: { signInEmail } },
      secretForTests: SECRET,
    });
    const { event, getStatus } = makeEvent({
      body: { email: "alice@demo.local", password: "wrong" },
    });
    const res: any = await handler(event);
    expect(getStatus()).toBe(401);
    expect(res.ok).toBe(false);
    expect(res.reason).toBe("invalid_credentials");
  });

  it("mints a verifiable mobile JWT on successful sign-in", async () => {
    const signInEmail = vi.fn(async () => ({
      token: "better-auth-session-token",
      user: { id: "user_1" },
    }));
    const handler = buildMobileTokenHandler({
      authForTests: { api: { signInEmail } },
      secretForTests: SECRET,
    });
    const { event, getStatus } = makeEvent({
      body: {
        email: "alice@demo.local",
        password: "correct-horse-battery-staple",
        orgId: "org_42",
      },
    });
    const res: any = await handler(event);

    expect(getStatus()).toBe(200);
    expect(res.ok).toBe(true);
    expect(typeof res.token).toBe("string");
    expect(typeof res.expiresAt).toBe("number");
    expect(res.email).toBe("alice@demo.local");
    expect(res.orgId).toBe("org_42");

    // Token must verify against the same secret and carry the right claims.
    const verified = verifyMobileToken(res.token, SECRET);
    expect(verified.ok).toBe(true);
    if (verified.ok) {
      expect(verified.payload.email).toBe("alice@demo.local");
      expect(verified.payload.orgId).toBe("org_42");
      expect(verified.payload.scope).toBe("mobile");
    }
  });

  it("trims surrounding whitespace from the email", async () => {
    const signInEmail = vi.fn(async () => ({ token: "ba-token" }));
    const handler = buildMobileTokenHandler({
      authForTests: { api: { signInEmail } },
      secretForTests: SECRET,
    });
    const { event } = makeEvent({
      body: { email: "  alice@demo.local  ", password: "pw" },
    });
    const res: any = await handler(event);
    expect(res.ok).toBe(true);
    expect(res.email).toBe("alice@demo.local");
    expect(signInEmail).toHaveBeenCalledWith({
      body: { email: "alice@demo.local", password: "pw" },
    });
  });
});
