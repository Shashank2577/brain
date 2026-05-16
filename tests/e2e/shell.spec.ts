/**
 * Phase 7 — Shell smoke e2e.
 *
 * Exercises the dispatch super-app shell against `pnpm dev:lazy` on port 8080:
 *   1. Gateway root returns non-5xx.
 *   2. Dispatch route is reachable through the gateway.
 *
 * Selectors are by role / label only — no Tailwind classes, no internal SQL
 * assertions. Lazy mode 302s the gateway entry until a template server boots
 * on demand, which is the smoke-tier signal we care about for Phase 7.
 *
 * Full sign-in → create → read → share → delete coverage requires a seeded
 * dev DB and the magic-link / DEV_AUTH=1 bypass — deferred to Phase 8 along
 * with the shared Playwright auth fixture.
 */
import { expect, test } from "@playwright/test";

// Single-server lazy mode can take >30s to boot a template on first hit, so
// stretch the per-test timeout. Playwright's webServer block is responsible
// for keeping the process alive between tests.
test.setTimeout(120_000);

test.describe("dispatch shell — rail and navigation", () => {
  test("gateway root returns a non-5xx response", async ({ page }) => {
    const response = await page.goto("/", { waitUntil: "commit" });
    expect(response).not.toBeNull();
    expect(response!.status()).toBeLessThan(500);
  });

  test("dispatch route is reachable via the gateway", async ({ page }) => {
    const response = await page.goto("/dispatch", { waitUntil: "commit" });
    expect(response).not.toBeNull();
    expect(response!.status()).toBeLessThan(500);
  });
});
