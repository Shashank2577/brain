/**
 * Trigger dispatcher — bridges the event bus to the automation system.
 *
 * On startup, loads all event-triggered jobs from the resources store,
 * subscribes to their events, and dispatches them (condition eval → agent
 * loop) when matching events fire.
 */
import { type ActionEntry } from "../agent/production-agent.js";
import type { TriggerFrontmatter } from "./types.js";
declare function parseTriggerFrontmatter(content: string): {
    meta: TriggerFrontmatter;
    body: string;
};
declare function buildTriggerContent(meta: TriggerFrontmatter, body: string): string;
export interface TriggerDispatcherDeps {
    getActions: () => Record<string, ActionEntry>;
    getSystemPrompt: (owner: string) => Promise<string>;
    apiKey?: string;
    model: string;
}
/**
 * Initialize the trigger dispatcher. Call once at server startup.
 * Loads all event-triggered jobs and subscribes to their events.
 */
export declare function initTriggerDispatcher(deps: TriggerDispatcherDeps): Promise<void>;
/**
 * Refresh event subscriptions from the resource store.
 * Call after creating/updating triggers.
 */
export declare function refreshEventSubscriptions(): Promise<void>;
export { parseTriggerFrontmatter, buildTriggerContent };
//# sourceMappingURL=dispatcher.d.ts.map