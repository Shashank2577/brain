/**
 * Phase 7 — Cross-app e2e smoke.
 *
 * The canonical cross-app scenario per `docs/testing/e2e-strategy.md` is:
 * create a calendar event → switch to meetings via the rail → see it as a
 * meetable event. The full flow depends on:
 *
 *   - Seeded dev DB and `pnpm action seed-user --email=e2e@test`
 *   - Magic-link auth bypass with `DEV_AUTH=1`
 *   - A working capability bridge between calendar.list-events and the
 *     mail/meetings consumers
 *
 * All three live in the dev-lazy gateway. For Phase 7 we ship the smoke
 * variant: hit the calendar gateway route and the meetings gateway route
 * in sequence and assert both are reachable. Full assertion lives in
 * Phase 8 alongside the auth fixture.
 */
import { expect, test } from "@playwright/test";

test.setTimeout(180_000);

test.describe("cross-app — gateway reachability", () => {
  test("calendar then meetings both reachable through the gateway", async ({
    page,
  }) => {
    const calRes = await page.goto("/calendar", { waitUntil: "commit" });
    expect(calRes).not.toBeNull();
    expect(calRes!.status()).toBeLessThan(500);

    const meetRes = await page.goto("/meetings", { waitUntil: "commit" });
    expect(meetRes).not.toBeNull();
    expect(meetRes!.status()).toBeLessThan(500);
  });
});
