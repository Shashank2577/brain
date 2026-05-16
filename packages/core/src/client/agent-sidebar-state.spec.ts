// @vitest-environment happy-dom
import { beforeEach, describe, expect, it, vi } from "vitest";

const frameState = vi.hoisted(() => ({ inBuilderFrame: false }));

vi.mock("./builder-frame.js", () => ({
  isInBuilderFrame: () => frameState.inBuilderFrame,
}));

const { getInitialAgentSidebarOpen, SIDEBAR_OPEN_KEY } =
  await import("./agent-sidebar-state.js");

function stubMatchMedia(matches: boolean) {
  vi.stubGlobal(
    "matchMedia",
    vi.fn().mockImplementation(() => ({
      matches,
      media: "(max-width: 767px)",
      onchange: null,
      addListener: vi.fn(),
      removeListener: vi.fn(),
      addEventListener: vi.fn(),
      removeEventListener: vi.fn(),
      dispatchEvent: vi.fn(),
    })),
  );
}

// Vitest 4's `populateGlobal` doesn't include `localStorage` in its KEYS list,
// so when jsdom is the environment the global `window.localStorage` ends up as
// a stale plain Object copy without the Storage methods. We install an
// in-memory shim per-test so the suite is environment-agnostic and keeps the
// assertions intact.
function installLocalStorageShim(): void {
  const data = new Map<string, string>();
  const storage = {
    getItem(key: string): string | null {
      return data.has(key) ? (data.get(key) as string) : null;
    },
    setItem(key: string, value: string): void {
      data.set(key, String(value));
    },
    removeItem(key: string): void {
      data.delete(key);
    },
    clear(): void {
      data.clear();
    },
    key(index: number): string | null {
      return Array.from(data.keys())[index] ?? null;
    },
    get length(): number {
      return data.size;
    },
  };
  vi.stubGlobal("localStorage", storage);
  // Mirror onto window so `window.localStorage.X` and bare `localStorage.X`
  // both see the same instance.
  Object.defineProperty(window, "localStorage", {
    configurable: true,
    get: () => storage,
  });
}

describe("getInitialAgentSidebarOpen", () => {
  beforeEach(() => {
    frameState.inBuilderFrame = false;
    installLocalStorageShim();
    stubMatchMedia(false);
  });

  it("uses the provided default when there is no saved preference", () => {
    expect(getInitialAgentSidebarOpen(true)).toBe(true);
    expect(getInitialAgentSidebarOpen(false)).toBe(false);
  });

  it("uses the saved desktop preference outside Builder", () => {
    window.localStorage.setItem(SIDEBAR_OPEN_KEY, "true");
    expect(getInitialAgentSidebarOpen(false)).toBe(true);

    window.localStorage.setItem(SIDEBAR_OPEN_KEY, "false");
    expect(getInitialAgentSidebarOpen(true)).toBe(false);
  });

  it("starts closed on mobile even with a saved open preference", () => {
    window.localStorage.setItem(SIDEBAR_OPEN_KEY, "true");
    stubMatchMedia(true);

    expect(getInitialAgentSidebarOpen(true)).toBe(false);
  });

  it("starts closed in Builder even with a saved open preference", () => {
    window.localStorage.setItem(SIDEBAR_OPEN_KEY, "true");
    frameState.inBuilderFrame = true;

    expect(getInitialAgentSidebarOpen(true)).toBe(false);
  });
});
