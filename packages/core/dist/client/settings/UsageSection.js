import { jsx as _jsx, jsxs as _jsxs, Fragment as _Fragment } from "react/jsx-runtime";
import { agentNativePath } from "../api-path.js";
import { useEffect, useState } from "react";
import { IconLoader2, IconRefresh } from "@tabler/icons-react";
const RANGES = [
    { value: 1, label: "24h" },
    { value: 7, label: "7d" },
    { value: 30, label: "30d" },
    { value: 90, label: "90d" },
];
const USD_BILLING = {
    unit: "usd",
    label: "Estimated spend",
    shortLabel: "Cost",
    source: "estimated-provider-cost",
};
function displayAmountFromCostCents(cents, billing) {
    if (billing.unit !== "builder-credits")
        return cents;
    const margin = billing.hardCostMarginMultiplier ?? 1.25;
    const creditsPerUsd = billing.creditsPerUsd ?? 20;
    const credits = (cents / 100) * margin * creditsPerUsd;
    return credits <= 0 ? 0 : Math.ceil(credits * 1000) / 1000;
}
function formatCredits(credits) {
    if (!Number.isFinite(credits) || credits === 0)
        return "0 credits";
    const maximumFractionDigits = credits < 1 ? 3 : credits < 10 ? 2 : 1;
    const value = credits.toLocaleString(undefined, {
        maximumFractionDigits,
    });
    return `${value} ${credits === 1 ? "credit" : "credits"}`;
}
function formatSpend(cents, billing) {
    if (billing.unit === "builder-credits") {
        return formatCredits(displayAmountFromCostCents(cents, billing));
    }
    // Sub-cent values (e.g. a single LLM call at $0.0045 = 0.45¢) — keep
    // three decimals so tiny calls don't round to 0.00¢. The prior impl
    // multiplied by 100 in this branch, overstating small costs 100×.
    if (cents < 1)
        return `${cents.toFixed(3)}¢`;
    if (cents < 100)
        return `${cents.toFixed(2)}¢`;
    return `$${(cents / 100).toFixed(2)}`;
}
function formatTokens(n) {
    if (n >= 1_000_000)
        return `${(n / 1_000_000).toFixed(1)}M`;
    if (n >= 1_000)
        return `${(n / 1_000).toFixed(1)}K`;
    return String(n);
}
function BucketBars({ buckets, emptyMessage, billing, }) {
    if (buckets.length === 0) {
        return (_jsx("p", { className: "text-[10px] text-muted-foreground py-1.5", children: emptyMessage }));
    }
    const max = Math.max(...buckets.map((b) => displayAmountFromCostCents(b.cents, billing)), 0.0001);
    return (_jsx("div", { className: "space-y-1", children: buckets.map((b) => (_jsxs("div", { className: "text-[10px]", children: [_jsxs("div", { className: "flex items-center justify-between gap-2 mb-0.5", children: [_jsx("span", { className: "truncate text-foreground", title: b.key || "(none)", children: b.key || "(none)" }), _jsxs("span", { className: "shrink-0 text-muted-foreground tabular-nums", children: [formatSpend(b.cents, billing), _jsxs("span", { className: "ml-1 opacity-60", children: ["\u00B7 ", formatTokens(b.inputTokens + b.outputTokens), " tok"] })] })] }), _jsx("div", { className: "h-1 rounded-full bg-accent/40 overflow-hidden", children: _jsx("div", { className: "h-full bg-foreground/70", style: {
                            width: `${(displayAmountFromCostCents(b.cents, billing) / max) * 100}%`,
                        } }) })] }, b.key))) }));
}
function DailySparkline({ days, billing, }) {
    if (days.length === 0)
        return null;
    const max = Math.max(...days.map((d) => displayAmountFromCostCents(d.cents, billing)), 0.0001);
    return (_jsx("div", { className: "flex items-end gap-[2px] h-8 pt-2", children: days.map((d) => (_jsx("div", { className: "flex-1 bg-foreground/60 rounded-sm min-h-[1px]", style: {
                height: `${Math.max(2, (displayAmountFromCostCents(d.cents, billing) / max) * 100)}%`,
            }, title: `${d.date}: ${formatSpend(d.cents, billing)} (${d.calls} calls)` }, d.date))) }));
}
export function UsageSection() {
    const [days, setDays] = useState(30);
    const [data, setData] = useState(null);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState(null);
    const billing = data?.billing ?? USD_BILLING;
    const load = async (rangeDays) => {
        setLoading(true);
        setError(null);
        try {
            const res = await fetch(agentNativePath(`/_agent-native/usage?sinceDays=${rangeDays}`));
            if (!res.ok) {
                throw new Error(`Failed (${res.status})`);
            }
            const json = (await res.json());
            setData(json);
        }
        catch (err) {
            setError(err?.message || "Failed to load usage");
        }
        finally {
            setLoading(false);
        }
    };
    useEffect(() => {
        load(days);
    }, [days]);
    return (_jsxs("div", { className: "space-y-3", children: [_jsxs("div", { className: "flex items-center justify-between", children: [_jsx("div", { className: "flex gap-1 rounded-md border border-border p-0.5", children: RANGES.map((r) => (_jsx("button", { onClick: () => setDays(r.value), className: `px-2 py-0.5 text-[10px] rounded ${days === r.value
                                ? "bg-accent text-foreground"
                                : "text-muted-foreground hover:text-foreground"}`, children: r.label }, r.value))) }), _jsx("button", { onClick: () => load(days), className: "flex items-center gap-1 text-[10px] text-muted-foreground hover:text-foreground", disabled: loading, children: loading ? (_jsx(IconLoader2, { size: 11, className: "animate-spin" })) : (_jsx(IconRefresh, { size: 11 })) })] }), error && _jsx("p", { className: "text-[10px] text-red-500", children: error }), data && (_jsxs(_Fragment, { children: [_jsxs("div", { className: "rounded-md border border-border px-2.5 py-2", children: [_jsxs("div", { className: "flex items-baseline justify-between", children: [_jsxs("div", { children: [_jsx("div", { className: "text-[10px] text-muted-foreground", children: billing.unit === "builder-credits"
                                                    ? "Builder.io credit spend"
                                                    : "Total spend" }), _jsx("div", { className: "text-[18px] font-semibold tabular-nums", children: formatSpend(data.totalCents, billing) })] }), _jsxs("div", { className: "text-right", children: [_jsxs("div", { className: "text-[10px] text-muted-foreground", children: [data.totalCalls, " calls"] }), _jsxs("div", { className: "text-[10px] text-muted-foreground", children: [formatTokens(data.totalInputTokens), " in \u00B7", " ", formatTokens(data.totalOutputTokens), " out"] }), data.totalCacheReadTokens > 0 && (_jsxs("div", { className: "text-[10px] text-green-500/80", children: [formatTokens(data.totalCacheReadTokens), " cached"] }))] })] }), _jsx(DailySparkline, { days: data.byDay, billing: billing })] }), _jsxs("div", { children: [_jsx("div", { className: "text-[10px] font-medium text-foreground mb-1", children: "By label" }), _jsx(BucketBars, { buckets: data.byLabel, emptyMessage: "No labeled calls yet.", billing: billing })] }), _jsxs("div", { children: [_jsx("div", { className: "text-[10px] font-medium text-foreground mb-1", children: "By model" }), _jsx(BucketBars, { buckets: data.byModel, emptyMessage: "No calls recorded.", billing: billing })] }), data.byApp.filter((b) => b.key).length > 1 && (_jsxs("div", { children: [_jsx("div", { className: "text-[10px] font-medium text-foreground mb-1", children: "By app" }), _jsx(BucketBars, { buckets: data.byApp, emptyMessage: "", billing: billing })] })), data.recent.length > 0 && (_jsxs("details", { children: [_jsxs("summary", { className: "text-[10px] font-medium text-foreground cursor-pointer select-none hover:text-foreground/80", children: ["Recent calls (", data.recent.length, ")"] }), _jsx("div", { className: "mt-1.5 max-h-48 overflow-y-auto space-y-0.5 rounded border border-border", children: data.recent.map((r) => (_jsxs("div", { className: "flex items-center justify-between gap-2 px-2 py-1 text-[10px] border-b border-border last:border-b-0", children: [_jsxs("div", { className: "min-w-0 flex-1", children: [_jsxs("div", { className: "truncate text-foreground", title: r.label, children: [r.label, r.app ? (_jsxs("span", { className: "text-muted-foreground", children: [" ", "\u00B7 ", r.app] })) : null] }), _jsxs("div", { className: "truncate text-muted-foreground", children: [new Date(r.createdAt).toLocaleString(), " \u00B7 ", r.model] })] }), _jsx("div", { className: "shrink-0 text-right tabular-nums text-muted-foreground", children: formatSpend(r.cents, billing) })] }, r.id))) })] })), billing.unit === "builder-credits" ? (_jsxs("p", { className: "text-[10px] text-muted-foreground", children: ["Builder.io credits are estimated from hard token cost, a", " ", billing.hardCostMarginMultiplier ?? 1.25, "x margin, and", " ", billing.creditsPerUsd ?? 20, " credits per dollar."] })) : (_jsx("p", { className: "text-[10px] text-muted-foreground", children: "Spend is estimated from published Anthropic pricing and your own recorded token counts. Cached input is priced at ~10% of regular input." }))] }))] }));
}
//# sourceMappingURL=UsageSection.js.map