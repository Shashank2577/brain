import { jsx as _jsx, jsxs as _jsxs, Fragment as _Fragment } from "react/jsx-runtime";
import { useEffect, useMemo, useState } from "react";
import { agentNativePath, useActionQuery } from "@agent-native/core/client";
import { IconDatabase, IconFileSearch, IconRefresh, IconSearch, } from "@tabler/icons-react";
import { DispatchShell } from "../../components/dispatch-shell.js";
import { Alert, AlertDescription, AlertTitle } from "../../components/ui/alert.js";
import { Badge } from "../../components/ui/badge.js";
import { Button } from "../../components/ui/button.js";
import { Input } from "../../components/ui/input.js";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue, } from "../../components/ui/select.js";
import { Skeleton } from "../../components/ui/skeleton.js";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "../../components/ui/tabs.js";
import { cn } from "../../lib/utils.js";
export function meta() {
    return [{ title: "Thread Debug — Dispatch" }];
}
function formatDate(value) {
    if (value == null || value === "")
        return "n/a";
    const numeric = Number(value);
    const date = Number.isFinite(numeric) ? new Date(numeric) : new Date(value);
    if (Number.isNaN(date.getTime()))
        return "n/a";
    return date.toLocaleString();
}
function json(value) {
    try {
        return JSON.stringify(value, null, 2);
    }
    catch {
        return String(value);
    }
}
function eventLabel(event) {
    if (!event || typeof event !== "object")
        return "event";
    if (event.type === "tool_start")
        return `tool_start · ${event.tool}`;
    if (event.type === "tool_done")
        return `tool_done · ${event.tool}`;
    if (event.type === "text")
        return "text";
    if (event.type === "error")
        return `error · ${event.errorCode ?? "agent"}`;
    return String(event.type ?? "event");
}
function messageTitle(message) {
    const role = message.role || "unknown";
    return `${role.charAt(0).toUpperCase()}${role.slice(1)} ${message.index + 1}`;
}
function toolParts(message) {
    return message.contentParts.filter((part) => part?.type === "tool-call");
}
function RawBlock({ value, className, }) {
    return (_jsx("pre", { className: cn("max-h-[520px] overflow-auto rounded-lg border bg-muted/30 p-3 text-xs leading-relaxed text-foreground", "whitespace-pre-wrap break-words", className), children: typeof value === "string" ? value : json(value) }));
}
function SourceBadge({ source }) {
    return (_jsx(Badge, { variant: source.current ? "default" : "secondary", children: source.current ? "current" : source.kind }));
}
function ResultCard({ result, selected, onSelect, }) {
    return (_jsxs("button", { type: "button", onClick: onSelect, className: cn("w-full rounded-lg border px-3 py-3 text-left transition-colors", selected
            ? "border-foreground bg-muted"
            : "bg-card hover:border-foreground/30 hover:bg-muted/40"), children: [_jsxs("div", { className: "flex items-start justify-between gap-3", children: [_jsxs("div", { className: "min-w-0", children: [_jsx("div", { className: "truncate text-sm font-medium text-foreground", children: result.title || result.preview || result.id }), _jsx("div", { className: "mt-1 truncate font-mono text-[11px] text-muted-foreground", children: result.id })] }), _jsx(Badge, { variant: "outline", className: "shrink-0", children: result.messageCount })] }), _jsx("div", { className: "mt-2 line-clamp-3 text-xs leading-relaxed text-muted-foreground", children: result.snippet || result.preview || "No preview" }), _jsxs("div", { className: "mt-2 flex items-center justify-between gap-3 text-[11px] text-muted-foreground", children: [_jsx("span", { className: "truncate", children: result.ownerEmail }), _jsx("span", { className: "shrink-0", children: formatDate(result.updatedAt) })] })] }));
}
function MessageBlock({ message }) {
    const tools = toolParts(message);
    return (_jsxs("div", { className: "rounded-lg border bg-card", children: [_jsxs("div", { className: "flex flex-wrap items-center justify-between gap-2 border-b px-3 py-2", children: [_jsxs("div", { className: "flex min-w-0 items-center gap-2", children: [_jsx(Badge, { variant: message.role === "assistant" ? "default" : "secondary", children: message.role }), _jsx("span", { className: "truncate text-sm font-medium text-foreground", children: messageTitle(message) })] }), _jsxs("div", { className: "flex items-center gap-2 text-[11px] text-muted-foreground", children: [message.attachments.length > 0 ? (_jsxs(Badge, { variant: "outline", children: [message.attachments.length, " files"] })) : null, _jsx("span", { children: formatDate(message.createdAt) })] })] }), _jsxs("div", { className: "space-y-3 px-3 py-3", children: [message.text ? (_jsx("div", { className: "whitespace-pre-wrap break-words text-sm leading-relaxed text-foreground", children: message.text })) : (_jsx("div", { className: "text-sm text-muted-foreground", children: "No text content" })), tools.length > 0 ? (_jsx("div", { className: "space-y-2", children: tools.map((tool, index) => (_jsxs("details", { className: "rounded-md border bg-muted/30 px-3 py-2", children: [_jsx("summary", { className: "cursor-pointer text-xs font-medium text-foreground", children: tool.toolName ?? tool.name ?? "tool-call" }), _jsx(RawBlock, { value: tool, className: "mt-2 max-h-72" })] }, `${message.id ?? message.index}-tool-${index}`))) })) : null] })] }));
}
function ThreadDetail({ detail }) {
    const rawBundle = useMemo(() => ({
        thread: detail.thread,
        debug: detail.debug,
        debugRuns: detail.debugRuns,
        queuedMessages: detail.queuedMessages,
        threadData: detail.threadData,
        runs: detail.runs,
        traces: detail.traces,
        feedback: detail.feedback,
        satisfaction: detail.satisfaction,
        evals: detail.evals,
        checkpoints: detail.checkpoints,
    }), [detail]);
    return (_jsxs("div", { className: "rounded-lg border bg-card", children: [_jsxs("div", { className: "border-b px-4 py-3", children: [_jsxs("div", { className: "flex flex-wrap items-start justify-between gap-3", children: [_jsxs("div", { className: "min-w-0", children: [_jsx("div", { className: "truncate text-base font-semibold text-foreground", children: detail.thread.title || detail.thread.preview || detail.thread.id }), _jsx("div", { className: "mt-1 truncate font-mono text-xs text-muted-foreground", children: detail.thread.id })] }), _jsxs("div", { className: "flex flex-wrap items-center gap-2", children: [_jsxs(Badge, { variant: "secondary", children: [detail.messages.length, " messages"] }), _jsxs(Badge, { variant: "secondary", children: [detail.runs.length, " runs"] }), _jsx(Badge, { variant: "outline", children: detail.source.label })] })] }), _jsxs("div", { className: "mt-3 grid gap-2 text-xs text-muted-foreground sm:grid-cols-3", children: [_jsxs("div", { className: "truncate", children: ["Owner: ", detail.thread.ownerEmail] }), _jsxs("div", { children: ["Created: ", formatDate(detail.thread.createdAt)] }), _jsxs("div", { children: ["Updated: ", formatDate(detail.thread.updatedAt)] })] })] }), _jsxs(Tabs, { defaultValue: "transcript", className: "p-4", children: [_jsxs(TabsList, { children: [_jsx(TabsTrigger, { value: "transcript", children: "Transcript" }), _jsx(TabsTrigger, { value: "runs", children: "Runs" }), _jsx(TabsTrigger, { value: "internals", children: "Internals" }), _jsx(TabsTrigger, { value: "raw", children: "Raw" })] }), _jsx(TabsContent, { value: "transcript", className: "mt-4 space-y-3", children: detail.messages.length > 0 ? (detail.messages.map((message) => (_jsx(MessageBlock, { message: message }, message.id ?? `message-${message.index}`)))) : (_jsx("div", { className: "rounded-lg border border-dashed px-4 py-8 text-center text-sm text-muted-foreground", children: "No persisted messages." })) }), _jsx(TabsContent, { value: "runs", className: "mt-4 space-y-3", children: detail.runs.length > 0 ? (detail.runs.map((run) => (_jsxs("details", { className: "rounded-lg border bg-card", children: [_jsx("summary", { className: "cursor-pointer px-4 py-3", children: _jsxs("div", { className: "inline-flex flex-wrap items-center gap-2", children: [_jsx(Badge, { variant: "outline", children: run.status }), _jsx("span", { className: "font-mono text-xs text-foreground", children: run.id }), _jsx("span", { className: "text-xs text-muted-foreground", children: formatDate(run.startedAt) })] }) }), _jsxs("div", { className: "space-y-2 border-t px-4 py-3", children: [run.events.map((event) => (_jsxs("details", { className: "rounded-md border bg-muted/30 px-3 py-2", children: [_jsxs("summary", { className: "cursor-pointer text-xs font-medium text-foreground", children: ["#", event.seq, " ", eventLabel(event.event)] }), _jsx(RawBlock, { value: event.event, className: "mt-2 max-h-72" })] }, `${run.id}-${event.seq}`))), run.events.length === 0 ? (_jsx("div", { className: "text-sm text-muted-foreground", children: "No retained run events." })) : null] })] }, run.id)))) : (_jsx("div", { className: "rounded-lg border border-dashed px-4 py-8 text-center text-sm text-muted-foreground", children: "No retained runs." })) }), _jsx(TabsContent, { value: "internals", className: "mt-4 space-y-4", children: _jsxs("div", { className: "grid gap-4 lg:grid-cols-2", children: [_jsxs("div", { children: [_jsx("div", { className: "mb-2 text-sm font-medium text-foreground", children: "Debug Runs" }), _jsx(RawBlock, { value: detail.debugRuns.length > 0
                                                ? detail.debugRuns
                                                : (detail.debug ?? {}) })] }), _jsxs("div", { children: [_jsx("div", { className: "mb-2 text-sm font-medium text-foreground", children: "Trace Summaries" }), _jsx(RawBlock, { value: detail.traces.summaries })] }), _jsxs("div", { children: [_jsx("div", { className: "mb-2 text-sm font-medium text-foreground", children: "Trace Spans" }), _jsx(RawBlock, { value: detail.traces.spans })] }), _jsxs("div", { children: [_jsx("div", { className: "mb-2 text-sm font-medium text-foreground", children: "Feedback And Evals" }), _jsx(RawBlock, { value: {
                                                feedback: detail.feedback,
                                                satisfaction: detail.satisfaction,
                                                evals: detail.evals,
                                                checkpoints: detail.checkpoints,
                                            } })] })] }) }), _jsxs(TabsContent, { value: "raw", className: "mt-4 space-y-4", children: [_jsx(RawBlock, { value: rawBundle }), _jsx(RawBlock, { value: detail.rawThreadData })] })] })] }));
}
export default function ThreadDebugRoute() {
    const [sourceId, setSourceId] = useState("current");
    const [query, setQuery] = useState("");
    const [ownerEmail, setOwnerEmail] = useState("");
    const [threadId, setThreadId] = useState("");
    const [submittedSearch, setSubmittedSearch] = useState({
        sourceId: "current",
        query: "",
        ownerEmail: "",
    });
    const [selected, setSelected] = useState(null);
    const { data: sourcesData, isLoading: sourcesLoading } = useActionQuery("list-agent-thread-sources", {});
    const sources = sourcesData?.sources ?? [];
    const searchParams = useMemo(() => ({
        sourceId: submittedSearch.sourceId,
        query: submittedSearch.query || undefined,
        ownerEmail: submittedSearch.ownerEmail || undefined,
        limit: 25,
    }), [submittedSearch]);
    const { data: searchData, isLoading: searchLoading, error: searchError, refetch: refetchSearch, } = useActionQuery("search-agent-threads", searchParams);
    const detailParams = useMemo(() => ({
        sourceId: selected?.sourceId ?? "current",
        threadId: selected?.threadId ?? "",
        ownerEmail: selected?.ownerEmail,
        maxRuns: 20,
        maxEvents: 800,
        maxTraceSpans: 600,
    }), [selected]);
    const { data: detail, isLoading: detailLoading, error: detailError, } = useActionQuery("get-agent-thread-debug", detailParams, {
        enabled: Boolean(selected?.threadId),
    });
    const selectedSource = sources.find((source) => source.id === sourceId);
    useEffect(() => {
        fetch(agentNativePath("/_agent-native/application-state/navigation"), {
            method: "PUT",
            keepalive: true,
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
                view: "thread-debug",
                path: typeof window === "undefined"
                    ? "/thread-debug"
                    : window.location.pathname,
                sourceId,
                query,
                ownerEmail: ownerEmail.trim() || undefined,
                threadId: selected?.threadId ?? (threadId.trim() || undefined),
            }),
        }).catch(() => { });
    }, [ownerEmail, query, selected?.threadId, sourceId, threadId]);
    return (_jsx(DispatchShell, { title: "Thread Debug", description: "Inspect persisted agent chat threads, run events, and AI internals.", children: _jsxs("div", { className: "space-y-4", children: [_jsxs("section", { className: "rounded-lg border bg-card p-4", children: [_jsxs("div", { className: "grid gap-3 lg:grid-cols-[220px_1fr_260px_auto]", children: [_jsxs(Select, { value: sourceId, onValueChange: setSourceId, children: [_jsx(SelectTrigger, { children: _jsx(SelectValue, { placeholder: "Source" }) }), _jsxs(SelectContent, { children: [sources.map((source) => (_jsx(SelectItem, { value: source.id, children: source.label }, source.id))), sources.length === 0 ? (_jsx(SelectItem, { value: "current", children: "Current Dispatch DB" })) : null] })] }), _jsx(Input, { value: query, onChange: (event) => setQuery(event.target.value), placeholder: "Search title, preview, messages, tools" }), _jsx(Input, { value: ownerEmail, onChange: (event) => setOwnerEmail(event.target.value), placeholder: "Owner email" }), _jsxs(Button, { type: "button", onClick: () => setSubmittedSearch({
                                        sourceId,
                                        query: query.trim(),
                                        ownerEmail: ownerEmail.trim(),
                                    }), children: [_jsx(IconSearch, { size: 16 }), "Search"] })] }), _jsxs("div", { className: "mt-3 grid gap-3 lg:grid-cols-[1fr_auto]", children: [_jsx(Input, { value: threadId, onChange: (event) => setThreadId(event.target.value), placeholder: "Paste thread ID", className: "font-mono" }), _jsxs(Button, { type: "button", variant: "outline", onClick: () => {
                                        const trimmed = threadId.trim();
                                        if (!trimmed)
                                            return;
                                        setSelected({
                                            sourceId,
                                            threadId: trimmed,
                                            ownerEmail: ownerEmail.trim() || undefined,
                                        });
                                    }, children: [_jsx(IconFileSearch, { size: 16 }), "Inspect"] })] }), _jsxs("div", { className: "mt-3 flex flex-wrap items-center gap-2 text-xs text-muted-foreground", children: [sourcesLoading ? _jsx(Skeleton, { className: "h-5 w-32" }) : null, selectedSource ? _jsx(SourceBadge, { source: selectedSource }) : null, selectedSource?.databaseUrlEnv ? (_jsx(Badge, { variant: "outline", className: "font-mono", children: selectedSource.databaseUrlEnv })) : null, sourcesData?.access ? (_jsxs("span", { children: [sourcesData.access.viewerEmail, " \u00B7", " ", sourcesData.access.canInspectAll ? "admin scope" : "own scope"] })) : null] })] }), searchError ? (_jsxs(Alert, { variant: "destructive", children: [_jsx(AlertTitle, { children: "Search failed" }), _jsx(AlertDescription, { children: String(searchError.message) })] })) : null, _jsxs("div", { className: "grid gap-4 xl:grid-cols-[380px_1fr]", children: [_jsxs("section", { className: "min-h-[520px] rounded-lg border bg-card", children: [_jsxs("div", { className: "flex items-center justify-between border-b px-4 py-3", children: [_jsxs("div", { children: [_jsx("div", { className: "text-sm font-semibold text-foreground", children: "Threads" }), _jsxs("div", { className: "text-xs text-muted-foreground", children: [searchData?.count ?? 0, " results \u00B7", " ", searchData?.access?.scope ?? "current scope"] })] }), _jsx(Button, { type: "button", variant: "ghost", size: "icon", onClick: () => refetchSearch(), "aria-label": "Refresh threads", children: _jsx(IconRefresh, { size: 16 }) })] }), _jsxs("div", { className: "max-h-[760px] space-y-2 overflow-auto p-3", children: [searchLoading ? (_jsxs(_Fragment, { children: [_jsx(Skeleton, { className: "h-28 w-full rounded-lg" }), _jsx(Skeleton, { className: "h-28 w-full rounded-lg" }), _jsx(Skeleton, { className: "h-28 w-full rounded-lg" })] })) : null, !searchLoading && (searchData?.threads?.length ?? 0) === 0 ? (_jsxs("div", { className: "flex min-h-64 flex-col items-center justify-center rounded-lg border border-dashed px-4 text-center text-sm text-muted-foreground", children: [_jsx(IconDatabase, { className: "mb-2 h-5 w-5" }), "No threads found."] })) : null, searchData?.threads?.map((result) => (_jsx(ResultCard, { result: result, selected: selected?.threadId === result.id, onSelect: () => setSelected({
                                                sourceId: submittedSearch.sourceId,
                                                threadId: result.id,
                                                ownerEmail: submittedSearch.ownerEmail || undefined,
                                            }) }, result.id)))] })] }), _jsxs("section", { className: "min-w-0", children: [detailError ? (_jsxs(Alert, { variant: "destructive", children: [_jsx(AlertTitle, { children: "Thread lookup failed" }), _jsx(AlertDescription, { children: String(detailError.message) })] })) : null, detailLoading ? (_jsxs("div", { className: "rounded-lg border bg-card p-4", children: [_jsx(Skeleton, { className: "h-6 w-72" }), _jsx(Skeleton, { className: "mt-3 h-4 w-96" }), _jsx(Skeleton, { className: "mt-6 h-[520px] w-full" })] })) : detail ? (_jsx(ThreadDetail, { detail: detail })) : (_jsxs("div", { className: "flex min-h-[520px] flex-col items-center justify-center rounded-lg border border-dashed bg-card px-4 text-center text-sm text-muted-foreground", children: [_jsx(IconFileSearch, { className: "mb-2 h-5 w-5" }), "Select or inspect a thread."] }))] })] })] }) }));
}
//# sourceMappingURL=thread-debug.js.map