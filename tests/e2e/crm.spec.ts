/**
 * Phase 7 — CRM e2e smoke. See notes.spec.ts for the smoke-tier scope.
 */
import { expect, test } from "@playwright/test";

test.setTimeout(120_000);

test.describe("crm — gateway reachability", () => {
  test("/crm returns a non-error response", async ({ page }) => {
    const response = await page.goto("/crm", { waitUntil: "commit" });
    expect(response).not.toBeNull();
    expect(response!.status()).toBeLessThan(500);
  });
});
