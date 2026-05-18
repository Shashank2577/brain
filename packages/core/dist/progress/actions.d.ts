/**
 * Framework-level agent tools for the progress primitive. Registered as
 * native tools so every template exposes them. Use from long agent loops
 * to communicate status to the user while work is still in-flight.
 *
 * All operations are consolidated into a single `manage-progress` tool
 * with an `action` discriminator.
 */
import type { ActionEntry } from "../agent/production-agent.js";
export declare function createProgressToolEntries(getCurrentUser: () => string): Record<string, ActionEntry>;
//# sourceMappingURL=actions.d.ts.map