/**
 * In-process registry of event definitions.
 *
 * Integrations and templates call `registerEvent()` at module load to declare
 * the event types they emit. The bus uses these definitions to validate
 * payloads, and the Automations UI lists them so users can build triggers.
 */
import { z } from "zod";
// Pin to globalThis so multiple ESM graphs (dev-mode Vite + Nitro, symlinks,
// dist/ vs src/) share a single registry. Same pattern as secrets/register.ts.
const REGISTRY_KEY = Symbol.for("@agent-native/core/event-bus.registry");
const registry = (globalThis[REGISTRY_KEY] ??= new Map());
/**
 * Register (or replace) an event definition.
 *
 * Subsequent registrations with the same `name` replace the previous
 * definition — later plugins can override built-in defaults.
 */
export function registerEvent(def) {
    if (!def || typeof def.name !== "string" || !def.name) {
        throw new Error("registerEvent: def.name is required");
    }
    if (typeof def.description !== "string" || !def.description) {
        throw new Error("registerEvent: def.description is required");
    }
    if (!def.payloadSchema) {
        throw new Error("registerEvent: def.payloadSchema is required");
    }
    registry.set(def.name, def);
}
/** Return all registered events in registration order. */
export function listEvents() {
    return Array.from(registry.values());
}
/** Look up a single registered event by name. */
export function getEvent(name) {
    return registry.get(name);
}
/** Test helper — clears the registry between runs. */
export function __resetEventRegistry() {
    registry.clear();
    registerBuiltInEvents();
}
function registerBuiltInEvents() {
    registerEvent({
        name: "test.event.fired",
        description: "Developer test event — fired manually from the Automations UI or via the test-event action.",
        payloadSchema: z
            .object({ data: z.record(z.string(), z.unknown()).optional() })
            .optional(),
    });
    registerEvent({
        name: "agent.turn.completed",
        description: "Fires after the agent completes a conversational turn.",
        payloadSchema: z.object({
            threadId: z.string().optional(),
            turnIndex: z.number().optional(),
            model: z.string().optional(),
        }),
    });
}
registerBuiltInEvents();
//# sourceMappingURL=registry.js.map