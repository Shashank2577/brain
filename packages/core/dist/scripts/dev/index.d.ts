/**
 * Dev-mode script registry.
 *
 * Provides file system, shell, and database tools for the agent
 * when running in development mode. These tools should NEVER be
 * registered in production.
 */
import type { ActionEntry } from "../../agent/production-agent.js";
/**
 * Creates the dev-mode script registry with file system, shell,
 * and database tools. Call this and merge with your app's registry
 * when NODE_ENV !== "production".
 */
export declare function createDevScriptRegistry(): Promise<Record<string, ActionEntry>>;
//# sourceMappingURL=index.d.ts.map