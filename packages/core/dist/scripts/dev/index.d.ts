/**
 * Dev-mode script registry.
 *
 * Provides shared coding and database tools for the agent
 * when running in development mode. These tools should NEVER be
 * registered in production.
 */
import type { ActionEntry } from "../../agent/production-agent.js";
/**
 * Creates the dev-mode script registry with shared bash/read/edit/write
 * coding tools and database tools. Call this and merge with your app's registry
 * when NODE_ENV !== "production".
 */
export declare function createDevScriptRegistry(options?: {
    legacyAliases?: boolean;
}): Promise<Record<string, ActionEntry>>;
//# sourceMappingURL=index.d.ts.map