// @vitest-environment happy-dom
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import {
  DISPATCH_SHELL_SENTINEL_PARAM,
  DISPATCH_SHELL_SENTINEL_VALUE,
  isInsideDispatchShell,
  markEmbeddedInsideDispatchShell,
  notifyShellOfNavigation,
} from "./frame.js";

/**
 * Tests for the dispatch super-app shell bridge added in Phase 2. The bridge
 * lives in `frame.ts` (so it can sit alongside the existing parent-frame
 * helpers), but the surface area is narrow:
 *
 *   - isInsideDispatchShell() — child detection
 *   - markEmbeddedInsideDispatchShell() — pin detection across URL rewrites
 *   - notifyShellOfNavigation(path) — child → parent URL-change postMessage
 */

describe("isInsideDispatchShell", () => {
  beforeEach(() => {
    window.history.replaceState({}, "", "/");
    document.documentElement.removeAttribute("data-dispatch-shell");
  });

  afterEach(() => {
    vi.unstubAllGlobals();
    document.documentElement.removeAttribute("data-dispatch-shell");
  });

  it("returns false at the top level (no parent iframe)", () => {
    // happy-dom defaults: window.parent === window
    expect(isInsideDispatchShell()).toBe(false);
  });

  it("returns true when the URL carries the shell sentinel param and we have a parent", () => {
    window.history.replaceState(
      {},
      "",
      `/calendar?${DISPATCH_SHELL_SENTINEL_PARAM}=${DISPATCH_SHELL_SENTINEL_VALUE}`,
    );
    // Simulate being in an iframe — happy-dom doesn't actually frame us, so we
    // stub window.parent to a different object.
    vi.stubGlobal("window", {
      ...window,
      parent: { postMessage: vi.fn() },
      location: window.location,
    });

    expect(isInsideDispatchShell()).toBe(true);
  });

  it("returns true after markEmbeddedInsideDispatchShell() even when the URL was rewritten", () => {
    // Pretend the shell pinned us, then a history.replaceState wiped the
    // sentinel from the URL.
    markEmbeddedInsideDispatchShell();
    window.history.replaceState({}, "", "/calendar/booking/abc");

    vi.stubGlobal("window", {
      ...window,
      parent: { postMessage: vi.fn() },
      location: window.location,
    });

    expect(isInsideDispatchShell()).toBe(true);
  });

  it("returns false when sentinel is missing and no marker is set, even inside an iframe", () => {
    vi.stubGlobal("window", {
      ...window,
      parent: { postMessage: vi.fn() },
      location: window.location,
    });

    expect(isInsideDispatchShell()).toBe(false);
  });
});

describe("notifyShellOfNavigation", () => {
  beforeEach(() => {
    window.history.replaceState({}, "", "/");
    document.documentElement.removeAttribute("data-dispatch-shell");
  });

  afterEach(() => {
    vi.unstubAllGlobals();
    document.documentElement.removeAttribute("data-dispatch-shell");
  });

  it("is a no-op when not inside the dispatch shell", () => {
    const postMessage = vi.fn();
    vi.stubGlobal("window", {
      ...window,
      parent: { postMessage },
      location: window.location,
    });

    notifyShellOfNavigation("/calendar/anything");
    expect(postMessage).not.toHaveBeenCalled();
  });

  it("posts a url-change message to the parent when the sentinel is present", () => {
    const postMessage = vi.fn();
    window.history.replaceState(
      {},
      "",
      `/calendar?${DISPATCH_SHELL_SENTINEL_PARAM}=${DISPATCH_SHELL_SENTINEL_VALUE}`,
    );
    vi.stubGlobal("window", {
      ...window,
      parent: { postMessage },
      location: window.location,
    });

    notifyShellOfNavigation("/booking/abc");
    expect(postMessage).toHaveBeenCalledTimes(1);
    expect(postMessage).toHaveBeenCalledWith(
      { kind: "url-change", path: "/booking/abc" },
      window.location.origin,
    );
  });

  it("posts when the marker is set even after the sentinel param was stripped", () => {
    const postMessage = vi.fn();
    markEmbeddedInsideDispatchShell();
    window.history.replaceState({}, "", "/calendar/booking/abc");
    vi.stubGlobal("window", {
      ...window,
      parent: { postMessage },
      location: window.location,
    });

    notifyShellOfNavigation("/booking/xyz");
    expect(postMessage).toHaveBeenCalledTimes(1);
    expect(postMessage).toHaveBeenCalledWith(
      { kind: "url-change", path: "/booking/xyz" },
      window.location.origin,
    );
  });
});
