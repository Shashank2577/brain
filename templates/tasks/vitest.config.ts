import { defineConfig } from "vitest/config";
import path from "node:path";

export default defineConfig({
  resolve: {
    alias: {
      "@": path.resolve(__dirname, "./app"),
      "@shared": path.resolve(__dirname, "./shared"),
    },
  },
  test: {
    include: ["**/*.{test,spec}.?(c|m)[jt]s?(x)"],
    exclude: ["**/node_modules/**", "**/.git/**", "**/dist/**"],
    // First test bears the cost of bundling the dispatch package + drizzle.
    // 15s is conservative; tests after the cold load run in <50ms each.
    testTimeout: 15_000,
  },
});
