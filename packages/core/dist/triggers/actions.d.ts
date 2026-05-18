/**
 * Framework-level agent actions for the automations system.
 *
 * These are registered as native tools (not template actions) so they're
 * available in every template. The agent uses them to create, list, and
 * manage automations from chat.
 *
 * All six operations are consolidated into a single `manage-automations` tool
 * with an `action` discriminator to keep the tool registry compact.
 */
import type { ActionEntry } from "../agent/production-agent.js";
export declare function createAutomationToolEntries(getCurrentUser: () => string): Record<string, ActionEntry>;
//# sourceMappingURL=actions.d.ts.map