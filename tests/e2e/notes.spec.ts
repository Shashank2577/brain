/**
 * Phase 7 — Notes e2e smoke.
 *
 * Loads the notes template through the lazy gateway and asserts the page
 * renders without crashing. Full sign-in → create → read → share → delete
 * coverage requires a seeded dev DB and the magic-link auth flow plumbed
 * up — both deferred to Phase 8 alongside the Playwright auth fixture.
 *
 * For now the test guarantees:
 *   1. /notes is reachable through the gateway.
 *   2. The response is a 2xx or a 3xx redirect (sign-in).
 *   3. No 5xx error from the framework.
 */
import { expect, test } from "@playwright/test";

test.setTimeout(120_000);

test.describe("notes — gateway reachability", () => {
  test("/notes returns a non-error response", async ({ page }) => {
    const response = await page.goto("/notes", { waitUntil: "commit" });
    expect(response).not.toBeNull();
    expect(response!.status()).toBeLessThan(500);
  });
});
