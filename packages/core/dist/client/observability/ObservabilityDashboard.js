import { jsx as _jsx, jsxs as _jsxs } from "react/jsx-runtime";
import { useState } from "react";
import { IconActivity, IconMessages, IconThumbUp, IconThumbDown, IconClock, IconCoin, IconTool, IconMoodSmile, IconChartBar, IconAB2, IconMessageReport, IconChevronRight, IconArrowLeft, IconLoader2, IconAlertTriangle, } from "@tabler/icons-react";
import { cn } from "../utils.js";
import { useObservabilityOverview, useTraces, useTraceDetail, useFeedbackList, useFeedbackStats, useSatisfaction, useEvalStats, useExperiments, useExperimentDetail, useExperimentResults, } from "./useObservability.js";
// ─── Helpers ────────────────────────────────────────────────────────────
function formatCost(centsX100) {
    const cents = centsX100 / 100;
    if (cents < 1)
        return `${cents.toFixed(3)}¢`;
    if (cents < 100)
        return `${cents.toFixed(2)}¢`;
    return `$${(cents / 100).toFixed(2)}`;
}
function formatCostCents(cents) {
    if (cents < 1)
        return `${cents.toFixed(3)}¢`;
    if (cents < 100)
        return `${cents.toFixed(2)}¢`;
    return `$${(cents / 100).toFixed(2)}`;
}
function formatDuration(ms) {
    if (ms < 1000)
        return `${Math.round(ms)}ms`;
    if (ms < 60_000)
        return `${(ms / 1000).toFixed(1)}s`;
    return `${(ms / 60_000).toFixed(1)}m`;
}
function formatPercent(ratio) {
    return `${(ratio * 100).toFixed(1)}%`;
}
function truncateId(id, len = 8) {
    return id.length > len ? id.slice(0, len) + "…" : id;
}
function timeAgo(ts) {
    const diff = Date.now() - ts;
    if (diff < 60_000)
        return "just now";
    if (diff < 3_600_000)
        return `${Math.floor(diff / 60_000)}m ago`;
    if (diff < 86_400_000)
        return `${Math.floor(diff / 3_600_000)}h ago`;
    return `${Math.floor(diff / 86_400_000)}d ago`;
}
const RANGES = [
    { value: 7, label: "7d" },
    { value: 30, label: "30d" },
    { value: 90, label: "90d" },
];
// ─── Shared components ──────────────────────────────────────────────────
function RangeSelector({ value, onChange, }) {
    return (_jsx("div", { className: "flex gap-1 rounded-md border border-border p-0.5", children: RANGES.map((r) => (_jsx("button", { onClick: () => onChange(r.value), className: cn("px-2.5 py-1 text-xs rounded", value === r.value
                ? "bg-accent text-foreground"
                : "text-muted-foreground hover:text-foreground"), children: r.label }, r.value))) }));
}
function MetricCard({ label, value, icon, }) {
    return (_jsxs("div", { className: "rounded-lg border border-border bg-background p-4", children: [_jsxs("div", { className: "flex items-center justify-between mb-2", children: [_jsx("span", { className: "text-xs text-muted-foreground", children: label }), _jsx("span", { className: "text-muted-foreground", children: icon })] }), _jsx("div", { className: "text-2xl font-semibold tabular-nums text-foreground", children: value })] }));
}
function StatusBadge({ status, }) {
    const styles = {
        draft: "bg-muted text-muted-foreground",
        running: "bg-blue-500/15 text-blue-500",
        paused: "bg-yellow-500/15 text-yellow-500",
        completed: "bg-green-500/15 text-green-500",
        success: "bg-green-500/15 text-green-500",
        error: "bg-red-500/15 text-red-500",
    };
    return (_jsx("span", { className: cn("inline-flex items-center rounded-full px-2 py-0.5 text-[10px] font-medium capitalize", styles[status] ?? styles.draft), children: status }));
}
function EmptyState({ message }) {
    return (_jsx("div", { className: "flex items-center justify-center py-12 text-sm text-muted-foreground", children: message }));
}
function LoadingState() {
    return (_jsx("div", { className: "flex items-center justify-center py-12", children: _jsx(IconLoader2, { size: 20, className: "animate-spin text-muted-foreground" }) }));
}
// ─── Tab: Overview ──────────────────────────────────────────────────────
function OverviewTab({ days }) {
    const { data, isLoading } = useObservabilityOverview(days);
    if (isLoading)
        return _jsx(LoadingState, {});
    if (!data)
        return _jsx(EmptyState, { message: "No data available" });
    return (_jsxs("div", { className: "grid grid-cols-2 gap-3 sm:grid-cols-3", children: [_jsx(MetricCard, { label: "Total runs", value: String(data.totalRuns), icon: _jsx(IconActivity, { size: 16 }) }), _jsx(MetricCard, { label: "Total cost", value: formatCostCents(data.totalCostCents), icon: _jsx(IconCoin, { size: 16 }) }), _jsx(MetricCard, { label: "Avg latency", value: formatDuration(data.avgDurationMs), icon: _jsx(IconClock, { size: 16 }) }), _jsx(MetricCard, { label: "Tool success", value: formatPercent(data.toolSuccessRate), icon: _jsx(IconTool, { size: 16 }) }), _jsx(MetricCard, { label: "Thumbs up", value: formatPercent(data.thumbsUpRate), icon: _jsx(IconThumbUp, { size: 16 }) }), _jsx(MetricCard, { label: "Avg eval score", value: data.avgEvalScore.toFixed(2), icon: _jsx(IconMoodSmile, { size: 16 }) })] }));
}
// ─── Tab: Conversations ─────────────────────────────────────────────────
function ConversationsTab({ days }) {
    const { data: traces, isLoading } = useTraces(days);
    const [selectedRunId, setSelectedRunId] = useState(null);
    if (selectedRunId) {
        return (_jsx(TraceDetailView, { runId: selectedRunId, onBack: () => setSelectedRunId(null) }));
    }
    if (isLoading)
        return _jsx(LoadingState, {});
    if (!traces || traces.length === 0)
        return _jsx(EmptyState, { message: "No conversations recorded yet" });
    return (_jsx("div", { className: "rounded-lg border border-border overflow-hidden", children: _jsxs("table", { className: "w-full table-fixed text-left text-xs", children: [_jsx("thead", { children: _jsxs("tr", { className: "border-b border-border bg-muted/30", children: [_jsx("th", { className: "px-3 py-2 font-medium text-muted-foreground w-[15%]", children: "Run" }), _jsx("th", { className: "px-3 py-2 font-medium text-muted-foreground w-[20%]", children: "Model" }), _jsx("th", { className: "px-3 py-2 font-medium text-muted-foreground", children: "Duration" }), _jsx("th", { className: "px-3 py-2 font-medium text-muted-foreground", children: "Cost" }), _jsx("th", { className: "px-3 py-2 font-medium text-muted-foreground", children: "Tools" }), _jsx("th", { className: "px-3 py-2 font-medium text-muted-foreground", children: "Time" }), _jsx("th", { className: "w-8" })] }) }), _jsx("tbody", { children: traces.map((t) => (_jsxs("tr", { onClick: () => setSelectedRunId(t.runId), className: "border-b border-border last:border-b-0 cursor-pointer hover:bg-accent/30", children: [_jsx("td", { className: "px-3 py-2 font-mono text-foreground truncate", children: truncateId(t.runId) }), _jsx("td", { className: "px-3 py-2 text-muted-foreground truncate", children: t.model || "unknown" }), _jsx("td", { className: "px-3 py-2 tabular-nums text-muted-foreground", children: formatDuration(t.totalDurationMs) }), _jsx("td", { className: "px-3 py-2 tabular-nums text-muted-foreground", children: formatCost(t.totalCostCentsX100) }), _jsxs("td", { className: "px-3 py-2 tabular-nums text-muted-foreground", children: [t.toolCalls, t.failedTools > 0 && (_jsxs("span", { className: "ml-1 text-red-500", children: ["(", t.failedTools, " failed)"] }))] }), _jsx("td", { className: "px-3 py-2 text-muted-foreground truncate", children: timeAgo(t.createdAt) }), _jsx("td", { className: "px-3 py-2", children: _jsx(IconChevronRight, { size: 14, className: "text-muted-foreground" }) })] }, t.runId))) })] }) }));
}
function TraceDetailView({ runId, onBack, }) {
    const { data, isLoading } = useTraceDetail(runId);
    return (_jsxs("div", { children: [_jsxs("button", { onClick: onBack, className: "flex items-center gap-1 text-xs text-muted-foreground hover:text-foreground mb-3", children: [_jsx(IconArrowLeft, { size: 14 }), "Back to list"] }), isLoading && _jsx(LoadingState, {}), data && (_jsxs("div", { className: "space-y-4", children: [_jsxs("div", { className: "grid grid-cols-2 gap-3 sm:grid-cols-4", children: [_jsxs("div", { className: "rounded-lg border border-border p-3", children: [_jsx("div", { className: "text-[10px] text-muted-foreground mb-1", children: "Model" }), _jsx("div", { className: "text-sm font-medium text-foreground truncate", children: data.summary.model || "unknown" })] }), _jsxs("div", { className: "rounded-lg border border-border p-3", children: [_jsx("div", { className: "text-[10px] text-muted-foreground mb-1", children: "Duration" }), _jsx("div", { className: "text-sm font-medium tabular-nums text-foreground", children: formatDuration(data.summary.totalDurationMs) })] }), _jsxs("div", { className: "rounded-lg border border-border p-3", children: [_jsx("div", { className: "text-[10px] text-muted-foreground mb-1", children: "Cost" }), _jsx("div", { className: "text-sm font-medium tabular-nums text-foreground", children: formatCost(data.summary.totalCostCentsX100) })] }), _jsxs("div", { className: "rounded-lg border border-border p-3", children: [_jsx("div", { className: "text-[10px] text-muted-foreground mb-1", children: "Spans" }), _jsx("div", { className: "text-sm font-medium tabular-nums text-foreground", children: data.summary.totalSpans })] })] }), _jsx("div", { className: "rounded-lg border border-border overflow-hidden", children: _jsxs("table", { className: "w-full table-fixed text-left text-xs", children: [_jsx("thead", { children: _jsxs("tr", { className: "border-b border-border bg-muted/30", children: [_jsx("th", { className: "px-3 py-2 font-medium text-muted-foreground w-[15%]", children: "Type" }), _jsx("th", { className: "px-3 py-2 font-medium text-muted-foreground w-[35%]", children: "Name" }), _jsx("th", { className: "px-3 py-2 font-medium text-muted-foreground", children: "Duration" }), _jsx("th", { className: "px-3 py-2 font-medium text-muted-foreground", children: "Tokens" }), _jsx("th", { className: "px-3 py-2 font-medium text-muted-foreground", children: "Status" })] }) }), _jsx("tbody", { children: data.spans.map((span) => (_jsxs("tr", { className: "border-b border-border last:border-b-0", children: [_jsx("td", { className: "px-3 py-2 truncate", children: _jsx("span", { className: "rounded bg-muted px-1.5 py-0.5 text-[10px] font-medium text-muted-foreground", children: span.spanType.replace("_", " ") }) }), _jsx("td", { className: "px-3 py-2 font-medium text-foreground truncate", children: span.name }), _jsx("td", { className: "px-3 py-2 tabular-nums text-muted-foreground", children: formatDuration(span.durationMs) }), _jsx("td", { className: "px-3 py-2 tabular-nums text-muted-foreground", children: span.inputTokens + span.outputTokens > 0
                                                    ? `${span.inputTokens} / ${span.outputTokens}`
                                                    : "-" }), _jsx("td", { className: "px-3 py-2", children: _jsx(StatusBadge, { status: span.status }) })] }, span.id))) })] }) })] }))] }));
}
// ─── Tab: Evals ─────────────────────────────────────────────────────────
function EvalsTab({ days }) {
    const { data, isLoading } = useEvalStats(days);
    if (isLoading)
        return _jsx(LoadingState, {});
    if (!data || data.totalEvals === 0)
        return _jsx(EmptyState, { message: "No eval results recorded yet" });
    const maxCount = Math.max(...data.byCriteria.map((c) => c.count), 1);
    return (_jsxs("div", { className: "space-y-4", children: [_jsxs("div", { className: "grid grid-cols-2 gap-3", children: [_jsx(MetricCard, { label: "Total evals", value: String(data.totalEvals), icon: _jsx(IconChartBar, { size: 16 }) }), _jsx(MetricCard, { label: "Avg score", value: data.avgScore.toFixed(2), icon: _jsx(IconMoodSmile, { size: 16 }) })] }), data.byCriteria.length > 0 && (_jsxs("div", { children: [_jsx("h3", { className: "text-xs font-medium text-foreground mb-2", children: "Scores by criteria" }), _jsx("div", { className: "space-y-2", children: data.byCriteria.map((c) => (_jsxs("div", { children: [_jsxs("div", { className: "flex items-center justify-between gap-2 text-xs mb-1 min-w-0", children: [_jsx("span", { className: "text-foreground truncate min-w-0", children: c.criteria }), _jsxs("span", { className: "shrink-0 text-muted-foreground tabular-nums", children: [c.avgScore.toFixed(2), " avg (", c.count, ")"] })] }), _jsx("div", { className: "h-1.5 rounded-full bg-muted overflow-hidden", children: _jsx("div", { className: "h-full bg-foreground/70 rounded-full", style: { width: `${(c.count / maxCount) * 100}%` } }) })] }, c.criteria))) })] }))] }));
}
// ─── Tab: Experiments ───────────────────────────────────────────────────
function ExperimentsTab() {
    const { data: experiments, isLoading } = useExperiments();
    const [selectedId, setSelectedId] = useState(null);
    if (selectedId) {
        return (_jsx(ExperimentDetailView, { id: selectedId, onBack: () => setSelectedId(null) }));
    }
    if (isLoading)
        return _jsx(LoadingState, {});
    if (!experiments || experiments.length === 0)
        return _jsx(EmptyState, { message: "No experiments created yet" });
    return (_jsx("div", { className: "rounded-lg border border-border overflow-hidden", children: _jsxs("table", { className: "w-full table-fixed text-left text-xs", children: [_jsx("thead", { children: _jsxs("tr", { className: "border-b border-border bg-muted/30", children: [_jsx("th", { className: "px-3 py-2 font-medium text-muted-foreground w-[40%]", children: "Name" }), _jsx("th", { className: "px-3 py-2 font-medium text-muted-foreground", children: "Status" }), _jsx("th", { className: "px-3 py-2 font-medium text-muted-foreground", children: "Variants" }), _jsx("th", { className: "px-3 py-2 font-medium text-muted-foreground", children: "Created" }), _jsx("th", { className: "w-8" })] }) }), _jsx("tbody", { children: experiments.map((exp) => (_jsxs("tr", { onClick: () => setSelectedId(exp.id), className: "border-b border-border last:border-b-0 cursor-pointer hover:bg-accent/30", children: [_jsx("td", { className: "px-3 py-2 font-medium text-foreground truncate", children: exp.name }), _jsx("td", { className: "px-3 py-2", children: _jsx(StatusBadge, { status: exp.status }) }), _jsx("td", { className: "px-3 py-2 tabular-nums text-muted-foreground", children: exp.variants.length }), _jsx("td", { className: "px-3 py-2 text-muted-foreground", children: timeAgo(exp.createdAt) }), _jsx("td", { className: "px-3 py-2", children: _jsx(IconChevronRight, { size: 14, className: "text-muted-foreground" }) })] }, exp.id))) })] }) }));
}
function ExperimentDetailView({ id, onBack, }) {
    const { data: exp, isLoading } = useExperimentDetail(id);
    const { data: results } = useExperimentResults(id);
    return (_jsxs("div", { children: [_jsxs("button", { onClick: onBack, className: "flex items-center gap-1 text-xs text-muted-foreground hover:text-foreground mb-3", children: [_jsx(IconArrowLeft, { size: 14 }), "Back to experiments"] }), isLoading && _jsx(LoadingState, {}), exp && (_jsxs("div", { className: "space-y-4", children: [_jsxs("div", { className: "flex items-center justify-between gap-2 min-w-0", children: [_jsx("h3", { className: "text-sm font-medium text-foreground truncate min-w-0", children: exp.name }), _jsx(StatusBadge, { status: exp.status })] }), _jsxs("div", { className: "grid grid-cols-3 gap-3", children: [_jsxs("div", { className: "rounded-lg border border-border p-3", children: [_jsx("div", { className: "text-[10px] text-muted-foreground mb-1", children: "Variants" }), _jsx("div", { className: "text-sm font-medium tabular-nums text-foreground", children: exp.variants.length })] }), _jsxs("div", { className: "rounded-lg border border-border p-3", children: [_jsx("div", { className: "text-[10px] text-muted-foreground mb-1", children: "Metrics" }), _jsx("div", { className: "text-sm font-medium tabular-nums text-foreground", children: exp.metrics.length })] }), _jsxs("div", { className: "rounded-lg border border-border p-3", children: [_jsx("div", { className: "text-[10px] text-muted-foreground mb-1", children: "Level" }), _jsx("div", { className: "text-sm font-medium text-foreground capitalize", children: exp.assignmentLevel })] })] }), exp.variants.length > 0 && (_jsxs("div", { children: [_jsx("h4", { className: "text-xs font-medium text-foreground mb-2", children: "Variants" }), _jsx("div", { className: "space-y-1", children: exp.variants.map((v) => (_jsxs("div", { className: "flex items-center justify-between rounded border border-border px-3 py-2 text-xs", children: [_jsx("span", { className: "font-mono text-foreground", children: truncateId(v.id) }), _jsxs("span", { className: "text-muted-foreground tabular-nums", children: ["Weight: ", v.weight] })] }, v.id))) })] })), results && results.length > 0 && (_jsxs("div", { children: [_jsx("h4", { className: "text-xs font-medium text-foreground mb-2", children: "Results" }), _jsx("div", { className: "rounded-lg border border-border overflow-hidden", children: _jsxs("table", { className: "w-full table-fixed text-left text-xs", children: [_jsx("thead", { children: _jsxs("tr", { className: "border-b border-border bg-muted/30", children: [_jsx("th", { className: "px-3 py-2 font-medium text-muted-foreground w-[20%]", children: "Variant" }), _jsx("th", { className: "px-3 py-2 font-medium text-muted-foreground w-[25%]", children: "Metric" }), _jsx("th", { className: "px-3 py-2 font-medium text-muted-foreground", children: "Value" }), _jsx("th", { className: "px-3 py-2 font-medium text-muted-foreground", children: "CI" }), _jsx("th", { className: "px-3 py-2 font-medium text-muted-foreground", children: "N" })] }) }), _jsx("tbody", { children: results.map((r) => (_jsxs("tr", { className: "border-b border-border last:border-b-0", children: [_jsx("td", { className: "px-3 py-2 font-mono text-foreground truncate", children: truncateId(r.variantId) }), _jsx("td", { className: "px-3 py-2 text-foreground truncate", children: r.metric }), _jsx("td", { className: "px-3 py-2 tabular-nums text-foreground", children: r.value.toFixed(3) }), _jsxs("td", { className: "px-3 py-2 tabular-nums text-muted-foreground", children: ["[", r.confidenceLow.toFixed(3), ",", " ", r.confidenceHigh.toFixed(3), "]"] }), _jsx("td", { className: "px-3 py-2 tabular-nums text-muted-foreground", children: r.sampleSize })] }, r.id))) })] }) })] }))] }))] }));
}
// ─── Tab: Feedback ──────────────────────────────────────────────────────
function FeedbackTab({ days }) {
    const { data: stats, isLoading: statsLoading } = useFeedbackStats(days);
    const { data: entries, isLoading: listLoading } = useFeedbackList(days);
    const { data: satisfaction } = useSatisfaction(days);
    const isLoading = statsLoading || listLoading;
    if (isLoading)
        return _jsx(LoadingState, {});
    const thumbsTotal = (stats?.thumbsUp ?? 0) + (stats?.thumbsDown ?? 0);
    const thumbsUpRate = thumbsTotal > 0 ? stats.thumbsUp / thumbsTotal : 0;
    const avgFrustration = satisfaction && satisfaction.length > 0
        ? satisfaction.reduce((sum, s) => sum + s.frustrationScore, 0) /
            satisfaction.length
        : 0;
    return (_jsxs("div", { className: "space-y-4", children: [_jsxs("div", { className: "grid grid-cols-2 gap-3 sm:grid-cols-4", children: [_jsx(MetricCard, { label: "Total feedback", value: String(stats?.total ?? 0), icon: _jsx(IconMessageReport, { size: 16 }) }), _jsx(MetricCard, { label: "Thumbs up", value: String(stats?.thumbsUp ?? 0), icon: _jsx(IconThumbUp, { size: 16 }) }), _jsx(MetricCard, { label: "Thumbs down", value: String(stats?.thumbsDown ?? 0), icon: _jsx(IconThumbDown, { size: 16 }) }), _jsx(MetricCard, { label: "Frustration", value: avgFrustration.toFixed(2), icon: _jsx(IconAlertTriangle, { size: 16 }) })] }), thumbsTotal > 0 && (_jsxs("div", { className: "rounded-lg border border-border p-3", children: [_jsx("div", { className: "text-xs text-muted-foreground mb-2", children: "Thumbs up rate" }), _jsxs("div", { className: "flex items-center gap-3", children: [_jsx("div", { className: "flex-1 h-2 rounded-full bg-muted overflow-hidden", children: _jsx("div", { className: "h-full bg-green-500 rounded-full", style: { width: `${thumbsUpRate * 100}%` } }) }), _jsx("span", { className: "text-sm font-medium tabular-nums text-foreground", children: formatPercent(thumbsUpRate) })] })] })), stats?.categories && Object.keys(stats.categories).length > 0 && (_jsxs("div", { children: [_jsx("h3", { className: "text-xs font-medium text-foreground mb-2", children: "Categories" }), _jsx("div", { className: "flex flex-wrap gap-1.5", children: Object.entries(stats.categories).map(([cat, count]) => (_jsxs("span", { className: "inline-flex items-center gap-1 rounded-full border border-border px-2.5 py-1 text-[10px] text-foreground max-w-[200px]", children: [_jsx("span", { className: "truncate", children: cat }), _jsx("span", { className: "shrink-0 text-muted-foreground tabular-nums", children: count })] }, cat))) })] })), entries && entries.length > 0 && (_jsxs("div", { children: [_jsx("h3", { className: "text-xs font-medium text-foreground mb-2", children: "Recent feedback" }), _jsx("div", { className: "space-y-1 max-h-64 overflow-y-auto overflow-x-hidden rounded-lg border border-border", children: entries.map((entry) => (_jsxs("div", { className: "flex items-center gap-2 px-3 py-2 text-xs border-b border-border last:border-b-0 min-w-0", children: [_jsxs("span", { className: "shrink-0", children: [entry.feedbackType === "thumbs_up" && (_jsx(IconThumbUp, { size: 14, className: "text-green-500" })), entry.feedbackType === "thumbs_down" && (_jsx(IconThumbDown, { size: 14, className: "text-red-500" })), entry.feedbackType === "category" && (_jsx(IconChartBar, { size: 14, className: "text-blue-500" })), entry.feedbackType === "text" && (_jsx(IconMessages, { size: 14, className: "text-muted-foreground" }))] }), _jsx("span", { className: "flex-1 min-w-0 truncate text-foreground", children: entry.feedbackType === "text" ||
                                        entry.feedbackType === "category"
                                        ? entry.value
                                        : entry.feedbackType.replace("_", " ") }), _jsx("span", { className: "shrink-0 text-muted-foreground", children: timeAgo(entry.createdAt) })] }, entry.id))) })] }))] }));
}
// ─── Main Dashboard ─────────────────────────────────────────────────────
const TABS = [
    { id: "overview", label: "Overview", icon: IconActivity },
    { id: "conversations", label: "Conversations", icon: IconMessages },
    { id: "evals", label: "Evals", icon: IconChartBar },
    { id: "experiments", label: "Experiments", icon: IconAB2 },
    { id: "feedback", label: "Feedback", icon: IconMessageReport },
];
export function ObservabilityDashboard({ className, }) {
    const [activeTab, setActiveTab] = useState("overview");
    const [days, setDays] = useState(7);
    return (_jsxs("div", { className: cn("space-y-4", className), children: [_jsxs("div", { className: "flex items-center justify-between gap-4 flex-wrap", children: [_jsx("div", { className: "flex gap-1 rounded-lg border border-border p-1 bg-muted/30", children: TABS.map((tab) => {
                            const Icon = tab.icon;
                            return (_jsxs("button", { onClick: () => setActiveTab(tab.id), className: cn("flex items-center gap-1.5 rounded-md px-3 py-1.5 text-xs font-medium", activeTab === tab.id
                                    ? "bg-background text-foreground shadow-sm"
                                    : "text-muted-foreground hover:text-foreground"), children: [_jsx(Icon, { size: 14 }), tab.label] }, tab.id));
                        }) }), activeTab !== "experiments" && (_jsx(RangeSelector, { value: days, onChange: setDays }))] }), activeTab === "overview" && _jsx(OverviewTab, { days: days }), activeTab === "conversations" && _jsx(ConversationsTab, { days: days }), activeTab === "evals" && _jsx(EvalsTab, { days: days }), activeTab === "experiments" && _jsx(ExperimentsTab, {}), activeTab === "feedback" && _jsx(FeedbackTab, { days: days })] }));
}
//# sourceMappingURL=ObservabilityDashboard.js.map