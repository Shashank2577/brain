import type { H3Event } from "h3";
import type { EnvKeyConfig } from "./create-server.js";
/**
 * The base path prefix for all framework-level routes.
 * All agent-native core routes live under this namespace to avoid
 * collisions with template-specific `/api/*` routes.
 */
export declare const FRAMEWORK_ROUTE_PREFIX = "/_agent-native";
/**
 * Resolves the page-level legacy `/tools` → `/extensions` redirect target.
 *
 * Returns the absolute path (with optional query string) to redirect to,
 * or `null` if the request should fall through to the SPA / next handler.
 *
 * Skips:
 *   - Framework API namespace (`/_agent-native/tools/*` is handled separately
 *     as a legacy alias and intentionally stays mounted as `tools`).
 *   - Anything that isn't `/tools` or a `/tools/...` page navigation, after
 *     the configured app base path is stripped off.
 *
 * Exported for tests; the runtime middleware below is a thin wrapper.
 */
export declare function resolveLegacyToolsRedirect(rawPath: string, search: string): string | null;
type NitroPluginDef = (nitroApp: any) => void | Promise<void>;
export interface CoreRoutesPluginOptions {
    /** Route path for the SSE endpoint. Default: "/_agent-native/events" */
    sseRoute?: string;
    /** Disable the SSE endpoint entirely. */
    disableSSE?: boolean;
    /** Disable the /_agent-native/ping health check. */
    disablePing?: boolean;
    /** Disable the /_agent-native/application-state routes. */
    disableAppState?: boolean;
    /** Env key configuration. Enables env-status and env-vars routes. */
    envKeys?: EnvKeyConfig[];
    /**
     * Optional owner resolver for narrowly-scoped public routes. Used by public
     * pages that let anonymous viewers connect Builder credentials for their
     * own browser-scoped agent session.
     */
    anonymousOwner?: (event: H3Event) => string | null | Promise<string | null>;
}
/**
 * Creates a Nitro plugin that mounts all standard agent-native framework routes.
 *
 * All routes are mounted under `/_agent-native/` to avoid collisions
 * with template-specific routes.
 *
 * Routes:
 *   GET    /_agent-native/poll                          — polling endpoint for change detection
 *   GET    /_agent-native/events (or custom)            — SSE endpoint for real-time sync
 *   GET    /_agent-native/ping                          — health check
 *   GET    /_agent-native/env-status                    — env key configuration status (when envKeys provided)
 *   POST   /_agent-native/env-vars                      — save env vars to .env (when envKeys provided)
 *   GET    /_agent-native/application-state/:key        — read application state
 *   PUT    /_agent-native/application-state/:key        — write application state
 *   DELETE /_agent-native/application-state/:key        — delete application state
 *   GET    /_agent-native/application-state/compose     — list compose drafts
 *   DELETE /_agent-native/application-state/compose     — delete all compose drafts
 *   GET    /_agent-native/application-state/compose/:id — get compose draft
 *   PUT    /_agent-native/application-state/compose/:id — upsert compose draft
 *   DELETE /_agent-native/application-state/compose/:id — delete compose draft
 */
export declare function createCoreRoutesPlugin(options?: CoreRoutesPluginOptions): NitroPluginDef;
/**
 * Default core routes plugin — mount with no configuration needed.
 *
 * Usage in templates:
 * ```ts
 * // server/plugins/core-routes.ts
 * export { defaultCoreRoutesPlugin as default } from "@agent-native/core/server";
 * ```
 */
export declare const defaultCoreRoutesPlugin: NitroPluginDef;
export {};
//# sourceMappingURL=core-routes-plugin.d.ts.map