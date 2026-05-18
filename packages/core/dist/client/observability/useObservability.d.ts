export interface ObservabilityOverview {
    totalRuns: number;
    totalCostCents: number;
    avgDurationMs: number;
    toolSuccessRate: number;
    avgFrustrationScore: number;
    thumbsUpRate: number;
    avgEvalScore: number;
}
export declare function useObservabilityOverview(sinceDays?: number): import("@tanstack/react-query").UseQueryResult<ObservabilityOverview, Error>;
export interface TraceSummary {
    runId: string;
    threadId: string | null;
    totalSpans: number;
    llmCalls: number;
    toolCalls: number;
    successfulTools: number;
    failedTools: number;
    totalDurationMs: number;
    totalCostCentsX100: number;
    totalInputTokens: number;
    totalOutputTokens: number;
    model: string;
    createdAt: number;
}
export declare function useTraces(sinceDays?: number, limit?: number): import("@tanstack/react-query").UseQueryResult<TraceSummary[], Error>;
export interface TraceSpan {
    id: string;
    runId: string;
    threadId: string | null;
    parentSpanId: string | null;
    spanType: "llm_call" | "tool_call" | "agent_run";
    name: string;
    inputTokens: number;
    outputTokens: number;
    cacheReadTokens: number;
    cacheWriteTokens: number;
    costCentsX100: number;
    durationMs: number;
    status: "success" | "error";
    errorMessage: string | null;
    metadata: Record<string, unknown> | null;
    createdAt: number;
}
export interface TraceDetail {
    summary: TraceSummary;
    spans: TraceSpan[];
}
export declare function useTraceDetail(runId: string | null): import("@tanstack/react-query").UseQueryResult<TraceDetail, Error>;
export interface FeedbackEntry {
    id: string;
    runId: string | null;
    threadId: string | null;
    messageSeq: number | null;
    feedbackType: "thumbs_up" | "thumbs_down" | "category" | "text";
    value: string;
    userId: string | null;
    createdAt: number;
}
export declare function useFeedbackList(sinceDays?: number, limit?: number): import("@tanstack/react-query").UseQueryResult<FeedbackEntry[], Error>;
export interface FeedbackStats {
    total: number;
    thumbsUp: number;
    thumbsDown: number;
    categories: Record<string, number>;
}
export declare function useFeedbackStats(sinceDays?: number): import("@tanstack/react-query").UseQueryResult<FeedbackStats, Error>;
export declare function useSubmitFeedback(): import("@tanstack/react-query").UseMutationResult<{
    id: string;
}, Error, {
    threadId?: string;
    runId?: string;
    messageSeq?: number;
    feedbackType: string;
    value?: string;
    userId?: string;
}, unknown>;
export interface SatisfactionScore {
    id: string;
    threadId: string;
    frustrationScore: number;
    rephrasingScore: number;
    abandonmentScore: number;
    sentimentScore: number;
    lengthTrendScore: number;
    computedAt: number;
}
export declare function useSatisfaction(sinceDays?: number): import("@tanstack/react-query").UseQueryResult<SatisfactionScore[], Error>;
export interface EvalStats {
    totalEvals: number;
    avgScore: number;
    byCriteria: Array<{
        criteria: string;
        avgScore: number;
        count: number;
    }>;
}
export declare function useEvalStats(sinceDays?: number): import("@tanstack/react-query").UseQueryResult<EvalStats, Error>;
export interface Experiment {
    id: string;
    name: string;
    status: "draft" | "running" | "paused" | "completed";
    variants: Array<{
        id: string;
        weight: number;
        config: Record<string, unknown>;
    }>;
    metrics: string[];
    assignmentLevel: "user" | "session";
    startedAt: number | null;
    endedAt: number | null;
    createdAt: number;
}
export declare function useExperiments(): import("@tanstack/react-query").UseQueryResult<Experiment[], Error>;
export declare function useExperimentDetail(id: string | null): import("@tanstack/react-query").UseQueryResult<Experiment, Error>;
export interface ExperimentMetricResult {
    id: string;
    experimentId: string;
    variantId: string;
    metric: string;
    value: number;
    sampleSize: number;
    confidenceLow: number;
    confidenceHigh: number;
    computedAt: number;
}
export declare function useExperimentResults(id: string | null): import("@tanstack/react-query").UseQueryResult<ExperimentMetricResult[], Error>;
//# sourceMappingURL=useObservability.d.ts.map