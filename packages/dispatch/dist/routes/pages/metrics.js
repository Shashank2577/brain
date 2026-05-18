import { jsxs as _jsxs, jsx as _jsx, Fragment as _Fragment } from "react/jsx-runtime";
import { useMemo, useState } from "react";
import { useActionQuery } from "@agent-native/core/client";
import { IconActivity, IconAlertTriangle, IconApps, IconChartBar, IconClockHour4, IconCoin, IconMessages, IconUsersGroup, } from "@tabler/icons-react";
import { DispatchShell } from "../../components/dispatch-shell.js";
import { Alert, AlertDescription, AlertTitle } from "../../components/ui/alert.js";
import { Badge } from "../../components/ui/badge.js";
import { Button } from "../../components/ui/button.js";
import { Skeleton } from "../../components/ui/skeleton.js";
import { cn } from "../../lib/utils.js";
export function meta() {
    return [{ title: "Metrics — Dispatch" }];
}
const RANGES = [7, 30, 90];
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
    if (!Number.isFinite(cents) || cents === 0)
        return "$0.00";
    if (Math.abs(cents) < 1)
        return `${cents.toFixed(3)}¢`;
    if (Math.abs(cents) < 100)
        return `${cents.toFixed(2)}¢`;
    return (cents / 100).toLocaleString(undefined, {
        style: "currency",
        currency: "USD",
        maximumFractionDigits: 2,
    });
}
function formatNumber(value) {
    return new Intl.NumberFormat(undefined, {
        notation: value >= 10_000 ? "compact" : "standard",
        maximumFractionDigits: value >= 10_000 ? 1 : 0,
    }).format(value);
}
function formatTokens(value) {
    return new Intl.NumberFormat(undefined, {
        notation: "compact",
        maximumFractionDigits: 1,
    }).format(value);
}
function timeAgo(timestamp) {
    if (!timestamp)
        return "No activity";
    const diff = Date.now() - timestamp;
    if (diff < 60_000)
        return "just now";
    if (diff < 3_600_000)
        return `${Math.floor(diff / 60_000)}m ago`;
    if (diff < 86_400_000)
        return `${Math.floor(diff / 3_600_000)}h ago`;
    return `${Math.floor(diff / 86_400_000)}d ago`;
}
function displayApp(value) {
    const trimmed = value?.trim();
    if (!trimmed || trimmed === "unattributed")
        return "Unattributed";
    return trimmed;
}
function maxSpend(rows, billing) {
    return rows.reduce((max, row) => Math.max(max, displayAmountFromCostCents(row.costCents, billing)), 0);
}
function barWidth(value, max) {
    if (max <= 0 || value <= 0)
        return "0%";
    return `${Math.max(4, Math.round((value / max) * 100))}%`;
}
function RangeSelector({ value, onChange, }) {
    return (_jsx("div", { className: "flex rounded-md border bg-card p-0.5", children: RANGES.map((range) => (_jsxs(Button, { type: "button", variant: value === range ? "secondary" : "ghost", size: "sm", className: "h-7 px-3 text-xs", onClick: () => onChange(range), children: [range, "d"] }, range))) }));
}
function MetricCard({ label, value, detail, icon, }) {
    return (_jsxs("div", { className: "rounded-lg border bg-card p-4", children: [_jsxs("div", { className: "mb-3 flex items-center justify-between gap-3", children: [_jsx("span", { className: "text-xs font-medium text-muted-foreground", children: label }), _jsx("span", { className: "text-muted-foreground", children: icon })] }), _jsx("div", { className: "text-2xl font-semibold tabular-nums text-foreground", children: value }), _jsx("div", { className: "mt-1 truncate text-xs text-muted-foreground", children: detail })] }));
}
function Panel({ title, icon, children, action, }) {
    return (_jsxs("section", { className: "rounded-lg border bg-card", children: [_jsxs("div", { className: "flex items-center justify-between gap-3 border-b px-4 py-3", children: [_jsxs("div", { className: "flex min-w-0 items-center gap-2", children: [_jsx("span", { className: "text-muted-foreground", children: icon }), _jsx("h2", { className: "truncate text-sm font-semibold text-foreground", children: title })] }), action] }), _jsx("div", { className: "p-4", children: children })] }));
}
function LoadingMetrics() {
    return (_jsxs("div", { className: "space-y-4", children: [_jsx("div", { className: "grid gap-3 md:grid-cols-2 xl:grid-cols-5", children: Array.from({ length: 5 }).map((_, index) => (_jsxs("div", { className: "rounded-lg border bg-card p-4", children: [_jsx(Skeleton, { className: "mb-4 h-4 w-24" }), _jsx(Skeleton, { className: "h-7 w-20" }), _jsx(Skeleton, { className: "mt-3 h-3 w-28" })] }, index))) }), _jsx(Skeleton, { className: "h-80 rounded-lg" })] }));
}
function AppSpendRows({ rows, billing, }) {
    const max = maxSpend(rows, billing);
    if (rows.length === 0) {
        return (_jsx("div", { className: "rounded-lg border border-dashed px-4 py-8 text-sm text-muted-foreground", children: "No LLM usage recorded for this window." }));
    }
    return (_jsx("div", { className: "space-y-3", children: rows.map((row) => (_jsxs("div", { className: "space-y-1.5", children: [_jsxs("div", { className: "flex items-center justify-between gap-3 text-sm", children: [_jsxs("div", { className: "min-w-0", children: [_jsx("div", { className: "truncate font-medium text-foreground", children: displayApp(row.key) }), _jsxs("div", { className: "text-xs text-muted-foreground", children: [formatNumber(row.chatCalls), " chats \u00B7", " ", formatNumber(row.activeUsers), " users"] })] }), _jsxs("div", { className: "shrink-0 text-right", children: [_jsx("div", { className: "font-medium tabular-nums text-foreground", children: formatSpend(row.costCents, billing) }), _jsxs("div", { className: "text-xs text-muted-foreground", children: [formatNumber(row.calls), " calls"] })] })] }), _jsx("div", { className: "h-2 overflow-hidden rounded-full bg-muted", children: _jsx("div", { className: "h-full rounded-full bg-foreground", style: {
                            width: barWidth(displayAmountFromCostCents(row.costCents, billing), max),
                        } }) })] }, row.key))) }));
}
function DailyActivity({ rows }) {
    const max = Math.max(1, rows.reduce((value, row) => Math.max(value, row.calls), 0));
    if (rows.length === 0) {
        return (_jsx("div", { className: "rounded-lg border border-dashed px-4 py-8 text-sm text-muted-foreground", children: "No activity in this window." }));
    }
    return (_jsx("div", { className: "flex h-44 items-end gap-1", children: rows.map((row) => (_jsxs("div", { className: "group flex min-w-0 flex-1 flex-col items-center gap-2", children: [_jsx("div", { className: "relative flex h-36 w-full items-end rounded-sm bg-muted/60", children: _jsx("div", { className: "w-full rounded-sm bg-foreground transition group-hover:bg-primary", style: { height: `${Math.max(4, (row.calls / max) * 100)}%` } }) }), _jsx("div", { className: "hidden text-[10px] text-muted-foreground sm:block", children: row.date.slice(5) })] }, row.date))) }));
}
function AppAccessTable({ rows, billing, }) {
    const visibleRows = rows.filter((row) => !row.isDispatch);
    if (visibleRows.length === 0) {
        return (_jsx("div", { className: "rounded-lg border border-dashed px-4 py-8 text-sm text-muted-foreground", children: "No workspace apps discovered yet." }));
    }
    return (_jsx("div", { className: "overflow-x-auto", children: _jsxs("table", { className: "w-full min-w-[720px] text-left text-xs", children: [_jsx("thead", { children: _jsxs("tr", { className: "border-b text-muted-foreground", children: [_jsx("th", { className: "px-2 py-2 font-medium", children: "App" }), _jsx("th", { className: "px-2 py-2 font-medium", children: "Access" }), _jsx("th", { className: "px-2 py-2 text-right font-medium", children: "Users" }), _jsx("th", { className: "px-2 py-2 text-right font-medium", children: "Chats" }), _jsx("th", { className: "px-2 py-2 text-right font-medium", children: billing.shortLabel }), _jsx("th", { className: "px-2 py-2 text-right font-medium", children: "Last activity" })] }) }), _jsx("tbody", { children: visibleRows.map((row) => (_jsxs("tr", { className: "border-b last:border-0", children: [_jsxs("td", { className: "px-2 py-3", children: [_jsx("div", { className: "font-medium text-foreground", children: row.name }), _jsx("div", { className: "font-mono text-[11px] text-muted-foreground", children: row.path })] }), _jsx("td", { className: "px-2 py-3", children: _jsx(Badge, { variant: "outline", className: cn(row.status === "pending" &&
                                        "border-amber-500/30 bg-amber-500/10 text-amber-700 dark:text-amber-300"), children: row.status === "pending" ? "Building" : row.accessLabel }) }), _jsxs("td", { className: "px-2 py-3 text-right tabular-nums", children: [formatNumber(row.usersWithUsage), " /", " ", formatNumber(row.accessUsers)] }), _jsx("td", { className: "px-2 py-3 text-right tabular-nums", children: formatNumber(row.chatCalls) }), _jsx("td", { className: "px-2 py-3 text-right tabular-nums", children: formatSpend(row.costCents, billing) }), _jsx("td", { className: "px-2 py-3 text-right text-muted-foreground", children: timeAgo(row.lastActiveAt) })] }, row.id))) })] }) }));
}
function UserTable({ rows, billing, }) {
    if (rows.length === 0) {
        return (_jsx("div", { className: "rounded-lg border border-dashed px-4 py-8 text-sm text-muted-foreground", children: "No users have triggered LLM usage in this window." }));
    }
    return (_jsx("div", { className: "overflow-x-auto", children: _jsxs("table", { className: "w-full min-w-[760px] text-left text-xs", children: [_jsx("thead", { children: _jsxs("tr", { className: "border-b text-muted-foreground", children: [_jsx("th", { className: "px-2 py-2 font-medium", children: "User" }), _jsx("th", { className: "px-2 py-2 font-medium", children: "Role" }), _jsx("th", { className: "px-2 py-2 font-medium", children: "Top app" }), _jsx("th", { className: "px-2 py-2 text-right font-medium", children: "Chats" }), _jsx("th", { className: "px-2 py-2 text-right font-medium", children: "Threads" }), _jsx("th", { className: "px-2 py-2 text-right font-medium", children: "Tokens" }), _jsx("th", { className: "px-2 py-2 text-right font-medium", children: billing.shortLabel })] }) }), _jsx("tbody", { children: rows.slice(0, 12).map((row) => (_jsxs("tr", { className: "border-b last:border-0", children: [_jsxs("td", { className: "max-w-64 px-2 py-3", children: [_jsx("div", { className: "truncate font-medium text-foreground", children: row.ownerEmail }), _jsx("div", { className: "text-muted-foreground", children: timeAgo(row.lastActiveAt ?? row.lastChatAt) })] }), _jsx("td", { className: "px-2 py-3", children: _jsx(Badge, { variant: "secondary", children: row.role ?? "user" }) }), _jsx("td", { className: "px-2 py-3 text-muted-foreground", children: displayApp(row.topApp) }), _jsx("td", { className: "px-2 py-3 text-right tabular-nums", children: formatNumber(row.chatCalls) }), _jsx("td", { className: "px-2 py-3 text-right tabular-nums", children: formatNumber(row.chatThreads) }), _jsx("td", { className: "px-2 py-3 text-right tabular-nums", children: formatTokens(row.inputTokens + row.outputTokens) }), _jsx("td", { className: "px-2 py-3 text-right tabular-nums", children: formatSpend(row.costCents, billing) })] }, row.ownerEmail))) })] }) }));
}
function CompactBreakdown({ rows, empty, billing, }) {
    const max = maxSpend(rows, billing);
    if (rows.length === 0) {
        return _jsx("div", { className: "text-sm text-muted-foreground", children: empty });
    }
    return (_jsx("div", { className: "space-y-3", children: rows.slice(0, 6).map((row) => (_jsxs("div", { className: "space-y-1", children: [_jsxs("div", { className: "flex items-center justify-between gap-3 text-xs", children: [_jsx("span", { className: "truncate font-medium text-foreground", children: row.label }), _jsx("span", { className: "shrink-0 tabular-nums text-muted-foreground", children: formatSpend(row.costCents, billing) })] }), _jsx("div", { className: "h-1.5 overflow-hidden rounded-full bg-muted", children: _jsx("div", { className: "h-full rounded-full bg-muted-foreground", style: {
                            width: barWidth(displayAmountFromCostCents(row.costCents, billing), max),
                        } }) })] }, row.key))) }));
}
function RecentTable({ rows, billing, }) {
    if (rows.length === 0) {
        return (_jsx("div", { className: "rounded-lg border border-dashed px-4 py-8 text-sm text-muted-foreground", children: "No recent LLM calls." }));
    }
    return (_jsx("div", { className: "overflow-x-auto", children: _jsxs("table", { className: "w-full min-w-[760px] text-left text-xs", children: [_jsx("thead", { children: _jsxs("tr", { className: "border-b text-muted-foreground", children: [_jsx("th", { className: "px-2 py-2 font-medium", children: "When" }), _jsx("th", { className: "px-2 py-2 font-medium", children: "User" }), _jsx("th", { className: "px-2 py-2 font-medium", children: "App" }), _jsx("th", { className: "px-2 py-2 font-medium", children: "Label" }), _jsx("th", { className: "px-2 py-2 font-medium", children: "Model" }), _jsx("th", { className: "px-2 py-2 text-right font-medium", children: billing.shortLabel })] }) }), _jsx("tbody", { children: rows.slice(0, 10).map((row) => (_jsxs("tr", { className: "border-b last:border-0", children: [_jsx("td", { className: "px-2 py-3 text-muted-foreground", children: timeAgo(row.createdAt) }), _jsx("td", { className: "max-w-56 px-2 py-3", children: _jsx("div", { className: "truncate text-foreground", children: row.ownerEmail }) }), _jsx("td", { className: "px-2 py-3 text-muted-foreground", children: displayApp(row.app) }), _jsx("td", { className: "px-2 py-3", children: _jsx(Badge, { variant: "outline", children: row.label }) }), _jsx("td", { className: "max-w-48 px-2 py-3", children: _jsx("div", { className: "truncate text-muted-foreground", children: row.model }) }), _jsx("td", { className: "px-2 py-3 text-right tabular-nums", children: formatSpend(row.costCents, billing) })] }, row.id))) })] }) }));
}
export default function MetricsRoute() {
    const [sinceDays, setSinceDays] = useState(30);
    const { data, isLoading, error } = useActionQuery("list-dispatch-usage-metrics", { sinceDays }, { refetchInterval: 30_000 });
    const metrics = data;
    const billing = metrics?.billing ?? USD_BILLING;
    const totalTokens = useMemo(() => {
        if (!metrics)
            return 0;
        return (metrics.totals.inputTokens +
            metrics.totals.outputTokens +
            metrics.totals.cacheReadTokens +
            metrics.totals.cacheWriteTokens);
    }, [metrics]);
    return (_jsx(DispatchShell, { title: "Metrics", description: billing.unit === "builder-credits"
            ? "Workspace-wide Builder.io credit spend, chat volume, user activity, and app access."
            : "Workspace-wide LLM spend, chat volume, user activity, and app access.", children: _jsxs("div", { className: "space-y-4", children: [_jsxs("div", { className: "flex flex-wrap items-center justify-between gap-3", children: [_jsx("div", { className: "text-sm text-muted-foreground", children: metrics?.access.scope === "organization"
                                ? `${metrics.access.totalUsers} workspace users`
                                : `${metrics?.access.totalUsers ?? 0} signed-in users` }), _jsx(RangeSelector, { value: sinceDays, onChange: setSinceDays })] }), error ? (_jsxs(Alert, { variant: "destructive", children: [_jsx(IconAlertTriangle, { className: "h-4 w-4" }), _jsx(AlertTitle, { children: "Metrics unavailable" }), _jsx(AlertDescription, { children: error instanceof Error ? error.message : "Unable to load usage." })] })) : null, isLoading && !metrics ? _jsx(LoadingMetrics, {}) : null, metrics ? (_jsxs(_Fragment, { children: [_jsxs("div", { className: "grid gap-3 md:grid-cols-2 xl:grid-cols-5", children: [_jsx(MetricCard, { label: billing.label, value: formatSpend(metrics.totals.costCents, billing), detail: `${formatTokens(totalTokens)} total tokens`, icon: _jsx(IconCoin, { size: 17 }) }), _jsx(MetricCard, { label: "LLM calls", value: formatNumber(metrics.totals.calls), detail: `${formatNumber(metrics.totals.chatCalls)} chat turns`, icon: _jsx(IconActivity, { size: 17 }) }), _jsx(MetricCard, { label: "Active users", value: formatNumber(metrics.totals.activeUsers), detail: `${formatNumber(metrics.access.totalUsers)} users with access`, icon: _jsx(IconUsersGroup, { size: 17 }) }), _jsx(MetricCard, { label: "Workspace apps", value: formatNumber(metrics.totals.workspaceApps), detail: `${formatNumber(metrics.byApp.length)} with usage`, icon: _jsx(IconApps, { size: 17 }) }), _jsx(MetricCard, { label: "Chat threads", value: formatNumber(metrics.totals.chatThreads), detail: `${formatNumber(metrics.totals.chatMessages)} messages`, icon: _jsx(IconMessages, { size: 17 }) })] }), _jsxs("div", { className: "grid gap-4 xl:grid-cols-[minmax(0,1.35fr)_minmax(320px,0.65fr)]", children: [_jsx(Panel, { title: billing.unit === "builder-credits"
                                        ? "Credit Spend By App"
                                        : "Spend By App", icon: _jsx(IconChartBar, { size: 16 }), children: _jsx(AppSpendRows, { rows: metrics.byApp, billing: billing }) }), _jsx(Panel, { title: "Daily Activity", icon: _jsx(IconClockHour4, { size: 16 }), children: _jsx(DailyActivity, { rows: metrics.daily }) })] }), _jsx(Panel, { title: "Access By App", icon: _jsx(IconApps, { size: 16 }), children: _jsx(AppAccessTable, { rows: metrics.appAccess, billing: billing }) }), _jsx(Panel, { title: "Users", icon: _jsx(IconUsersGroup, { size: 16 }), children: _jsx(UserTable, { rows: metrics.byUser, billing: billing }) }), _jsxs("div", { className: "grid gap-4 lg:grid-cols-2", children: [_jsx(Panel, { title: "Models", icon: _jsx(IconChartBar, { size: 16 }), children: _jsx(CompactBreakdown, { rows: metrics.byModel, empty: "No model usage in this window.", billing: billing }) }), _jsx(Panel, { title: "Work Types", icon: _jsx(IconActivity, { size: 16 }), children: _jsx(CompactBreakdown, { rows: metrics.byLabel, empty: "No labeled usage in this window.", billing: billing }) })] }), _jsx(Panel, { title: "Recent LLM Calls", icon: _jsx(IconActivity, { size: 16 }), children: _jsx(RecentTable, { rows: metrics.recent, billing: billing }) })] })) : null] }) }));
}
//# sourceMappingURL=metrics.js.map