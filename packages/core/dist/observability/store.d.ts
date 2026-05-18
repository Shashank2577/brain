import type { TraceSpan, TraceSummary, FeedbackEntry, SatisfactionScore, EvalResult, EvalDataset, Experiment, ExperimentAssignment, ExperimentMetricResult } from "./types.js";
export declare function ensureObservabilityTables(): Promise<void>;
export declare function insertTraceSpan(span: TraceSpan): Promise<void>;
export declare function upsertTraceSummary(summary: TraceSummary): Promise<void>;
/**
 * Purge trace spans, summaries, and eval results older than `cutoffMs`
 * (a Unix epoch in milliseconds — rows with `created_at < cutoffMs` are
 * deleted). Returns the per-table deletion counts. Satisfies the span
 * retention TTL noted in /tmp/security-audit/12-mcp-a2a-agent.md
 * (MEDIUM #14): trace metadata can hold sensitive tool inputs, so we
 * cap the storage horizon. Feedback rows are retained — they're
 * intentionally durable for product analytics. Experiments and
 * datasets are also retained because they are user-authored
 * configuration, not call telemetry.
 */
export declare function deleteOldTraceData(cutoffMs: number): Promise<{
    spans: number;
    summaries: number;
    evals: number;
}>;
export declare function getTraceSpansForRun(runId: string, opts?: {
    userId?: string;
}): Promise<TraceSpan[]>;
export declare function getTraceSummaries(opts: {
    sinceMs?: number;
    limit?: number;
    userId?: string;
}): Promise<TraceSummary[]>;
export declare function getTraceSummary(runId: string, opts?: {
    userId?: string;
}): Promise<TraceSummary | null>;
export declare function insertFeedback(entry: FeedbackEntry): Promise<void>;
export declare function getFeedback(opts: {
    threadId?: string;
    sinceMs?: number;
    limit?: number;
    feedbackType?: string;
    userId?: string;
}): Promise<FeedbackEntry[]>;
export declare function getFeedbackStats(sinceMs: number, opts?: {
    userId?: string;
}): Promise<{
    total: number;
    thumbsUp: number;
    thumbsDown: number;
    categories: Record<string, number>;
}>;
export declare function upsertSatisfactionScore(score: SatisfactionScore): Promise<void>;
export declare function getSatisfactionScores(opts: {
    sinceMs?: number;
    limit?: number;
    minFrustration?: number;
    userId?: string;
}): Promise<SatisfactionScore[]>;
export declare function insertEvalResult(result: EvalResult): Promise<void>;
export declare function getEvalsForRun(runId: string, opts?: {
    userId?: string;
}): Promise<EvalResult[]>;
export declare function getEvalStats(sinceMs: number, opts?: {
    userId?: string;
}): Promise<{
    totalEvals: number;
    avgScore: number;
    byCriteria: Array<{
        criteria: string;
        avgScore: number;
        count: number;
    }>;
}>;
export declare function insertEvalDataset(dataset: EvalDataset): Promise<void>;
export declare function listEvalDatasets(): Promise<EvalDataset[]>;
export declare function getEvalDataset(id: string): Promise<EvalDataset | null>;
export declare function updateEvalDataset(id: string, updates: Partial<Pick<EvalDataset, "name" | "description" | "entries">>): Promise<void>;
export declare function insertExperiment(exp: Experiment): Promise<void>;
export declare function updateExperiment(id: string, updates: Partial<Pick<Experiment, "name" | "status" | "variants" | "metrics" | "endedAt">>): Promise<void>;
export declare function listExperiments(): Promise<Experiment[]>;
export declare function getExperiment(id: string): Promise<Experiment | null>;
export declare function upsertAssignment(assignment: ExperimentAssignment): Promise<void>;
export declare function getAssignment(experimentId: string, userId: string): Promise<ExperimentAssignment | null>;
export declare function insertExperimentResult(result: ExperimentMetricResult): Promise<void>;
export declare function getExperimentResults(experimentId: string): Promise<ExperimentMetricResult[]>;
export declare function getObservabilityOverview(sinceMs: number, opts?: {
    userId?: string;
}): Promise<{
    totalRuns: number;
    totalCostCents: number;
    avgDurationMs: number;
    toolSuccessRate: number;
    avgFrustrationScore: number;
    thumbsUpRate: number;
    avgEvalScore: number;
}>;
//# sourceMappingURL=store.d.ts.map