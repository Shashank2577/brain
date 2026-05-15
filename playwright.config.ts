import { defineConfig, devices } from "@playwright/test";

/**
 * Phase 7 scaffold: Playwright configuration for fluid-system e2e tests.
 *
 * Specs live in `tests/e2e/`. The webServer below boots the lazy dev
 * gateway on port 8080 (see scripts/dev-lazy.ts) so tests can navigate
 * to mini-apps through the workspace shell. Real test cases will be
 * authored in Phase 7 main per docs/testing/e2e-strategy.md.
 */
export default defineConfig({
  testDir: "tests/e2e",
  timeout: 60_000,
  fullyParallel: false,
  forbidOnly: !!process.env.CI,
  retries: process.env.CI ? 1 : 0,
  workers: process.env.CI ? 1 : undefined,
  reporter: [
    ["list"],
    ["html", { outputFolder: ".test-results/playwright-html", open: "never" }],
  ],
  use: {
    baseURL: "http://localhost:8080",
    trace: "on-first-retry",
    screenshot: "only-on-failure",
    video: "retain-on-failure",
  },
  projects: [
    {
      name: "chromium",
      use: { ...devices["Desktop Chrome"], headless: true },
    },
  ],
  webServer: {
    command: "pnpm dev:lazy",
    url: "http://localhost:8080",
    reuseExistingServer: !process.env.CI,
    timeout: 120_000,
    stdout: "ignore",
    stderr: "pipe",
  },
});
