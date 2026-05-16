import { describe, expect, it, vi } from "vitest";
import { callViaDispatch, RpcError } from "./rpc-client.js";

function jsonResponse(status: number, body: unknown): Response {
  return new Response(JSON.stringify(body), {
    status,
    headers: { "content-type": "application/json" },
  });
}

describe("callViaDispatch", () => {
  it("returns the capability output on a 200 envelope", async () => {
    const fetchImpl = vi.fn(
      async (_url: RequestInfo | URL, _init?: RequestInit) =>
        jsonResponse(200, { ok: true, output: { id: "n1" } }),
    );
    const out = await callViaDispatch<{ id: string }>(
      "notes.create",
      { title: "Hi" },
      {
        identityHeader: "h.p.s",
        dispatchUrl: "http://disp.local",
        fetchImpl: fetchImpl as unknown as typeof fetch,
      },
    );
    expect(out.id).toBe("n1");
    expect(fetchImpl).toHaveBeenCalledOnce();
    const [url, init] = fetchImpl.mock.calls[0]!;
    expect(url).toBe("http://disp.local/_agent-native/rpc/dispatch");
    expect((init as RequestInit).method).toBe("POST");
    const headers = (init as RequestInit).headers as Record<string, string>;
    expect(headers["x-fluid-identity"]).toBe("h.p.s");
    expect(JSON.parse((init as RequestInit).body as string)).toEqual({
      fqid: "notes.create",
      input: { title: "Hi" },
    });
  });

  it("throws a structured RpcError on a non-OK envelope", async () => {
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
      callViaDispatch(
        "x.y",
        {},
        {
          identityHeader: "h.p.s",
          dispatchUrl: "http://disp.local",
          fetchImpl: fetchImpl as unknown as typeof fetch,
        },
      ),
    ).rejects.toMatchObject({
      name: "RpcError",
      code: "unknown_capability",
      fqid: "x.y",
      httpStatus: 404,
    });
  });

  it("throws RpcError(no_identity) when identityHeader is missing", async () => {
    await expect(
      callViaDispatch(
        "x.y",
        {},
        {
          identityHeader: "",
          dispatchUrl: "http://disp.local",
        },
      ),
    ).rejects.toBeInstanceOf(RpcError);
  });

  it("throws RpcError(no_dispatch_url) when dispatchUrl is missing", async () => {
    await expect(
      callViaDispatch(
        "x.y",
        {},
        {
          identityHeader: "h.p.s",
          dispatchUrl: "",
        },
      ),
    ).rejects.toMatchObject({ code: "no_dispatch_url" });
  });

  it("wraps network errors as RpcError(network_error)", async () => {
    const fetchImpl = vi.fn(async () => {
      throw new Error("connection refused");
    });
    await expect(
      callViaDispatch(
        "x.y",
        {},
        {
          identityHeader: "h.p.s",
          dispatchUrl: "http://disp.local",
          fetchImpl: fetchImpl as unknown as typeof fetch,
        },
      ),
    ).rejects.toMatchObject({ code: "network_error" });
  });
});
