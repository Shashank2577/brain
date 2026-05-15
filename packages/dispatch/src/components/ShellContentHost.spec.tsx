// @vitest-environment happy-dom
import React, { act } from "react";
import { createRoot, type Root } from "react-dom/client";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import {
  ShellContentHost,
  buildIframeSrc,
} from "./ShellContentHost.js";

/**
 * Component tests for the iframe content host (Phase 2). We test the iframe
 * src construction and the LRU mounting behaviour with the React 19 createRoot
 * + act pattern.
 */

describe("buildIframeSrc", () => {
  it("includes the shell sentinel param so the child can detect embed mode", () => {
    const src = buildIframeSrc("calendar", "/booking/abc");
    const url = new URL(src, "http://localhost");
    expect(url.pathname).toBe("/calendar/booking/abc");
    expect(url.searchParams.get("__shell")).toBe("dispatch");
  });

  it("falls back to root when given an empty path", () => {
    const src = buildIframeSrc("mail", "/");
    expect(src.startsWith("/mail?")).toBe(true);
  });

  it("normalises paths without a leading slash", () => {
    const src = buildIframeSrc("slides", "deck/abc");
    const url = new URL(src, "http://localhost");
    expect(url.pathname).toBe("/slides/deck/abc");
  });
});

function renderHost(props: {
  activeAppId: string | null;
  appPath: string;
  onChildUrlChange?: (appId: string, path: string) => void;
  maxWarmApps?: number;
}) {
  const container = document.createElement("div");
  document.body.appendChild(container);
  let root: Root | null = null;
  act(() => {
    root = createRoot(container);
    root!.render(<ShellContentHost {...props} />);
  });
  return {
    container,
    rerender(next: typeof props) {
      act(() => {
        root!.render(<ShellContentHost {...next} />);
      });
    },
    cleanup() {
      act(() => {
        root?.unmount();
      });
      container.remove();
    },
  };
}

describe("ShellContentHost", () => {
  let view: ReturnType<typeof renderHost>;

  beforeEach(() => {});

  afterEach(() => {
    view?.cleanup();
  });

  it("renders an iframe whose src reflects the activeAppId and appPath", () => {
    view = renderHost({ activeAppId: "calendar", appPath: "/" });
    const iframes = view.container.querySelectorAll<HTMLIFrameElement>(
      'iframe[data-shell-iframe="true"]',
    );
    expect(iframes.length).toBe(1);
    const iframe = iframes[0]!;
    expect(iframe.getAttribute("data-app-id")).toBe("calendar");
    const url = new URL(iframe.src, "http://localhost");
    expect(url.pathname).toBe("/calendar");
    expect(url.searchParams.get("__shell")).toBe("dispatch");
  });

  it("only shows the active iframe; previously-mounted iframes stay hidden", () => {
    view = renderHost({ activeAppId: "calendar", appPath: "/" });
    view.rerender({ activeAppId: "mail", appPath: "/" });

    const iframes = view.container.querySelectorAll<HTMLIFrameElement>(
      'iframe[data-shell-iframe="true"]',
    );
    // Both calendar and mail remain warm.
    expect(iframes.length).toBe(2);
    const calendar = view.container.querySelector<HTMLIFrameElement>(
      'iframe[data-app-id="calendar"]',
    );
    const mail = view.container.querySelector<HTMLIFrameElement>(
      'iframe[data-app-id="mail"]',
    );
    expect(calendar?.className).toMatch(/hidden/);
    expect(mail?.className).toMatch(/block/);
  });

  it("evicts the LRU iframe once maxWarmApps is exceeded", () => {
    view = renderHost({ activeAppId: "calendar", appPath: "/", maxWarmApps: 2 });
    view.rerender({ activeAppId: "mail", appPath: "/", maxWarmApps: 2 });
    view.rerender({ activeAppId: "slides", appPath: "/", maxWarmApps: 2 });

    const iframes = view.container.querySelectorAll<HTMLIFrameElement>(
      'iframe[data-shell-iframe="true"]',
    );
    // calendar is LRU and should have been evicted.
    expect(iframes.length).toBe(2);
    const ids = Array.from(iframes)
      .map((f) => f.getAttribute("data-app-id"))
      .sort();
    expect(ids).toEqual(["mail", "slides"]);
  });

  it("renders an empty-state when activeAppId is null", () => {
    view = renderHost({ activeAppId: null, appPath: "/" });
    const iframes = view.container.querySelectorAll("iframe");
    expect(iframes.length).toBe(0);
    expect(view.container.textContent).toContain("No app selected");
  });

  it("calls onChildUrlChange when a child posts a url-change message", () => {
    const onChildUrlChange = vi.fn();
    view = renderHost({
      activeAppId: "calendar",
      appPath: "/",
      onChildUrlChange,
    });
    const iframe = view.container.querySelector<HTMLIFrameElement>(
      'iframe[data-app-id="calendar"]',
    );
    expect(iframe).toBeTruthy();
    // Synthesize a postMessage as if it came from inside the iframe.
    act(() => {
      window.dispatchEvent(
        new MessageEvent("message", {
          data: { kind: "url-change", path: "/booking/xyz" },
          origin: window.location.origin,
          source: iframe!.contentWindow,
        }),
      );
    });
    expect(onChildUrlChange).toHaveBeenCalledWith("calendar", "/booking/xyz");
  });
});
