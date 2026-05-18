/**
 * Framework request handler — registers framework routes on Nitro's h3 instance.
 *
 * Nitro 3 exposes its h3 app as `nitroApp.h3`. We register framework routes
 * directly on it as middleware (`nitroApp.h3["~middleware"]`), giving each
 * plugin a path-prefix-matched handler that runs before any file-based route.
 *
 * Plugins call `getH3App(nitroApp).use(path, handler)` exactly like h3 v1's
 * `app.use()` — the wrapper translates that into v2 middleware registration.
 *
 * Default plugins that the template doesn't provide are auto-mounted on the
 * first call to `getH3App()` per nitroApp instance.
 */
import type { EventHandler } from "h3";
declare const FRAMEWORK_PREFIX = "/_agent-native";
/**
 * Wrapper around Nitro's h3 instance that exposes a v1-style `.use()` API
 * for registering path-prefix middleware.
 */
export interface H3AppShim {
    use(path: string, handler: EventHandler): void;
    use(handler: EventHandler): void;
}
/**
 * Mark a default plugin slot as supplied by the app/template before the
 * framework default bootstrap runs.
 *
 * Bundled serverless functions often don't have the original
 * `server/plugins/*.ts` tree on disk at runtime, so filesystem route discovery
 * can falsely conclude a template plugin is missing. Explicit plugin factories
 * call this synchronously before awaiting bootstrap so the framework does not
 * auto-mount a generic default over the app's custom implementation.
 */
export declare function markDefaultPluginProvided(nitroApp: any, stem: string): void;
/**
 * Get (or create) the shared H3 app wrapper for a nitroApp. Plugins use this
 * to register routes via `.use(path, handler)`.
 *
 * On the first call per nitroApp, we kick off auto-mounting any missing
 * default plugins. User-facing plugin factories (createAgentChatPlugin,
 * createAuthPlugin, etc.) await this bootstrap via `awaitBootstrap()` so the
 * default plugins finish registering middleware before requests arrive.
 */
export declare function getH3App(nitroApp: any): H3AppShim;
/**
 * Wait for the framework's default-plugin bootstrap to complete.
 *
 * Called by user-facing plugin factories (`createAgentChatPlugin`, etc.) at
 * the top of their plugin function, so that by the time the function returns
 * — and Nitro starts accepting requests — all default plugins have finished
 * registering their middleware.
 *
 * No-op when called from inside the bootstrap itself (avoids deadlock when a
 * default plugin happens to be running as part of bootstrap).
 */
export declare function awaitBootstrap(nitroApp: any): Promise<void>;
/**
 * Track an async plugin's initialization promise. Nitro v3 calls plugins
 * synchronously and doesn't await async return values, so routes registered
 * inside an async plugin may not be ready when the first request arrives.
 *
 * Call this from the TOP of any async plugin so that the readiness gate
 * (installed by getH3App) can hold /_agent-native requests until the plugin
 * finishes mounting its routes.
 */
export declare function trackPluginInit(nitroApp: any, promise: Promise<void>): void;
/**
 * Await all tracked plugin initializations. Called by the readiness gate
 * middleware before dispatching framework routes.
 */
export declare function awaitPluginsReady(nitroApp: any): Promise<void>;
/**
 * Load a workspace-core's `/server` entry, transparently handling TS source.
 *
 * The scaffolded workspace-core template ships TS sources without a build
 * step (exports point at `./src/server/index.ts`), so plain `await import()`
 * blows up the moment Node hits a relative `.js` import inside (the standard
 * TS ESM convention) — and even before that, Node may resolve the package
 * relative to the framework's own location rather than the user's monorepo.
 *
 * We try Node's plain `import()` first (fastest path when the user has
 * compiled to dist/) and fall through to jiti on any error. jiti is anchored
 * to a real file inside the workspace-core's directory, so its module
 * resolution starts in the right node_modules tree (handles pnpm hoisting
 * and linked workspaces) AND handles TS source files + `.js` → `.ts` ESM
 * extension remapping.
 *
 * Edge runtimes without `fs` won't be able to load jiti at all; the outer
 * try/catch silently falls through to framework defaults in that case.
 */
export declare function loadWorkspaceCoreServer(packageName: string, packageDir: string): Promise<any>;
export { FRAMEWORK_PREFIX };
//# sourceMappingURL=framework-request-handler.d.ts.map