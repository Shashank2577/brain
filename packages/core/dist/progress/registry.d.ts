import { getRun, listRuns, deleteRun } from "./store.js";
import { type AgentRun, type StartRunInput, type UpdateProgressInput } from "./types.js";
/**
 * Start a new run. Emits `run.progress.started` on the event bus so
 * automations can react (e.g. pinning the row in a UI tray).
 */
export declare function startRun(input: StartRunInput): Promise<AgentRun>;
/**
 * Update a run in-flight. Emits `run.progress.updated`. Caller supplies
 * partial fields — any omitted field stays unchanged.
 */
export declare function updateRunProgress(id: string, owner: string, input: UpdateProgressInput): Promise<AgentRun | null>;
/**
 * Finalize a run with a terminal status. Convenience wrapper around
 * `updateRunProgress` that ensures `completed_at` is set.
 */
export declare function completeRun(id: string, owner: string, status: "succeeded" | "failed" | "cancelled", extras?: {
    step?: string;
    metadata?: Record<string, unknown>;
}): Promise<AgentRun | null>;
export { getRun, listRuns, deleteRun };
//# sourceMappingURL=registry.d.ts.map