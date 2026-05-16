import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { callCapability, __resetCallCapabilityEnv } from "./ctx.js";
import { runWithRequestContext } from "./request-context.js";

const ENV_KEYS = [
  "BETTER_AUTH_SECRET",
  "DISPATCH_URL",
  "FLUID_DISPATCH_URL",
] as const;
const savedEnv: Record<string, string | undefined> = {};

beforeEach(() => {
  for (const k of ENV_KEYS) savedEnv[k] = process.env[k];
  __resetCallCapabilityEnv();
  process.env.BETTER_AUTH_SECRET = "ctx-spec-secret-aaaaaaaaaaaaaaaaaaaaaaaa";
});

afterEach(() => {
  for (const k of ENV_KEYS) {
    if (savedEnv[k] === undefined) delete process.env[k];
    else process.env[k] = savedEnv[k];
  }
  __resetCallCapabilityEnv();
});

function jsonResponse(status: number, body: unknown): Response {
  return new Response(JSON.stringify(body), {
    status,
    headers: { "content-type": "application/json" },
  });
}

describe("callCapability — HTTP path (non-dispatch worker)", () => {
  it("POSTs to the dispatch broker with a signed identity header", async () => {
    // In core tests, the dynamic import of @agent-native/dispatch/server
    // fails (no dep), so resolveEnv returns { isDispatch: false }. That's
    // exactly the cross-worker scenario we want to exercise.
    let capturedHeader = "";
    const fetchImpl = vi.fn(async (_url, init?: RequestInit) => {
      const headers = (init?.headers ?? {}) as Record<string, string>;
      capturedHeader = headers["x-fluid-identity"] ?? "";
      return jsonResponse(200, {
        ok: true,
        output: { id: "ok", echoed: true },
      });
    });

    const out = await runWithRequestContext(
      { userEmail: "alice@x", orgId: "org_1" },
      async () =>
        callCapability(
          "notes.create-note",
          { title: "Hi" },
          {
            dispatchUrl: "http://disp.local",
            fetchImpl: fetchImpl as unknown as typeof fetch,
          },
        ),
    );

    expect(out).toEqual({ id: "ok", echoed: true });
    expect(fetchImpl).toHaveBeenCalledOnce();
    // The signed header is opaque here (dispatch verifies it), but it must
    // be present, well-formed (3 segments), and non-empty.
    expect(capturedHeader.split(".")).toHaveLength(3);
    expect(capturedHeader.length).toBeGreaterThan(20);
  });

  it("throws no_identity when there is no authenticated user", async () => {
    // Outside runWithRequestContext, getRequestUserEmail() is undefined.
    await expect(
      callCapability(
        "notes.create-note",
        { title: "Hi" },
        { dispatchUrl: "http://disp.local" },
      ),
    ).rejects.toMatchObject({ code: "no_identity" });
  });

  it("throws no_dispatch_url when DISPATCH_URL is missing", async () => {
    delete process.env.DISPATCH_URL;
    delete process.env.FLUID_DISPATCH_URL;
    await expect(
      runWithRequestContext({ userEmail: "alice@x" }, async () =>
        callCapability("notes.create-note", {}, {}),
      ),
    ).rejects.toMatchObject({ code: "no_dispatch_url" });
  });

  it("propagates a structured RpcError when the broker returns a non-OK envelope", async () => {
    const fetchImpl = vi.fn(async () =>
      jsonResponse(404, {
        ok: false,
        error: {
          code: "unknown_capability",
          message: 'Capability "x.y" not found',
          fqid: "x.y",
        },
      }),
    );
    await expect(
      runWithRequestContext({ userEmail: "alice@x" }, async () =>
        callCapability(
          "x.y",
          {},
          {
            dispatchUrl: "http://disp.local",
            fetchImpl: fetchImpl as unknown as typeof fetch,
          },
        ),
      ),
    ).rejects.toMatchObject({
      name: "RpcError",
      code: "unknown_capability",
      fqid: "x.y",
    });
  });
});
