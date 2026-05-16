// @vitest-environment happy-dom
import { beforeEach, describe, expect, it, vi } from "vitest";
import { getThemeInitScript } from "./theme.js";

function setPrefersDark(prefersDark: boolean) {
  Object.defineProperty(window, "matchMedia", {
    configurable: true,
    value: vi.fn().mockImplementation((query: string) => ({
      matches: query === "(prefers-color-scheme: dark)" && prefersDark,
      media: query,
      addEventListener: vi.fn(),
      removeEventListener: vi.fn(),
      addListener: vi.fn(),
      removeListener: vi.fn(),
      dispatchEvent: vi.fn(),
    })),
  });
}

function runThemeScript(script: string) {
  new Function(script)();
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
  Object.defineProperty(window, "localStorage", {
    configurable: true,
    get: () => storage,
  });
}

describe("getThemeInitScript", () => {
  beforeEach(() => {
    vi.unstubAllEnvs();
    installLocalStorageShim();
    document.documentElement.classList.remove("light", "dark");
    document.documentElement.removeAttribute("data-theme");
    document.documentElement.removeAttribute("data-appearance");
    document.documentElement.style.colorScheme = "";
  });

  it("resolves system theme before the app mounts", () => {
    setPrefersDark(true);

    runThemeScript(getThemeInitScript());

    expect(document.documentElement.classList.contains("dark")).toBe(true);
    expect(document.documentElement.getAttribute("data-theme")).toBe(null);
    expect(document.documentElement.style.colorScheme).toBe("dark");
  });

  it("lets an explicit stored theme override the browser preference", () => {
    setPrefersDark(true);
    window.localStorage.setItem("theme", "light");

    runThemeScript(getThemeInitScript());

    expect(document.documentElement.classList.contains("light")).toBe(true);
    expect(document.documentElement.classList.contains("dark")).toBe(false);
    expect(document.documentElement.getAttribute("data-theme")).toBe("light");
  });

  it("uses the configured default when there is no stored theme", () => {
    setPrefersDark(false);

    runThemeScript(getThemeInitScript("dark"));

    expect(document.documentElement.classList.contains("dark")).toBe(true);
    expect(document.documentElement.style.colorScheme).toBe("dark");
  });

  it("falls back from stored system when system themes are disabled", () => {
    setPrefersDark(false);
    window.localStorage.setItem("theme", "system");

    runThemeScript(getThemeInitScript("dark", false));

    expect(document.documentElement.classList.contains("dark")).toBe(true);
    expect(document.documentElement.getAttribute("data-theme")).toBe("dark");
    expect(window.localStorage.getItem("theme")).toBe("dark");
  });

  it("normalizes legacy auto storage before next-themes reads it", () => {
    setPrefersDark(true);
    window.localStorage.setItem("theme", "auto");

    runThemeScript(getThemeInitScript());

    expect(document.documentElement.classList.contains("dark")).toBe(true);
    expect(window.localStorage.getItem("theme")).toBe("system");
  });

  it("removes invalid stored themes so the provider can use the default", () => {
    setPrefersDark(false);
    window.localStorage.setItem("theme", "sepia");

    runThemeScript(getThemeInitScript("dark"));

    expect(document.documentElement.classList.contains("dark")).toBe(true);
    expect(window.localStorage.getItem("theme")).toBe(null);
  });

  it("inlines Vite dev recovery outside production", () => {
    vi.stubEnv("NODE_ENV", "development");

    expect(getThemeInitScript()).toContain("__an_optimize_reload");
  });

  it("omits Vite dev recovery in production", () => {
    vi.stubEnv("NODE_ENV", "production");

    expect(getThemeInitScript()).not.toContain("__an_optimize_reload");
  });

  it("applies a stored appearance preset on init", () => {
    setPrefersDark(false);
    window.localStorage.setItem("appearance", "ocean");

    runThemeScript(getThemeInitScript());

    expect(document.documentElement.getAttribute("data-appearance")).toBe(
      "ocean",
    );
  });

  it("clears invalid appearance values from storage", () => {
    setPrefersDark(false);
    window.localStorage.setItem("appearance", "neon-pink");

    runThemeScript(getThemeInitScript());

    expect(document.documentElement.getAttribute("data-appearance")).toBe(null);
    expect(window.localStorage.getItem("appearance")).toBe(null);
  });

  it("leaves data-appearance unset when none is stored", () => {
    setPrefersDark(false);

    runThemeScript(getThemeInitScript());

    expect(document.documentElement.getAttribute("data-appearance")).toBe(null);
  });

  it("keeps Vite dev recovery deterministic in browsers without process", () => {
    const originalProcess = globalThis.process;
    vi.stubGlobal("process", undefined);

    try {
      expect(getThemeInitScript()).toContain("__an_optimize_reload");
    } finally {
      vi.stubGlobal("process", originalProcess);
    }
  });
});
