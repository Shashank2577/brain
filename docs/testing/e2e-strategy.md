# End-to-End Test Strategy

E2E tests drive a real browser against a real server with a real SQLite database. They are the slowest tier (5–30 s per scenario) and the most expensive to maintain, so we keep the matrix tight: **one happy-path scenario per mini-app, plus one cross-app dataflow**. Everything else lives in unit or integration.

## Tooling

**Playwright is the chosen runner.** It is **not yet installed** at the workspace root — none of `package.json`, `packages/*/package.json`, or `templates/*/package.json` currently depend on `@playwright/test`. Bootstrapping work, owned by this strategy:

```bash
pnpm add -Dw @playwright/test
pnpm exec playwright install --with-deps chromium
```

A new `tests/e2e/` directory at the repo root will hold specs and a single `playwright.config.ts` that:

- spins up the templates we need with `webServer` (one entry per app, distinct ports — match the `scripts/qa-public-share-smoke.ts` port table: calls 9311, clips 9312, forms 9313, slides 9314, etc.).
- isolates each worker with a unique `DATABASE_URL=file:./.e2e/${WORKER}.sqlite`.
- seeds a fresh user (`pnpm action seed-user --email=e2e@test`) before the first scenario in each worker.

## Test matrix per mini-app

For each public-allow-listed template (calendar, content, slides, clips, analytics, mail, dispatch, forms, design), run the same five-step ritual:

1. **Sign in** via the magic-link / dev-mode flow (`POST /_agent-native/auth/dev-sign-in` with `DEV_AUTH=1`).
2. **Create** the primary resource (deck, recording, form, event, dashboard, draft, doc, brand).
3. **Read it back** from the list view.
4. **Share** it with a second seeded user (`bob@e2e.test`) using `share-resource`.
5. **Delete** it and confirm it disappears from the list.

```ts
// tests/e2e/slides.spec.ts
import { test, expect } from "@playwright/test";

test("slides: create → read → share → delete", async ({ page, context }) => {
  await page.goto("/sign-in");
  await page.getByLabel("Email").fill("alice@e2e.test");
  await page.getByRole("button", { name: "Continue" }).click();

  await page.getByRole("button", { name: "New deck" }).click();
  await page.getByLabel("Title").fill("Q3 roadmap");
  await page.getByRole("button", { name: "Create" }).click();
  await expect(page).toHaveURL(/\/deck\/[a-z0-9_-]+/);

  await page.goto("/");
  await expect(page.getByText("Q3 roadmap")).toBeVisible();

  await page.getByRole("link", { name: "Q3 roadmap" }).click();
  await page.getByRole("button", { name: "Share" }).click();
  await page.getByPlaceholder("Add people").fill("bob@e2e.test");
  await page.getByRole("button", { name: "Send" }).click();
  await expect(page.getByText("Shared with bob@e2e.test")).toBeVisible();

  await page.getByRole("button", { name: "Deck actions" }).click();
  await page.getByRole("menuitem", { name: "Delete" }).click();
  await page.getByRole("button", { name: "Confirm" }).click();
  await expect(page.getByText("Q3 roadmap")).toHaveCount(0);
});
```

Use shadcn semantic selectors (roles, labels) — they survive cosmetic changes. Never select by Tailwind class.

## Cross-app e2e

The super-app's value is in **inter-app dataflow**. One canonical scenario lives in `tests/e2e/cross-app.spec.ts`:

```ts
test("calendar event surfaces as a mail compose suggestion", async ({ page }) => {
  // 1. Alice creates an event in Calendar.
  await page.goto("http://localhost:9320/"); // calendar template port
  await page.getByRole("button", { name: "New event" }).click();
  await page.getByLabel("Title").fill("Pricing sync with Acme");
  await page.getByLabel("Attendees").fill("ceo@acme.com");
  await page.getByRole("button", { name: "Save" }).click();

  // 2. Switch to Mail via the left rail (shared workspace shell, no full reload).
  await page.getByRole("link", { name: "Mail" }).click();
  await expect(page).toHaveURL(/9322/); // mail template port

  // 3. The compose suggestion picks up the inferred event.
  await page.getByRole("button", { name: "New email" }).click();
  await expect(page.getByText("Following up on Pricing sync with Acme")).toBeVisible();
  await expect(page.getByText("ceo@acme.com")).toBeVisible();
});
```

This proves four things at once: shared SSO cookie, capability RPC (`calendar:list-recent-events` consumed by Mail's compose), shared `application_state` for cross-app context, and the left-rail shell's client-side navigation (no remount).

Add **one** more cross-app scenario as the platform matures: clips recording → slides import (the `import-pptx` capability already exists), or slides deck → dispatch send.

## Mobile (stubbed)

Mobile e2e is **not running yet**. When we add it, the choice is:

- **Detox** if we're shipping React Native via Expo. Fast, native gestures, but requires a native build per platform.
- **Maestro** if we want declarative YAML flows that run across React Native and the web mobile view. Lower setup cost, weaker assertions.

Recommendation: **Maestro** for the first pass — it tests the existing mobile-web view of the templates (most of them already render responsively) with no native build. Promote to Detox only when the desktop-app shell adds a true React Native target.

Spec when we wire it:

- One flow per template: open app → sign in (deep link from email) → create one resource → confirm visible.
- Run nightly, not on every PR — mobile e2e is too slow for the inner loop.
- Reuse the same seeded DB the desktop e2e workers leave behind so we exercise the cross-host SSO path.

## What e2e tests must NOT do

- No assertions on internal SQL. The integration tier owns that. E2e asserts only what the user sees.
- No mocked auth. The whole point is the cookie/SSO roundtrip.
- No retries that hide flakes — flakes get fixed, not retried. (`retries: process.env.CI ? 1 : 0`, and any retry surfaces in the QA dashboard.)
- No reliance on `setTimeout` for waiting — always `expect(...).toBeVisible()` with Playwright's auto-wait.

Run locally: `pnpm exec playwright test`. Open the inspector for a failing test: `pnpm exec playwright test --debug tests/e2e/slides.spec.ts`. The HTML report (`playwright-report/`) is the artifact CI uploads.
