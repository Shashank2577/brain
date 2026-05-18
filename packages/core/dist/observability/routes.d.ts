/**
 * H3 event handlers for the agent observability system.
 *
 * Mounted under `/_agent-native/observability/*` by the observability plugin.
 *
 *   GET    /                           — overview stats
 *   GET    /traces?since=N&limit=N     — list trace summaries
 *   GET    /traces/:runId              — get trace detail (spans + summary)
 *   GET    /traces/:runId/evals        — get evals for a run
 *   POST   /feedback                   — submit feedback
 *   GET    /feedback?since=N&limit=N   — list feedback entries
 *   GET    /feedback/stats?since=N     — feedback aggregation stats
 *   GET    /satisfaction?since=N       — satisfaction scores
 *   GET    /evals/stats?since=N        — eval stats
 *   GET    /experiments                — list experiments
 *   POST   /experiments                — create experiment
 *   GET    /experiments/:id            — get experiment detail
 *   PUT    /experiments/:id            — update experiment
 *   POST   /experiments/:id/results    — compute experiment results
 *   GET    /experiments/:id/results    — get experiment results
 */
export declare function createObservabilityHandler(): import("h3").EventHandlerWithFetch<import("h3").EventHandlerRequest, Promise<import("./types.js").Experiment | import("./types.js").TraceSummary[] | import("./types.js").FeedbackEntry[] | {
    total: number;
    thumbsUp: number;
    thumbsDown: number;
    categories: Record<string, number>;
} | import("./types.js").SatisfactionScore[] | import("./types.js").EvalResult[] | {
    totalEvals: number;
    avgScore: number;
    byCriteria: Array<{
        criteria: string;
        avgScore: number;
        count: number;
    }>;
} | import("./types.js").Experiment[] | import("./types.js").ExperimentMetricResult[] | {
    totalRuns: number;
    totalCostCents: number;
    avgDurationMs: number;
    toolSuccessRate: number;
    avgFrustrationScore: number;
    thumbsUpRate: number;
    avgEvalScore: number;
} | {
    summary: import("./types.js").TraceSummary;
    spans: import("./types.js").TraceSpan[];
    id?: undefined;
    error?: undefined;
    ok?: undefined;
} | {
    id: string;
    summary?: undefined;
    spans?: undefined;
    error?: undefined;
    ok?: undefined;
} | {
    error: any;
    summary?: undefined;
    spans?: undefined;
    id?: undefined;
    ok?: undefined;
} | {
    ok: boolean;
    summary?: undefined;
    spans?: undefined;
    id?: undefined;
    error?: undefined;
}>>;
//# sourceMappingURL=routes.d.ts.map