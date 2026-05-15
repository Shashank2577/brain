// @vitest-environment happy-dom
import React, { act } from "react";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { TooltipProvider } from "@radix-ui/react-tooltip";
import { createRoot, type Root } from "react-dom/client";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { SuperAppRail, type RegistryApp } from "./SuperAppRail.js";

/**
 * Component test for SuperAppRail (Phase 2). We bypass the registry fetch by
 * passing the `apps` prop directly so the test is hermetic. We render through
 * the React 19 `createRoot` + `act` pattern that other dispatch / core specs
 * already use (see ShareButton.spec.tsx).
 */

const APPS: RegistryApp[] = [
  { id: "calendar", name: "Calendar", icon: "CalendarMonth" },
  { id: "mail", name: "Mail", icon: "Mail" },
  { id: "slides", name: "Slides", icon: "Presentation" },
];

function renderRail(props: {
  activeAppId: string | null;
  onSelect: (appId: string) => void;
  apps?: RegistryApp[];
}) {
  const container = document.createElement("div");
  document.body.appendChild(container);
  const queryClient = new QueryClient({
    defaultOptions: { queries: { retry: false } },
  });
  let root: Root | null = null;
  act(() => {
    root = createRoot(container);
    root!.render(
      <QueryClientProvider client={queryClient}>
        <TooltipProvider>
          <SuperAppRail {...props} apps={props.apps ?? APPS} />
        </TooltipProvider>
      </QueryClientProvider>,
    );
  });
  return {
    container,
    cleanup() {
      act(() => {
        root?.unmount();
      });
      container.remove();
    },
    rerender(next: typeof props) {
      act(() => {
        root!.render(
          <QueryClientProvider client={queryClient}>
            <TooltipProvider>
              <SuperAppRail {...next} apps={next.apps ?? APPS} />
            </TooltipProvider>
          </QueryClientProvider>,
        );
      });
    },
  };
}

describe("SuperAppRail", () => {
  let onSelect: ReturnType<typeof vi.fn>;
  let view: ReturnType<typeof renderRail>;

  beforeEach(() => {
    onSelect = vi.fn();
  });

  afterEach(() => {
    view?.cleanup();
  });

  it("renders one button per registry app", () => {
    view = renderRail({ activeAppId: "calendar", onSelect });
    const buttons = view.container.querySelectorAll("button[data-app-id]");
    expect(buttons.length).toBe(APPS.length);
    expect(
      Array.from(buttons).map((b) => b.getAttribute("data-app-id")),
    ).toEqual(["calendar", "mail", "slides"]);
  });

  it("marks the active app with data-active=true and aria-current=page", () => {
    view = renderRail({ activeAppId: "mail", onSelect });
    const buttons = view.container.querySelectorAll("button[data-app-id]");
    const states: Record<string, string | null> = {};
    buttons.forEach((b) => {
      states[b.getAttribute("data-app-id")!] =
        b.getAttribute("data-active");
    });
    expect(states).toEqual({
      calendar: "false",
      mail: "true",
      slides: "false",
    });
    const active = view.container.querySelector(
      'button[data-app-id="mail"]',
    );
    expect(active?.getAttribute("aria-current")).toBe("page");
  });

  it("calls onSelect when a rail button is clicked", () => {
    view = renderRail({ activeAppId: "calendar", onSelect });
    const slides = view.container.querySelector<HTMLButtonElement>(
      'button[data-app-id="slides"]',
    );
    expect(slides).toBeTruthy();
    act(() => {
      slides?.click();
    });
    expect(onSelect).toHaveBeenCalledTimes(1);
    expect(onSelect).toHaveBeenCalledWith("slides");
  });

  it("activates rail position N when Cmd+N is pressed", () => {
    view = renderRail({ activeAppId: "calendar", onSelect });
    const event = new KeyboardEvent("keydown", {
      key: "2",
      metaKey: true,
      bubbles: true,
    });
    act(() => {
      document.dispatchEvent(event);
    });
    expect(onSelect).toHaveBeenCalledWith("mail");
  });

  it("ignores Cmd+N for positions beyond the installed app count", () => {
    view = renderRail({ activeAppId: "calendar", onSelect });
    const event = new KeyboardEvent("keydown", {
      key: "9",
      metaKey: true,
      bubbles: true,
    });
    act(() => {
      document.dispatchEvent(event);
    });
    // We only have 3 apps; pressing Cmd+9 is a no-op.
    expect(onSelect).not.toHaveBeenCalled();
  });
});
