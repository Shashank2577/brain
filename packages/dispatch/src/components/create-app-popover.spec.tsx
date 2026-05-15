// @vitest-environment happy-dom
import React, { act } from "react";
import { TooltipProvider } from "@radix-ui/react-tooltip";
import { createRoot, type Root } from "react-dom/client";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { CreateAppFlow } from "./create-app-popover.js";

/**
 * Phase 6 — Component test for the starter-template picker inside the
 * Create-app popover. The popover surface itself is a thin Radix wrapper;
 * we render `CreateAppFlow` directly so the test does not need a portal
 * mount. The test is hermetic — we stub `fetch` so the access-picker
 * pre-fetches don't try to hit a backend.
 */

const originalFetch = globalThis.fetch;

function stubFetchEmpty() {
  globalThis.fetch = vi.fn(async () => {
    return new Response(JSON.stringify([]), {
      headers: { "content-type": "application/json" },
    });
  }) as typeof globalThis.fetch;
}

function render(): { container: HTMLDivElement; cleanup: () => void } {
  const container = document.createElement("div");
  document.body.appendChild(container);
  let root: Root | null = null;
  act(() => {
    root = createRoot(container);
    root!.render(
      <TooltipProvider>
        <CreateAppFlow />
      </TooltipProvider>,
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
  };
}

beforeEach(() => {
  stubFetchEmpty();
});

afterEach(() => {
  globalThis.fetch = originalFetch;
  vi.restoreAllMocks();
});

describe("CreateAppFlow / starter picker", () => {
  it("renders the two top-level tabs (Pick a starter / Describe)", () => {
    const { container, cleanup } = render();
    try {
      const starterTab = container.querySelector(
        '[data-testid="create-app-starter-tab"]',
      );
      const promptTab = container.querySelector(
        '[data-testid="create-app-prompt-tab"]',
      );
      expect(starterTab).toBeTruthy();
      expect(promptTab).toBeTruthy();
      // Starter tab is selected by default.
      expect(starterTab?.getAttribute("aria-selected")).toBe("true");
      expect(promptTab?.getAttribute("aria-selected")).toBe("false");
    } finally {
      cleanup();
    }
  });

  it("renders one card per starter template", () => {
    const { container, cleanup } = render();
    try {
      const ids = Array.from(
        container.querySelectorAll<HTMLElement>("[data-starter-id]"),
      ).map((el) => el.getAttribute("data-starter-id"));
      expect(ids.sort()).toEqual([
        "agent-tool",
        "blank",
        "crud-list",
        "dashboard",
      ]);
    } finally {
      cleanup();
    }
  });

  it("pre-selects crud-list by default", () => {
    const { container, cleanup } = render();
    try {
      const selected = container.querySelector<HTMLElement>(
        '[data-starter-id="crud-list"]',
      );
      expect(selected?.getAttribute("aria-pressed")).toBe("true");
    } finally {
      cleanup();
    }
  });

  it("switches to the prompt tab when the user clicks Describe", () => {
    const { container, cleanup } = render();
    try {
      const promptTab = container.querySelector<HTMLElement>(
        '[data-testid="create-app-prompt-tab"]',
      );
      expect(promptTab).toBeTruthy();
      act(() => {
        promptTab!.click();
      });
      expect(promptTab!.getAttribute("aria-selected")).toBe("true");
    } finally {
      cleanup();
    }
  });

  it("disables the Create button while the name field is empty", () => {
    const { container, cleanup } = render();
    try {
      const button = container.querySelector<HTMLButtonElement>(
        '[data-testid="starter-create-button"]',
      );
      expect(button).toBeTruthy();
      expect(button!.disabled).toBe(true);
    } finally {
      cleanup();
    }
  });
});
