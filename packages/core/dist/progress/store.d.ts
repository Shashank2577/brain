import type { AgentRun, ListRunsOptions, StartRunInput, UpdateProgressInput } from "./types.js";
export declare const DEFAULT_PROGRESS_RUN_STALE_MS: number;
export declare function insertRun(input: StartRunInput): Promise<AgentRun>;
export declare function getRun(id: string, owner: string): Promise<AgentRun | null>;
export declare function updateRun(id: string, owner: string, input: UpdateProgressInput): Promise<AgentRun | null>;
export declare function cancelStaleRunsForOwner(owner: string, staleMs?: number): Promise<number>;
export declare function listRuns(owner: string, options?: ListRunsOptions): Promise<AgentRun[]>;
export declare function deleteRun(id: string, owner: string): Promise<boolean>;
//# sourceMappingURL=store.d.ts.map