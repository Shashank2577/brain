/**
 * Framework-level agent actions for the notifications primitive.
 *
 * Registered as native tools (not template actions) so they're available in
 * every template. Consolidated into a single `manage-notifications` tool with
 * an `action` parameter that dispatches to the correct implementation.
 */
import type { ActionEntry } from "../agent/production-agent.js";
export declare function createNotificationToolEntries(getCurrentUser: () => string): Record<string, ActionEntry>;
//# sourceMappingURL=actions.d.ts.map