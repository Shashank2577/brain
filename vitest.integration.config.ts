import { defineConfig } from "vitest/config";

/**
 * Phase 7 — Integration test configuration.
 *
 * Runs the cross-template integration tests in `tests/integration/` against
 * in-memory SQLite. These tests exercise the dispatch capability registry
 * RPC path with real Drizzle migrations and the framework's
 * `runWithRequestContext` boundary — the unit tier's `vi.mock("getDb")`
 * shortcuts are replaced with a real database.
 *
 * Each spec boots its own ephemeral database in `beforeEach` and tears it
 * down in `afterEach`, so the suite is deterministic and the workers do not
 * share state. Tests must run sequentially within a file (via SQLite's
 * single-writer model); cross-file parallelism is fine.
 */
export default defineConfig({
  test: {
    environment: "node",
    include: ["tests/integration/**/*.spec.ts"],
    exclude: ["**/node_modules/**", "**/dist/**"],
    testTimeout: 15_000,
    hookTimeout: 15_000,
    pool: "forks",
    singleFork: true,
  },
});
