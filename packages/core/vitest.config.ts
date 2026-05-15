import { defineConfig } from "vitest/config";

/**
 * Phase 7 — packages/core vitest config.
 *
 * The bundled starter templates under `src/cli/starter-templates/` ship as raw
 * scaffold source with `<Name>` / `<name>` placeholders that are substituted at
 * `agent-native add-app` time. The `.spec.ts` files inside those scaffolds are
 * documentation for the scaffolded app, not tests of the framework — they do
 * not parse as TS until the placeholders are replaced. Excluding them here
 * keeps the framework's own test run green without affecting the scaffolder
 * output (the template directory is copied byte-for-byte during build via
 * `scripts/finalize-build.mjs`).
 *
 * Component specs that need a DOM continue to opt in per-file with the
 * `// @vitest-environment happy-dom` pragma.
 */
export default defineConfig({
  test: {
    environment: "node",
    passWithNoTests: true,
    include: ["src/**/*.{test,spec}.{ts,tsx}"],
    exclude: [
      "**/node_modules/**",
      "**/dist/**",
      "src/cli/starter-templates/**",
    ],
  },
});
