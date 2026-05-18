/**
 * Generic action dispatcher for @agent-native/core apps.
 *
 * Dynamically imports and runs actions from the app's actions/ directory.
 * Falls back to scripts/ directory for backwards compatibility, then to
 * core scripts (db-schema, db-query, db-exec, etc.) when no local action is found.
 *
 * Actions must export a default function: (args: string[]) => Promise<void>
 *
 * Usage: pnpm action <action-name> [--args]
 */
import type { ActionEntry } from "../agent/production-agent.js";
export interface RunScriptOptions {
    /**
     * Actions contributed by packages rather than the app's local `actions/`
     * directory. Local app actions still win on name collision.
     */
    packageActions?: Record<string, ActionEntry>;
    /** Help-section label for package actions. */
    packageActionLabel?: string;
}
/**
 * Run the action dispatcher. Call this from your app's actions/run.ts (or scripts/run.ts):
 *
 *   import { runScript } from "@agent-native/core";
 *   runScript();
 */
export declare function runScript(options?: RunScriptOptions): Promise<void>;
//# sourceMappingURL=runner.d.ts.map