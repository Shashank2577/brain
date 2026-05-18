import type { EvalResult, EvalCriteria } from "./types.js";
import type { AgentEngine } from "../agent/engine/types.js";
export declare function runAutomatedEvals(runId: string): Promise<EvalResult[]>;
export declare function runLlmJudgeEval(runId: string, criteria: EvalCriteria, opts?: {
    engine?: AgentEngine;
    model?: string;
    userId?: string | null;
}): Promise<EvalResult | null>;
export declare function runDatasetEval(datasetId: string, opts?: {
    criteria?: EvalCriteria[];
    engine?: AgentEngine;
    model?: string;
}): Promise<{
    datasetId: string;
    totalCases: number;
    avgScore: number;
    results: EvalResult[];
}>;
export declare function evaluateRun(runId: string, opts?: {
    sampleRate?: number;
}): Promise<EvalResult[]>;
//# sourceMappingURL=evals.d.ts.map