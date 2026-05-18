import { jsx as _jsx, jsxs as _jsxs } from "react/jsx-runtime";
import { useEffect, useMemo, useState } from "react";
import { Link } from "react-router";
import { PromptComposer, useActionQuery, useChatModels, agentNativePath, } from "@agent-native/core/client";
import { IconActivity, IconAlertTriangle, IconApps, IconArrowUpRight, IconCheck, IconClockHour4, IconInfoCircle, IconKey, IconListCheck, IconRocket, IconPlugConnected, IconShieldCheck, } from "@tabler/icons-react";
import { CreateAppPopover } from "../../components/create-app-popover.js";
import { DispatchShell } from "../../components/dispatch-shell.js";
import { WorkspaceAppCard } from "../../components/workspace-app-card.js";
import { Alert, AlertDescription, AlertTitle } from "../../components/ui/alert.js";
import { Button } from "../../components/ui/button.js";
import { Skeleton } from "../../components/ui/skeleton.js";
import { Tooltip, TooltipContent, TooltipTrigger, } from "../../components/ui/tooltip.js";
import { submitOverviewPrompt } from "../../lib/overview-chat.js";
const ZERO_TASK_QUEUE_STATS = {
    pending: 0,
    processing: 0,
    completed_last_hour: 0,
    failed_last_hour: 0,
    oldest_pending_age_seconds: 0,
    recent_failures: [],
};
const HOME_CHAT_SUGGESTIONS = [
    "Create a lightweight customer onboarding app",
    "Ask Slides to draft a board update from our latest metrics",
    "Schedule a Monday morning analytics digest",
];
function HomeChatPanel() {
    const { selectedModel } = useChatModels();
    const send = (message) => {
        submitOverviewPrompt(message, selectedModel);
    };
    return (_jsx("section", { className: "px-2 py-6 sm:py-10", children: _jsxs("div", { className: "mx-auto w-full max-w-2xl space-y-8", children: [_jsx("h1", { className: "text-center text-2xl font-semibold tracking-tight text-foreground sm:text-3xl", children: "What should we do next?" }), _jsxs("div", { className: "flex flex-col gap-4", children: [_jsx(PromptComposer, { placeholder: "Message agent\u2026", onSubmit: (text) => {
                                const trimmed = text.trim();
                                if (!trimmed)
                                    return;
                                send(trimmed);
                            } }), _jsx("div", { className: "flex flex-wrap justify-center gap-2", children: HOME_CHAT_SUGGESTIONS.map((suggestion) => (_jsx("button", { type: "button", onClick: () => send(suggestion), className: "cursor-pointer rounded-full border border-border bg-card px-3 py-1.5 text-xs text-muted-foreground transition hover:border-foreground/30 hover:text-foreground", children: suggestion }, suggestion))) })] })] }) }));
}
function AppCardSkeleton() {
    return (_jsx("div", { className: "rounded-lg border bg-card p-4", children: _jsxs("div", { className: "flex items-start justify-between gap-3", children: [_jsxs("div", { className: "min-w-0 flex-1 space-y-3", children: [_jsx(Skeleton, { className: "h-4 w-32" }), _jsx(Skeleton, { className: "h-3 w-24" }), _jsxs("div", { className: "space-y-2 pt-1", children: [_jsx(Skeleton, { className: "h-3 w-full" }), _jsx(Skeleton, { className: "h-3 w-2/3" })] })] }), _jsx(Skeleton, { className: "h-5 w-5 rounded-md" })] }) }));
}
function RecentActivityList({ isLoading, events, }) {
    if (isLoading && events.length === 0) {
        return (_jsx("div", { className: "mt-4 space-y-3", children: Array.from({ length: 3 }).map((_, index) => (_jsxs("div", { className: "rounded-xl border bg-muted/30 px-4 py-3 space-y-2", children: [_jsx(Skeleton, { className: "h-4 w-3/5" }), _jsx(Skeleton, { className: "h-3 w-2/5" })] }, index))) }));
    }
    if (events.length === 0) {
        return (_jsx("div", { className: "mt-4 space-y-3", children: _jsx("div", { className: "rounded-xl border border-dashed px-4 py-6 text-sm text-muted-foreground", children: "No activity yet." }) }));
    }
    return (_jsx("div", { className: "mt-4 space-y-3", children: events.map((event) => (_jsxs("div", { className: "rounded-xl border bg-muted/30 px-4 py-3", children: [_jsx("div", { className: "text-sm font-medium text-foreground", children: event.summary }), _jsxs("div", { className: "mt-1 text-xs text-muted-foreground", children: [event.actor, " \u00B7 ", new Date(event.createdAt).toLocaleString()] })] }, event.id))) }));
}
function WorkspaceAppsSection({ apps, isLoading, }) {
    const filteredApps = apps.filter((app) => !app.isDispatch);
    const visibleApps = filteredApps.slice(0, 6);
    const showSkeletons = isLoading && visibleApps.length === 0;
    return (_jsxs("section", { className: "space-y-3", children: [_jsxs("div", { className: "flex flex-wrap items-center justify-between gap-3", children: [_jsxs("div", { className: "flex items-center gap-2", children: [_jsx(IconApps, { size: 16, className: "text-muted-foreground" }), _jsx("h2", { className: "text-sm font-semibold text-foreground", children: "Workspace apps" })] }), _jsx(Button, { asChild: true, variant: "outline", size: "sm", children: _jsxs(Link, { to: "/apps", children: ["View all", _jsx(IconArrowUpRight, { size: 15, className: "ml-1.5" })] }) })] }), _jsxs("div", { className: "grid gap-3 sm:grid-cols-2 xl:grid-cols-3", children: [showSkeletons
                        ? Array.from({ length: 6 }).map((_, index) => (_jsx(AppCardSkeleton, {}, index)))
                        : visibleApps.map((app) => (_jsx(WorkspaceAppCard, { app: app, className: "min-h-32" }, app.id))), !showSkeletons ? _jsx(CreateAppPopover, {}) : null] })] }));
}
function formatAgeSeconds(seconds) {
    if (!seconds || seconds < 0)
        return "0s";
    if (seconds < 60)
        return `${seconds}s`;
    if (seconds < 3600)
        return `${Math.floor(seconds / 60)}m`;
    return `${Math.floor(seconds / 3600)}h ${Math.floor((seconds % 3600) / 60)}m`;
}
function TaskQueueMetric({ label, value, tone, icon: Icon, }) {
    const toneClass = tone === "danger"
        ? "text-red-600 dark:text-red-400"
        : tone === "warning"
            ? "text-amber-600 dark:text-amber-400"
            : "text-foreground";
    return (_jsxs("div", { className: "rounded-xl border bg-card px-4 py-3", children: [_jsxs("div", { className: "flex items-center gap-1.5 text-xs font-medium text-muted-foreground", children: [Icon ? _jsx(Icon, { size: 14 }) : null, _jsx("span", { children: label })] }), _jsx("div", { className: `mt-1 text-2xl font-semibold ${toneClass}`, children: value })] }));
}
function TaskQueueSection({ stats }) {
    const showAlert = stats.pending > 5 || stats.failed_last_hour > 0;
    return (_jsxs("section", { className: "space-y-3", children: [_jsxs("div", { className: "flex items-center gap-2", children: [_jsx(IconListCheck, { size: 16, className: "text-muted-foreground" }), _jsx("h2", { className: "text-sm font-semibold text-foreground", children: "Task queue" })] }), showAlert && (_jsxs(Alert, { variant: stats.failed_last_hour > 0 ? "destructive" : "default", children: [_jsx(IconAlertTriangle, { className: "h-4 w-4" }), _jsx(AlertTitle, { children: stats.failed_last_hour > 0
                            ? `${stats.failed_last_hour} integration task${stats.failed_last_hour === 1 ? "" : "s"} failed in the last hour`
                            : `${stats.pending} pending integration task${stats.pending === 1 ? "" : "s"} queued` }), _jsx(AlertDescription, { children: stats.failed_last_hour > 0
                            ? "Recent failures are listed below. Check platform credentials and retry."
                            : "Tasks are waiting to be processed. The queue may be backed up." })] })), _jsxs("div", { className: "grid gap-3 sm:grid-cols-2 lg:grid-cols-5", children: [_jsx(TaskQueueMetric, { label: "Pending", value: stats.pending, tone: stats.pending > 5 ? "warning" : "default" }), _jsx(TaskQueueMetric, { label: "Processing", value: stats.processing }), _jsx(TaskQueueMetric, { label: "Completed (1h)", value: stats.completed_last_hour }), _jsx(TaskQueueMetric, { label: "Failed (1h)", value: stats.failed_last_hour, tone: stats.failed_last_hour > 0 ? "danger" : "default" }), _jsx(TaskQueueMetric, { label: "Oldest pending", value: formatAgeSeconds(stats.oldest_pending_age_seconds), icon: IconClockHour4, tone: stats.oldest_pending_age_seconds > 300 ? "warning" : "default" })] }), stats.recent_failures.length > 0 && (_jsxs("div", { className: "rounded-2xl border bg-card p-4", children: [_jsx("div", { className: "text-sm font-semibold text-foreground", children: "Recent failures" }), _jsx("div", { className: "mt-3 space-y-2", children: stats.recent_failures.map((failure) => (_jsxs("div", { className: "rounded-xl border bg-muted/30 px-3 py-2", children: [_jsxs("div", { className: "flex items-center justify-between gap-2 text-xs text-muted-foreground", children: [_jsx("span", { className: "font-medium text-foreground", children: failure.platform }), _jsxs("span", { children: [failure.attempts, " attempt", failure.attempts === 1 ? "" : "s"] })] }), _jsx("div", { className: "mt-1 truncate text-sm text-foreground", children: failure.error || "(no error message)" })] }, failure.id))) })] }))] }));
}
function HelpTooltip({ content }) {
    return (_jsxs(Tooltip, { children: [_jsx(TooltipTrigger, { asChild: true, children: _jsx("button", { type: "button", className: "text-muted-foreground/60 hover:text-foreground cursor-pointer", children: _jsx(IconInfoCircle, { className: "h-3.5 w-3.5" }) }) }), _jsx(TooltipContent, { side: "top", className: "max-w-64 text-xs leading-relaxed", children: content })] }));
}
function StatCard({ label, help, value, icon: Icon, cta, }) {
    return (_jsxs("div", { className: "rounded-2xl border bg-card p-5", children: [_jsxs("div", { className: "flex items-start justify-between gap-3", children: [_jsxs("div", { className: "min-w-0", children: [_jsxs("div", { className: "flex items-center gap-1.5 text-sm font-medium text-foreground", children: [_jsx("span", { children: label }), _jsx(HelpTooltip, { content: help })] }), _jsx("div", { className: "mt-3 text-3xl font-semibold text-foreground", children: value })] }), _jsx("div", { className: "rounded-xl border bg-muted/30 p-3 text-muted-foreground", children: _jsx(Icon, { size: 18 }) })] }), cta ? _jsx("div", { className: "mt-4", children: cta }) : null] }));
}
function StepRow({ step }) {
    const done = step.complete && !step.informational;
    return (_jsxs("div", { className: `flex items-start gap-4 rounded-xl border px-5 py-4 ${done ? "border-border/50 bg-muted/20" : "bg-card"}`, children: [_jsx("div", { className: "flex-none pt-0.5", children: done ? (_jsx("div", { className: "flex h-7 w-7 items-center justify-center rounded-full bg-emerald-500/15 text-emerald-600 dark:text-emerald-400", children: _jsx(IconCheck, { size: 16, strokeWidth: 2.5 }) })) : (_jsx("div", { className: "flex h-7 w-7 items-center justify-center rounded-full border border-muted-foreground/30 text-muted-foreground", children: _jsx(IconListCheck, { size: 15 }) })) }), _jsxs("div", { className: `min-w-0 flex-1 ${done ? "opacity-50" : ""}`, children: [_jsx("div", { className: `text-sm font-semibold ${done ? "line-through decoration-muted-foreground/40" : "text-foreground"}`, children: step.title }), _jsx("p", { className: "mt-0.5 text-sm leading-relaxed text-muted-foreground", children: step.description })] }), step.to && !done && (_jsx("div", { className: "flex-none pt-0.5", children: _jsx(Button, { variant: "outline", size: "sm", asChild: true, children: _jsx(Link, { to: step.to, children: step.actionLabel || "Set up" }) }) }))] }));
}
export function meta() {
    return [{ title: "Overview — Dispatch" }];
}
export default function OverviewRoute() {
    const { data, isLoading } = useActionQuery("list-dispatch-overview", {});
    const { data: connectedAgents } = useActionQuery("list-connected-agents", {});
    const { data: workspaceApps = [], isLoading: appsLoading } = useActionQuery("list-workspace-apps", { includeAgentCards: false }, {
        refetchInterval: 2_000,
    });
    const [integrationStatuses, setIntegrationStatuses] = useState([]);
    const [taskQueueStats, setTaskQueueStats] = useState(ZERO_TASK_QUEUE_STATS);
    useEffect(() => {
        let active = true;
        fetch(agentNativePath("/_agent-native/integrations/status"))
            .then((res) => (res.ok ? res.json() : []))
            .then((rows) => {
            if (active) {
                setIntegrationStatuses(Array.isArray(rows) ? rows : []);
            }
        })
            .catch(() => {
            if (active)
                setIntegrationStatuses([]);
        });
        return () => {
            active = false;
        };
    }, []);
    useEffect(() => {
        let active = true;
        const load = () => {
            fetch(agentNativePath("/_agent-native/integrations/task-queue/status"))
                .then((res) => (res.ok ? res.json() : null))
                .then((stats) => {
                if (!active || !stats || typeof stats !== "object")
                    return;
                setTaskQueueStats({
                    pending: Number(stats.pending ?? 0),
                    processing: Number(stats.processing ?? 0),
                    completed_last_hour: Number(stats.completed_last_hour ?? 0),
                    failed_last_hour: Number(stats.failed_last_hour ?? 0),
                    oldest_pending_age_seconds: Number(stats.oldest_pending_age_seconds ?? 0),
                    recent_failures: Array.isArray(stats.recent_failures)
                        ? stats.recent_failures
                        : [],
                });
            })
                .catch(() => {
                // Endpoint may not exist on older deploys — ignore.
            });
        };
        load();
        const id = window.setInterval(load, 15000);
        return () => {
            active = false;
            window.clearInterval(id);
        };
    }, []);
    const counts = data?.counts || {
        destinations: 0,
        pendingApprovals: 0,
        linkedIdentities: 0,
        activeTokens: 0,
    };
    const messagingStatuses = useMemo(() => integrationStatuses.filter((row) => row.platform === "slack" || row.platform === "telegram"), [integrationStatuses]);
    const connectedMessagingCount = messagingStatuses.filter((row) => row.enabled || row.configured).length;
    const connectedAgentCount = connectedAgents?.length || 0;
    const vaultSecretCount = data?.vault?.secretCount || 0;
    const typedWorkspaceApps = workspaceApps;
    const messagingDone = connectedMessagingCount > 0;
    const agentsDone = connectedAgentCount > 0;
    const vaultDone = vaultSecretCount > 0;
    const steps = [
        {
            number: 1,
            title: "Connect Slack",
            description: "Add @agent-native to your Slack workspace so your team can ask questions, create decks, pull analytics, and more — right from Slack.",
            complete: messagingDone,
            to: "/messaging",
            actionLabel: "Connect",
        },
        {
            number: 2,
            title: "Review connected agents",
            description: "Dispatch delegates work to specialized apps. The built-in suite (Slides, Analytics, Content, Video, and more) is available automatically.",
            complete: agentsDone,
            to: "/agents",
            actionLabel: "Review",
        },
        {
            number: 3,
            title: "Set up your vault",
            description: "Store API keys centrally and sync them to apps that need them.",
            complete: vaultDone,
            to: "/vault",
            actionLabel: "Open vault",
        },
        {
            number: 4,
            title: "Try it out",
            description: "Mention @agent-native in any Slack channel to get started.",
            complete: false,
            informational: true,
        },
    ];
    const hasIncompleteSteps = steps.some((s) => !s.complete && !s.informational);
    return (_jsxs(DispatchShell, { title: "Overview", description: "Create apps, manage shared keys, and route work across your workspace.", children: [_jsx(HomeChatPanel, {}), _jsx(WorkspaceAppsSection, { apps: typedWorkspaceApps, isLoading: appsLoading }), hasIncompleteSteps && (_jsxs("section", { className: "space-y-3", children: [_jsxs("div", { className: "flex items-center gap-2", children: [_jsx(IconRocket, { size: 16, className: "text-muted-foreground" }), _jsx("h2", { className: "text-sm font-semibold text-foreground", children: "Getting started" })] }), _jsx("div", { className: "space-y-2", children: steps.map((step) => (_jsx(StepRow, { step: step }, step.number))) })] })), _jsxs("section", { className: "space-y-3", children: [_jsxs("div", { className: "flex items-center gap-2", children: [_jsx(IconActivity, { size: 16, className: "text-muted-foreground" }), _jsx("h2", { className: "text-sm font-semibold text-foreground", children: "At a glance" })] }), _jsxs("div", { className: "grid gap-4 md:grid-cols-2 xl:grid-cols-4", children: [_jsx(StatCard, { label: "Vault secrets", help: "Credentials stored in the workspace vault. Grant them to apps from the Vault page.", value: data?.vault?.secretCount || 0, icon: IconKey, cta: (data?.vault?.secretCount || 0) === 0 ? (_jsx(Button, { variant: "outline", size: "sm", asChild: true, children: _jsx(Link, { to: "/vault", children: "Set up vault" }) })) : undefined }), _jsx(StatCard, { label: "Active grants", help: "Secrets currently granted to apps. Sync them to push credentials.", value: data?.vault?.activeGrantCount || 0, icon: IconShieldCheck }), _jsx(StatCard, { label: "Destinations", help: "Saved outbound targets used for proactive sends and scheduled jobs.", value: counts.destinations, icon: IconArrowUpRight, cta: counts.destinations === 0 ? (_jsx(Button, { variant: "outline", size: "sm", asChild: true, children: _jsx(Link, { to: "/destinations", children: "Set up destinations" }) })) : undefined }), _jsx(StatCard, { label: "Agents", help: "Agents available to dispatch for delegation over A2A. This includes the built-in app suite plus any additional agents you add.", value: connectedAgentCount, icon: IconPlugConnected, cta: connectedAgentCount === 0 ? (_jsx(Button, { variant: "outline", size: "sm", asChild: true, children: _jsx(Link, { to: "/agents", children: "Open agents" }) })) : undefined })] })] }), _jsxs("details", { className: "rounded-xl border", children: [_jsxs("summary", { className: "flex cursor-pointer list-none items-center justify-between gap-3 px-5 py-4 text-sm font-semibold text-foreground hover:bg-muted/30 [&::-webkit-details-marker]:hidden", children: [_jsx("span", { children: "Operations detail" }), _jsx("span", { className: "text-xs font-normal text-muted-foreground", children: "Queue, audit, and approvals" })] }), _jsxs("div", { className: "space-y-5 border-t px-5 py-5", children: [_jsx(TaskQueueSection, { stats: taskQueueStats }), _jsxs("div", { className: "grid gap-4 xl:grid-cols-3", children: [_jsxs("section", { className: "rounded-2xl border bg-card p-5 xl:col-span-2", children: [_jsx("div", { className: "flex items-center justify-between", children: _jsx("h2", { className: "text-lg font-semibold text-foreground", children: "Recent activity" }) }), _jsx(RecentActivityList, { isLoading: isLoading, events: data?.recentAudit ?? [] })] }), _jsxs("section", { className: "rounded-2xl border bg-card p-5", children: [_jsx("h2", { className: "text-lg font-semibold text-foreground", children: "Approval mode" }), _jsxs("div", { className: "mt-4 rounded-xl border bg-muted/30 p-4", children: [_jsx("div", { className: "text-sm font-medium text-muted-foreground", children: "Current policy" }), _jsx("div", { className: "mt-2 text-2xl font-semibold text-foreground", children: data?.settings?.enabled ? "Reviewed" : "Immediate" }), _jsx("p", { className: "mt-2 text-sm text-muted-foreground", children: data?.settings?.enabled
                                                            ? "Changes wait for approval before they apply."
                                                            : "Changes apply immediately and are recorded in audit." })] }), _jsxs("div", { className: "mt-4 space-y-2", children: [(data?.recentApprovals || []).map((approval) => (_jsxs("div", { className: "rounded-xl border px-4 py-3", children: [_jsx("div", { className: "text-sm font-medium text-foreground", children: approval.summary }), _jsxs("div", { className: "mt-1 text-xs text-muted-foreground", children: [approval.status, " \u00B7 requested by ", approval.requestedBy] })] }, approval.id))), (data?.recentApprovals?.length || 0) === 0 && (_jsx("div", { className: "rounded-xl border border-dashed px-4 py-6 text-sm text-muted-foreground", children: "No approval requests." }))] })] })] })] })] })] }));
}
//# sourceMappingURL=overview.js.map