import type { Experiment, ExperimentVariant, ExperimentMetricResult } from "./types.js";
export declare function createExperiment(opts: {
    name: string;
    variants: Array<{
        id: string;
        weight: number;
        config: Record<string, unknown>;
    }>;
    metrics: string[];
    assignmentLevel?: "user" | "session";
}): Promise<Experiment>;
export declare function startExperiment(id: string): Promise<void>;
export declare function pauseExperiment(id: string): Promise<void>;
export declare function completeExperiment(id: string): Promise<void>;
export declare function resolveVariant(experimentId: string, userId: string): Promise<ExperimentVariant>;
export declare function resolveActiveExperimentConfig(userId: string): Promise<{
    configs: Record<string, unknown>;
    assignments: Array<{
        experimentId: string;
        variantId: string;
    }>;
} | null>;
export declare function computeExperimentResults(experimentId: string): Promise<ExperimentMetricResult[]>;
//# sourceMappingURL=experiments.d.ts.map