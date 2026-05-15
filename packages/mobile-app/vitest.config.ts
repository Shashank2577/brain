import path from "node:path";
import { defineConfig } from "vitest/config";

/**
 * Smoke test config for the mobile shell.
 *
 * The Phase 8 mobile shell is mostly React Native UI, which cannot run under
 * vitest without a full RN renderer harness (Detox / Maestro / @testing-library/
 * react-native). Both pull in a heavy native-module mock graph and are deferred
 * to v2 per Phase 8 / ADR-006.
 *
 * For Phase 8 we ship the smallest possible smoke test that the apps-list
 * screen logic is sound: import the pure-TS auth + config helpers and assert
 * they expose the expected shape. The full UI is exercised at v2 with
 * Maestro / Detox.
 */
export default defineConfig({
  resolve: {
    alias: {
      "@": path.resolve(__dirname, "."),
    },
  },
  test: {
    environment: "node",
    passWithNoTests: true,
    include: ["**/*.spec.ts"],
    exclude: ["node_modules/**", "dist/**", ".expo/**", "ios/**", "android/**"],
  },
});
