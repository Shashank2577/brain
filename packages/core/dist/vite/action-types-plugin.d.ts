import type { Plugin } from "vite";
/**
 * Vite plugin that watches `actions/` and generates type-safe action types.
 *
 * Add to your Vite config (auto-included by `defineConfig` from `@agent-native/core`):
 *
 * ```ts
 * import { actionTypesPlugin } from "@agent-native/core/vite/action-types-plugin";
 * plugins: [actionTypesPlugin()]
 * ```
 */
export declare function actionTypesPlugin(): Plugin;
/**
 * Public helper to regenerate the types + registry from a non-Vite context
 * (e.g. the Nitro deploy build, where Vite plugins don't run).
 */
export declare function generateActionRegistryForProject(projectRoot: string): void;
//# sourceMappingURL=action-types-plugin.d.ts.map