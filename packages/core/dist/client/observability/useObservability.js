import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { agentNativePath } from "../api-path.js";
const BASE = agentNativePath("/_agent-native/observability");
function fetchJson(url) {
    return fetch(url).then((r) => {
        if (!r.ok)
            throw new Error(`HTTP ${r.status}`);
        return r.json();
    });
}
export function useObservabilityOverview(sinceDays = 7) {
    const sinceMs = Date.now() - sinceDays * 86_400_000;
    return useQuery({
        queryKey: ["observability", "overview", sinceDays],
        queryFn: () => fetchJson(`${BASE}?since=${sinceMs}`),
        refetchInterval: 30_000,
    });
}
export function useTraces(sinceDays = 7, limit = 100) {
    const sinceMs = Date.now() - sinceDays * 86_400_000;
    return useQuery({
        queryKey: ["observability", "traces", sinceDays, limit],
        queryFn: () => fetchJson(`${BASE}/traces?since=${sinceMs}&limit=${limit}`),
        refetchInterval: 30_000,
    });
}
export function useTraceDetail(runId) {
    return useQuery({
        queryKey: ["observability", "trace", runId],
        queryFn: () => fetchJson(`${BASE}/traces/${encodeURIComponent(runId)}`),
        enabled: !!runId,
    });
}
export function useFeedbackList(sinceDays = 7, limit = 100) {
    const sinceMs = Date.now() - sinceDays * 86_400_000;
    return useQuery({
        queryKey: ["observability", "feedback", sinceDays, limit],
        queryFn: () => fetchJson(`${BASE}/feedback?since=${sinceMs}&limit=${limit}`),
        refetchInterval: 30_000,
    });
}
export function useFeedbackStats(sinceDays = 7) {
    const sinceMs = Date.now() - sinceDays * 86_400_000;
    return useQuery({
        queryKey: ["observability", "feedback-stats", sinceDays],
        queryFn: () => fetchJson(`${BASE}/feedback/stats?since=${sinceMs}`),
        refetchInterval: 30_000,
    });
}
export function useSubmitFeedback() {
    const queryClient = useQueryClient();
    return useMutation({
        mutationFn: async (payload) => {
            const res = await fetch(`${BASE}/feedback`, {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify(payload),
            });
            if (!res.ok)
                throw new Error(`HTTP ${res.status}`);
            return res.json();
        },
        onSuccess: () => {
            queryClient.invalidateQueries({
                queryKey: ["observability", "feedback"],
            });
            queryClient.invalidateQueries({
                queryKey: ["observability", "feedback-stats"],
            });
        },
    });
}
export function useSatisfaction(sinceDays = 7) {
    const sinceMs = Date.now() - sinceDays * 86_400_000;
    return useQuery({
        queryKey: ["observability", "satisfaction", sinceDays],
        queryFn: () => fetchJson(`${BASE}/satisfaction?since=${sinceMs}`),
        refetchInterval: 30_000,
    });
}
export function useEvalStats(sinceDays = 7) {
    const sinceMs = Date.now() - sinceDays * 86_400_000;
    return useQuery({
        queryKey: ["observability", "eval-stats", sinceDays],
        queryFn: () => fetchJson(`${BASE}/evals/stats?since=${sinceMs}`),
        refetchInterval: 30_000,
    });
}
export function useExperiments() {
    return useQuery({
        queryKey: ["observability", "experiments"],
        queryFn: () => fetchJson(`${BASE}/experiments`),
        refetchInterval: 30_000,
    });
}
export function useExperimentDetail(id) {
    return useQuery({
        queryKey: ["observability", "experiment", id],
        queryFn: () => fetchJson(`${BASE}/experiments/${encodeURIComponent(id)}`),
        enabled: !!id,
    });
}
export function useExperimentResults(id) {
    return useQuery({
        queryKey: ["observability", "experiment-results", id],
        queryFn: () => fetchJson(`${BASE}/experiments/${encodeURIComponent(id)}/results`),
        enabled: !!id,
    });
}
//# sourceMappingURL=useObservability.js.map