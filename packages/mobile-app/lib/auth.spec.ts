/**
 * Smoke test for the mobile auth helpers (Phase 8 / ADR-006).
 *
 * Vitest cannot import React Native UI modules without a heavy native-mock
 * harness, so we stub the two leaf dependencies (`expo-constants` and the
 * `react-native` `Platform` shim) and `@react-native-async-storage/...` for
 * in-process storage. The assertions cover the exact shape the dispatch
 * endpoint contract requires:
 *
 *  - `signInWithPassword` POSTs `{ email, password }` to the right URL
 *  - The success path stores the token and reads it back
 *  - 401 responses surface as `{ ok: false, reason: "invalid_credentials" }`
 *  - `authedFetch` adds `Authorization: Bearer <token>` when a token is stored
 */
import { describe, it, expect, vi, beforeEach } from "vitest";

// Stub the leaf RN modules so Vitest can import `lib/auth.ts` and
// `lib/config.ts` under Node. We don't need a real RN runtime — only the
// surface area these two libs actually call.
vi.mock("expo-constants", () => ({
  default: { expoConfig: { extra: { workspaceUrl: undefined } } },
}));
vi.mock("react-native", () => ({
  Platform: { OS: "ios" },
}));

// In-memory AsyncStorage stub. The auth module reads back what it writes,
// so a Map suffices.
const store = new Map<string, string>();
vi.mock("@react-native-async-storage/async-storage", () => ({
  default: {
    getItem: async (k: string) => store.get(k) ?? null,
    setItem: async (k: string, v: string) => {
      store.set(k, v);
    },
    removeItem: async (k: string) => {
      store.delete(k);
    },
    setMany: async (entries: Record<string, string>) => {
      for (const [k, v] of Object.entries(entries)) store.set(k, v);
    },
    removeMany: async (keys: string[]) => {
      for (const k of keys) store.delete(k);
    },
    getMany: async (keys: string[]) => {
      const out: Record<string, string | null> = {};
      for (const k of keys) out[k] = store.get(k) ?? null;
      return out;
    },
    getAllKeys: async () => Array.from(store.keys()),
    clear: async () => {
      store.clear();
    },
  },
}));

beforeEach(() => {
  store.clear();
});

describe("signInWithPassword", () => {
  it("POSTs to the mobile-token endpoint and persists the token on success", async () => {
    const calls: Array<{ url: string; init?: RequestInit }> = [];
    const fetchMock = vi.fn(async (input: string, init?: RequestInit) => {
      calls.push({ url: input, init });
      return new Response(
        JSON.stringify({
          ok: true,
          token: "header.payload.sig",
          expiresAt: Date.now() + 60_000,
          email: "alice@demo.local",
          orgId: "org_42",
        }),
        { status: 200, headers: { "content-type": "application/json" } },
      );
    });
    vi.stubGlobal("fetch", fetchMock);

    const { signInWithPassword, getStoredToken, getStoredTokenMeta } =
      await import("./auth");
    const result = await signInWithPassword("alice@demo.local", "pw");

    expect(result.ok).toBe(true);
    expect(fetchMock).toHaveBeenCalledTimes(1);
    expect(calls[0]?.url).toContain("/_agent-native/auth/mobile-token");

    const stored = await getStoredToken();
    expect(stored).toBe("header.payload.sig");
    const meta = await getStoredTokenMeta();
    expect(meta?.email).toBe("alice@demo.local");
    expect(meta?.orgId).toBe("org_42");
  });

  it("surfaces server error reasons without crashing", async () => {
    const fetchMock = vi.fn(async () =>
      new Response(
        JSON.stringify({ ok: false, reason: "invalid_credentials" }),
        { status: 401, headers: { "content-type": "application/json" } },
      ),
    );
    vi.stubGlobal("fetch", fetchMock);

    const { signInWithPassword, getStoredToken } = await import("./auth");
    const result = await signInWithPassword("alice@demo.local", "wrong");

    expect(result.ok).toBe(false);
    if (!result.ok) {
      expect(result.status).toBe(401);
      expect(result.reason).toBe("invalid_credentials");
    }
    // No token persisted on failure.
    expect(await getStoredToken()).toBeNull();
  });

  it("handles network errors gracefully", async () => {
    const fetchMock = vi.fn(async () => {
      throw new Error("Network request failed");
    });
    vi.stubGlobal("fetch", fetchMock);

    const { signInWithPassword } = await import("./auth");
    const result = await signInWithPassword("alice@demo.local", "pw");

    expect(result.ok).toBe(false);
    if (!result.ok) {
      expect(result.reason).toContain("network_error");
      expect(result.status).toBe(0);
    }
  });
});

describe("authedFetch", () => {
  it("attaches the bearer token when one is stored", async () => {
    const calls: Array<{ url: string; init?: RequestInit }> = [];
    const fetchMock = vi.fn(async (input: string, init?: RequestInit) => {
      calls.push({ url: input, init });
      return new Response("{}", { status: 200 });
    });
    vi.stubGlobal("fetch", fetchMock);

    const { storeToken, authedFetch } = await import("./auth");
    await storeToken(
      { email: "alice@demo.local", expiresAt: Date.now() + 60_000 },
      "abc.def.ghi",
    );

    await authedFetch("https://workspace.test/api");
    const headers = calls[0]?.init?.headers as Headers;
    expect(headers).toBeInstanceOf(Headers);
    expect(headers.get("authorization")).toBe("Bearer abc.def.ghi");
  });

  it("does not overwrite a caller-provided Authorization header", async () => {
    const calls: Array<{ url: string; init?: RequestInit }> = [];
    const fetchMock = vi.fn(async (input: string, init?: RequestInit) => {
      calls.push({ url: input, init });
      return new Response("{}", { status: 200 });
    });
    vi.stubGlobal("fetch", fetchMock);

    const { storeToken, authedFetch } = await import("./auth");
    await storeToken(
      { email: "alice@demo.local", expiresAt: Date.now() + 60_000 },
      "abc.def.ghi",
    );

    await authedFetch("https://workspace.test/api", {
      headers: { Authorization: "Bearer override" },
    });
    const headers = calls[0]?.init?.headers as Headers;
    expect(headers.get("authorization")).toBe("Bearer override");
  });

  it("does not attach a header when no token is stored", async () => {
    const calls: Array<{ url: string; init?: RequestInit }> = [];
    const fetchMock = vi.fn(async (input: string, init?: RequestInit) => {
      calls.push({ url: input, init });
      return new Response("{}", { status: 200 });
    });
    vi.stubGlobal("fetch", fetchMock);

    const { authedFetch } = await import("./auth");
    await authedFetch("https://workspace.test/api");
    const headers = calls[0]?.init?.headers as Headers;
    expect(headers?.has("authorization") ?? false).toBe(false);
  });
});
