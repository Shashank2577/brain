/**
 * In-process registry of event definitions.
 *
 * Integrations and templates call `registerEvent()` at module load to declare
 * the event types they emit. The bus uses these definitions to validate
 * payloads, and the Automations UI lists them so users can build triggers.
 */
import type { EventDefinition } from "./types.js";
/**
 * Register (or replace) an event definition.
 *
 * Subsequent registrations with the same `name` replace the previous
 * definition — later plugins can override built-in defaults.
 */
export declare function registerEvent(def: EventDefinition): void;
/** Return all registered events in registration order. */
export declare function listEvents(): EventDefinition[];
/** Look up a single registered event by name. */
export declare function getEvent(name: string): EventDefinition | undefined;
/** Test helper — clears the registry between runs. */
export declare function __resetEventRegistry(): void;
//# sourceMappingURL=registry.d.ts.map