/**
 * manage-agent-engine — unified tool for listing, setting, and testing agent engines.
 *
 * Consolidates the former list-agent-engines, set-agent-engine, and test-agent-engine
 * tools into a single tool with an `action` discriminator.
 */
import type { ActionTool } from "../../agent/types.js";
export declare const tool: ActionTool;
export declare function run(args: Record<string, string>): Promise<string>;
//# sourceMappingURL=manage-agent-engine.d.ts.map