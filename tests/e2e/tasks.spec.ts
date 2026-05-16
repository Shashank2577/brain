/**
 * Phase 7 — Tasks e2e smoke. See notes.spec.ts for the smoke-tier scope.
 */
import { expect, test } from "@playwright/test";

test.setTimeout(120_000);

test.describe("tasks — gateway reachability", () => {
  test("/tasks returns a non-error response", async ({ page }) => {
    const response = await page.goto("/tasks", { waitUntil: "commit" });
    expect(response).not.toBeNull();
    expect(response!.status()).toBeLessThan(500);
  });
});
