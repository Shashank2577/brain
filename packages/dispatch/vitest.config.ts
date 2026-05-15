import path from "node:path";
import { defineConfig } from "vitest/config";

/**
 * Dispatch package vitest config. We need an `@/` alias mapping to `./src/`
 * because the package's runtime UI components import from `@/lib/utils`,
 * `@/components/...`, etc. The same alias is wired into the consuming React
 * Router builds at the template level (each template's `vite.config.ts`).
 *
 * The default test environment stays `node` so the existing server tests
 * (capability-registry, dispatch-integrations, etc.) keep their fs / dynamic-
 * import behaviour. Component specs that need a DOM opt in per-file with the
 * `// @vitest-environment happy-dom` pragma.
 */
export default defineConfig({
  resolve: {
    alias: {
      "@": path.resolve(__dirname, "src"),
    },
  },
  test: {
    environment: "node",
    passWithNoTests: true,
  },
});
