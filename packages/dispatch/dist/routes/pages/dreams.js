import { jsx as _jsx, jsxs as _jsxs } from "react/jsx-runtime";
import { useEffect, useMemo, useState } from "react";
import { useSearchParams } from "react-router";
import { useActionMutation, useActionQuery } from "@agent-native/core/client";
import { toast } from "sonner";
import { IconAlertTriangle, IconBrain, IconCalendarTime, IconCheck, IconCircleDashed, IconClock, IconDatabase, IconFileDiff, IconPlayerPlay, IconRefresh, IconSettings, IconX, } from "@tabler/icons-react";
import { DispatchShell } from "../../components/dispatch-shell.js";
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger, } from "../../components/ui/accordion.js";
import { Alert, AlertDescription, AlertTitle } from "../../components/ui/alert.js";
import { Badge } from "../../components/ui/badge.js";
import { Button } from "../../components/ui/button.js";
import { Input } from "../../components/ui/input.js";
import { Label } from "../../components/ui/label.js";
import { ScrollArea } from "../../components/ui/scroll-area.js";
import { Separator } from "../../components/ui/separator.js";
import { Sheet, SheetContent, SheetDescription, SheetFooter, SheetHeader, SheetTitle, SheetTrigger, } from "../../components/ui/sheet.js";
import { Skeleton } from "../../components/ui/skeleton.js";
import { Spinner } from "../../components/ui/spinner.js";
import { Switch } from "../../components/ui/switch.js";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow, } from "../../components/ui/table.js";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "../../components/ui/tabs.js";
import { Textarea } from "../../components/ui/textarea.js";
import { cn } from "../../lib/utils.js";
import { dreamSettingsToDraft, dreamSettingsUpdateFromDraft, splitSourceIds, } from "./dream-settings.js";
export function meta() {
    return [{ title: "Dreams — Dispatch" }];
}
function normalizeArray(value, keys) {
    if (Array.isArray(value))
        return value;
    if (!value || typeof value !== "object")
        return [];
    const record = value;
    for (const key of keys) {
        if (Array.isArray(record[key]))
            return record[key];
    }
    return [];
}
function normalizeSourceHealth(value) {
    if (!value || typeof value !== "object" || Array.isArray(value))
        return [];
    const record = value;
    if (Array.isArray(record.sources)) {
        return record.sources;
    }
    if (Array.isArray(record.sourceHealth)) {
        return record.sourceHealth;
    }
    return [];
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
function compactDate(value) {
    if (value == null || value === "")
        return "n/a";
    const numeric = Number(value);
    const date = Number.isFinite(numeric) ? new Date(numeric) : new Date(value);
    if (Number.isNaN(date.getTime()))
        return "n/a";
    return date.toLocaleDateString(undefined, {
        month: "short",
        day: "numeric",
        hour: "numeric",
        minute: "2-digit",
    });
}
function json(value) {
    try {
        return JSON.stringify(value, null, 2);
    }
    catch {
        return String(value);
    }
}
function plural(value, singular, pluralLabel = `${singular}s`) {
    return `${value} ${value === 1 ? singular : pluralLabel}`;
}
function dreamLabel(dream, index) {
    return dream.title || `Dream pass ${index + 1}`;
}
function proposalTarget(proposal) {
    return (proposal.targetPath ||
        proposal.path ||
        proposal.target ||
        proposal.targetType ||
        proposal.type ||
        "memory");
}
function evidenceLabel(evidence, index) {
    return (evidence.label ||
        evidence.title ||
        evidence.threadTitle ||
        evidence.source ||
        evidence.threadId ||
        evidence.runId ||
        `Evidence ${index + 1}`);
}
function candidateLabel(candidate) {
    return (candidate.thread?.title ||
        candidate.title ||
        candidate.summary ||
        candidate.thread?.preview ||
        candidate.preview ||
        candidate.thread?.id ||
        candidate.threadId ||
        candidate.runId ||
        candidate.id ||
        "candidate");
}
function candidateSignals(candidate) {
    const reasons = (candidate.reasons ?? []).map((reason) => typeof reason === "string" ? reason : reason.label);
    return [...reasons, ...(candidate.signals ?? [])].filter(Boolean);
}
function candidateId(candidate) {
    return (candidate.id ||
        candidate.thread?.id ||
        candidate.threadId ||
        candidate.runId ||
        candidateLabel(candidate));
}
function candidateStatus(candidate) {
    return candidate.latestRunStatus || candidate.status || "unknown";
}
function candidateOwner(candidate) {
    return candidate.thread?.ownerEmail || candidate.ownerEmail || "n/a";
}
function candidateUpdatedAt(candidate) {
    return (candidate.updatedAt ||
        candidate.completedAt ||
        candidate.startedAt ||
        candidate.thread?.updatedAt ||
        null);
}
function dreamProposalCount(dream) {
    return dream.proposalCount ?? dream.proposalCounts?.total ?? 0;
}
function dreamInspectedCount(dream) {
    return dream.inspectedThreadCount ?? dream.inspectedRunCount ?? 0;
}
function resultDreamId(result) {
    return result?.dream?.id || result?.dreamId || result?.id || null;
}
function statusVariant(status) {
    const normalized = String(status || "pending").toLowerCase();
    if (normalized === "failed")
        return "destructive";
    if (normalized === "completed" || normalized === "applied")
        return "default";
    if (normalized === "rejected" || normalized === "stale")
        return "outline";
    return "secondary";
}
function sourceStatusVariant(status) {
    const normalized = String(status || "ok").toLowerCase();
    if (normalized === "error" || normalized === "timed_out") {
        return "destructive";
    }
    return "secondary";
}
function StatusBadge({ status }) {
    const normalized = String(status || "pending").toLowerCase();
    return (_jsx(Badge, { variant: statusVariant(status), className: "capitalize", children: normalized.replace(/_/g, " ") }));
}
function SourceHealthPanel({ sources }) {
    if (sources.length === 0)
        return null;
    const unhealthyCount = sources.filter((source) => String(source.status).toLowerCase() !== "ok").length;
    return (_jsxs(Alert, { variant: unhealthyCount > 0 ? "destructive" : "default", children: [_jsx(IconDatabase, { className: "h-4 w-4" }), _jsx(AlertTitle, { children: "Source health" }), _jsx(AlertDescription, { children: _jsx("div", { className: "mt-2 flex flex-wrap gap-1.5", children: sources.map((source) => (_jsxs(Badge, { variant: sourceStatusVariant(source.status), className: "gap-1", title: source.message ||
                            `${source.inspectedThreadCount} inspected, ${source.candidateCount} candidates, ${source.durationMs}ms of ${source.timeoutMs ?? "n/a"}ms`, children: [source.label || source.sourceId, ":", " ", String(source.status).replace(/_/g, " "), " \u00B7 ", source.durationMs, "ms"] }, source.sourceId))) }) })] }));
}
function isApprovalRequestResult(value) {
    if (!value || typeof value !== "object")
        return false;
    const record = value;
    const result = record.result;
    return result?.approvalRequired === true;
}
function QueryState({ error, label }) {
    if (!error)
        return null;
    return (_jsxs(Alert, { variant: "destructive", children: [_jsx(IconAlertTriangle, { className: "h-4 w-4" }), _jsx(AlertTitle, { children: label }), _jsx(AlertDescription, { children: error instanceof Error ? error.message : String(error) })] }));
}
function RawBlock({ value }) {
    return (_jsx("pre", { className: "max-h-64 overflow-auto rounded-md border bg-muted/30 p-3 text-xs leading-relaxed text-foreground whitespace-pre-wrap break-words", children: typeof value === "string" ? value : json(value) }));
}
function EmptyPanel({ title, description, }) {
    return (_jsxs("div", { className: "rounded-lg border border-dashed bg-muted/20 px-4 py-8 text-center", children: [_jsx("div", { className: "text-sm font-medium text-foreground", children: title }), _jsx("div", { className: "mx-auto mt-1 max-w-md text-xs leading-relaxed text-muted-foreground", children: description })] }));
}
function DreamListSkeleton() {
    return (_jsx("div", { className: "space-y-2", children: Array.from({ length: 5 }).map((_, index) => (_jsxs("div", { className: "rounded-lg border p-3", children: [_jsx(Skeleton, { className: "h-4 w-2/3" }), _jsx(Skeleton, { className: "mt-2 h-3 w-full" }), _jsx(Skeleton, { className: "mt-2 h-3 w-1/2" })] }, index))) }));
}
function ProposalSkeleton() {
    return (_jsx("div", { className: "space-y-3", children: Array.from({ length: 3 }).map((_, index) => (_jsxs("div", { className: "rounded-lg border p-4", children: [_jsx(Skeleton, { className: "h-4 w-1/2" }), _jsx(Skeleton, { className: "mt-3 h-3 w-full" }), _jsx(Skeleton, { className: "mt-2 h-3 w-3/4" })] }, index))) }));
}
function StatTile({ label, value, icon: Icon, }) {
    return (_jsx("div", { className: "rounded-lg border bg-card px-3 py-2.5", children: _jsxs("div", { className: "flex items-center justify-between gap-3", children: [_jsxs("div", { children: [_jsx("div", { className: "text-[11px] font-medium uppercase tracking-wide text-muted-foreground", children: label }), _jsx("div", { className: "mt-1 text-xl font-semibold tabular-nums text-foreground", children: value })] }), _jsx(Icon, { size: 18, className: "text-muted-foreground" })] }) }));
}
function DreamSettingsSheet({ open, onOpenChange, draft, onDraftChange, onSave, saving, loading, }) {
    const sourceIds = splitSourceIds(draft.sourceIdsText);
    const canSave = draft.schedule.trim().length > 0;
    function update(key, value) {
        onDraftChange({ ...draft, [key]: value });
    }
    return (_jsxs(Sheet, { open: open, onOpenChange: onOpenChange, children: [_jsx(SheetTrigger, { asChild: true, children: _jsxs(Button, { variant: "outline", disabled: loading, children: [_jsx(IconSettings, { size: 15, className: "mr-1.5" }), "Settings"] }) }), _jsxs(SheetContent, { className: "flex w-full flex-col p-0 sm:max-w-2xl", children: [_jsxs(SheetHeader, { className: "border-b px-5 py-4", children: [_jsxs("div", { className: "flex flex-wrap items-center gap-2 pr-8", children: [_jsx(Badge, { variant: draft.enabled ? "default" : "secondary", children: draft.enabled ? "Enabled" : "Paused" }), _jsx(Badge, { variant: "outline", className: "font-mono", children: draft.schedule || "No schedule" })] }), _jsx(SheetTitle, { className: "mt-2 text-base", children: "Dream settings" }), _jsx(SheetDescription, { children: "Configure recurring dream scope, schedule, and scan limits." })] }), _jsx(ScrollArea, { className: "min-h-0 flex-1", children: _jsxs("div", { className: "space-y-6 p-5", children: [_jsxs("section", { className: "space-y-3", children: [_jsx("div", { className: "text-xs font-semibold uppercase tracking-wide text-muted-foreground", children: "Schedule" }), _jsxs("div", { className: "flex items-center justify-between gap-4 rounded-lg border bg-muted/20 px-3 py-3", children: [_jsxs("div", { children: [_jsx(Label, { htmlFor: "dream-enabled", children: "Recurring dreams" }), _jsx("div", { className: "mt-1 text-xs text-muted-foreground", children: "Saved setting used by dream jobs." })] }), _jsx(Switch, { id: "dream-enabled", checked: draft.enabled, onCheckedChange: (checked) => update("enabled", checked) })] }), _jsxs("div", { className: "grid gap-4 sm:grid-cols-[minmax(0,1fr)_180px]", children: [_jsxs("div", { className: "space-y-2", children: [_jsx(Label, { htmlFor: "dream-schedule", children: "Cron schedule" }), _jsx(Input, { id: "dream-schedule", value: draft.schedule, onChange: (event) => update("schedule", event.target.value), placeholder: "0 9 * * 1", className: "font-mono" })] }), _jsxs("div", { className: "space-y-2", children: [_jsx(Label, { htmlFor: "dream-min-candidates", children: "Min candidates" }), _jsx(Input, { id: "dream-min-candidates", type: "number", min: 0, max: 50, value: draft.minCandidateCount, onChange: (event) => update("minCandidateCount", event.target.value) })] })] })] }), _jsx(Separator, {}), _jsxs("section", { className: "space-y-3", children: [_jsx("div", { className: "text-xs font-semibold uppercase tracking-wide text-muted-foreground", children: "Sources" }), _jsxs("div", { className: "flex items-center justify-between gap-4 rounded-lg border bg-muted/20 px-3 py-3", children: [_jsxs("div", { children: [_jsx(Label, { htmlFor: "dream-all-sources", children: "All sources" }), _jsx("div", { className: "mt-1 text-xs text-muted-foreground", children: "Scan every connected thread-debug source." })] }), _jsx(Switch, { id: "dream-all-sources", checked: draft.allSources, onCheckedChange: (checked) => update("allSources", checked) })] }), _jsxs("div", { className: "grid gap-4 sm:grid-cols-2", children: [_jsxs("div", { className: "space-y-2", children: [_jsx(Label, { htmlFor: "dream-source-id", children: "Source ID" }), _jsx(Input, { id: "dream-source-id", value: draft.sourceId, onChange: (event) => update("sourceId", event.target.value), disabled: draft.allSources || sourceIds.length > 0, placeholder: "current", className: "font-mono" })] }), _jsxs("div", { className: "space-y-2", children: [_jsx(Label, { htmlFor: "dream-query", children: "Query" }), _jsx(Input, { id: "dream-query", value: draft.query, onChange: (event) => update("query", event.target.value), placeholder: "Optional search term" })] })] }), _jsxs("div", { className: "space-y-2", children: [_jsx(Label, { htmlFor: "dream-source-ids", children: "Explicit source IDs" }), _jsx(Textarea, { id: "dream-source-ids", value: draft.sourceIdsText, onChange: (event) => update("sourceIdsText", event.target.value), disabled: draft.allSources, rows: 3, placeholder: "One source ID per line", className: "font-mono" })] })] }), _jsx(Separator, {}), _jsxs("section", { className: "space-y-3", children: [_jsx("div", { className: "text-xs font-semibold uppercase tracking-wide text-muted-foreground", children: "Scan Limits" }), _jsxs("div", { className: "grid gap-4 sm:grid-cols-2", children: [_jsxs("div", { className: "space-y-2", children: [_jsx(Label, { htmlFor: "dream-limit", children: "Candidate limit" }), _jsx(Input, { id: "dream-limit", type: "number", min: 1, max: 50, value: draft.limit, onChange: (event) => update("limit", event.target.value) })] }), _jsxs("div", { className: "space-y-2", children: [_jsx(Label, { htmlFor: "dream-source-timeout", children: "Source timeout ms" }), _jsx(Input, { id: "dream-source-timeout", type: "number", min: 1000, max: 60000, value: draft.sourceTimeoutMs, onChange: (event) => update("sourceTimeoutMs", event.target.value) })] }), _jsxs("div", { className: "space-y-2", children: [_jsx(Label, { htmlFor: "dream-source-concurrency", children: "Source concurrency" }), _jsx(Input, { id: "dream-source-concurrency", type: "number", min: 1, max: 8, value: draft.sourceConcurrency, onChange: (event) => update("sourceConcurrency", event.target.value) })] }), _jsxs("div", { className: "space-y-2", children: [_jsx(Label, { htmlFor: "dream-start-stagger", children: "Start stagger ms" }), _jsx(Input, { id: "dream-start-stagger", type: "number", min: 0, max: 5000, value: draft.sourceStartStaggerMs, onChange: (event) => update("sourceStartStaggerMs", event.target.value) })] }), _jsxs("div", { className: "space-y-2", children: [_jsx(Label, { htmlFor: "dream-thread-concurrency", children: "Thread concurrency" }), _jsx(Input, { id: "dream-thread-concurrency", type: "number", min: 1, max: 10, value: draft.threadConcurrency, onChange: (event) => update("threadConcurrency", event.target.value) })] }), _jsxs("div", { className: "space-y-2", children: [_jsx(Label, { htmlFor: "dream-thread-timeout", children: "Thread timeout ms" }), _jsx(Input, { id: "dream-thread-timeout", type: "number", min: 1000, max: 30000, value: draft.threadTimeoutMs, onChange: (event) => update("threadTimeoutMs", event.target.value) })] })] })] })] }) }), _jsxs(SheetFooter, { className: "gap-2 border-t px-5 py-4", children: [_jsx(Button, { variant: "outline", onClick: () => onOpenChange(false), children: "Close" }), _jsxs(Button, { disabled: !canSave || saving, onClick: onSave, children: [saving ? _jsx(Spinner, { className: "mr-1.5 size-3.5" }) : null, "Save settings"] })] })] })] }));
}
function ProposalCard({ proposal, applying, rejecting, onApply, onReject, }) {
    const [open, setOpen] = useState(false);
    const [rejectReason, setRejectReason] = useState("");
    const evidence = proposal.evidence ?? [];
    const sourceRunIds = proposal.sourceRunIds ?? [];
    const status = String(proposal.status || "pending").toLowerCase();
    const canAct = status === "pending";
    const needsApproval = proposal.targetType != null && proposal.targetType !== "personal-memory";
    const previewQuery = useActionQuery("preview-dream-proposal", { id: proposal.id }, { enabled: open, staleTime: 0 });
    const preview = previewQuery.data;
    return (_jsxs("div", { className: "rounded-lg border bg-card", children: [_jsxs("div", { className: "flex flex-col gap-3 border-b px-4 py-3 md:flex-row md:items-start md:justify-between", children: [_jsxs("div", { className: "min-w-0", children: [_jsxs("div", { className: "flex flex-wrap items-center gap-2", children: [_jsx(StatusBadge, { status: proposal.status }), _jsx(Badge, { variant: "outline", className: "font-mono", children: proposalTarget(proposal) }), proposal.risk ? (_jsxs(Badge, { variant: "secondary", className: "capitalize", children: [proposal.risk, " risk"] })) : null] }), _jsx("div", { className: "mt-2 text-sm font-medium text-foreground", children: proposal.title || proposal.summary || proposal.id }), proposal.summary && proposal.title ? (_jsx("div", { className: "mt-1 text-xs leading-relaxed text-muted-foreground", children: proposal.summary })) : null] }), _jsx("div", { className: "flex shrink-0 gap-2", children: _jsxs(Sheet, { open: open, onOpenChange: setOpen, children: [_jsx(SheetTrigger, { asChild: true, children: _jsxs(Button, { size: "sm", variant: canAct ? "default" : "outline", children: [_jsx(IconFileDiff, { size: 14, className: "mr-1.5" }), "Review"] }) }), _jsxs(SheetContent, { className: "flex w-full flex-col p-0 sm:max-w-3xl", children: [_jsxs(SheetHeader, { className: "border-b px-5 py-4", children: [_jsxs("div", { className: "flex flex-wrap items-center gap-2 pr-8", children: [_jsx(StatusBadge, { status: proposal.status }), _jsx(Badge, { variant: "outline", className: "font-mono", children: preview?.target?.path || proposalTarget(proposal) }), _jsx(Badge, { variant: "secondary", className: "capitalize", children: preview?.operation || "review" }), preview?.approval?.willRequestApproval ? (_jsx(Badge, { variant: "secondary", children: "Approval request" })) : null] }), _jsx(SheetTitle, { className: "mt-2 text-base", children: proposal.title || proposal.summary || proposal.id }), _jsx(SheetDescription, { children: proposal.summary ||
                                                        "Review the target, evidence, and proposed content before applying this dream proposal." })] }), _jsx(ScrollArea, { className: "min-h-0 flex-1", children: _jsxs("div", { className: "space-y-5 p-5", children: [previewQuery.error ? (_jsx(QueryState, { error: previewQuery.error, label: "Could not preview proposal" })) : null, previewQuery.isLoading ? _jsx(ProposalSkeleton, {}) : null, _jsxs("div", { className: "grid gap-3 sm:grid-cols-2", children: [_jsxs("div", { className: "rounded-lg border bg-muted/20 p-3", children: [_jsx("div", { className: "text-[11px] font-medium uppercase tracking-wide text-muted-foreground", children: "Target" }), _jsx("div", { className: "mt-1 break-all font-mono text-xs text-foreground", children: preview?.target?.path || proposalTarget(proposal) }), _jsxs("div", { className: "mt-2 flex flex-wrap gap-1.5", children: [_jsx(Badge, { variant: "outline", children: preview?.target?.type ||
                                                                                    proposal.targetType ||
                                                                                    "memory" }), preview?.targetExists ? (_jsx(Badge, { variant: "secondary", children: "Existing target" })) : (_jsx(Badge, { variant: "secondary", children: "New target" }))] })] }), _jsxs("div", { className: "rounded-lg border bg-muted/20 p-3", children: [_jsx("div", { className: "text-[11px] font-medium uppercase tracking-wide text-muted-foreground", children: "Review gate" }), _jsx("div", { className: "mt-1 text-xs leading-relaxed text-foreground", children: preview?.approval?.willRequestApproval
                                                                            ? "Applying will create a Dispatch approval request."
                                                                            : needsApproval
                                                                                ? "Applying writes a shared/workspace resource because approvals are disabled."
                                                                                : "Applying writes personal memory directly." }), _jsxs("div", { className: "mt-2 flex flex-wrap gap-1.5", children: [proposal.risk ? (_jsxs(Badge, { variant: "outline", className: "capitalize", children: [proposal.risk, " risk"] })) : null, proposal.confidence != null ? (_jsxs(Badge, { variant: "outline", children: [proposal.confidence, "% confidence"] })) : null] })] })] }), proposal.rationale ? (_jsxs("div", { children: [_jsx("div", { className: "text-xs font-medium text-foreground", children: "Rationale" }), _jsx("div", { className: "mt-1 text-xs leading-relaxed text-muted-foreground", children: proposal.rationale })] })) : null, _jsx(Separator, {}), _jsxs("div", { className: "grid gap-4 lg:grid-cols-2", children: [_jsxs("div", { children: [_jsx("div", { className: "mb-2 text-xs font-medium text-foreground", children: "Current target" }), preview?.currentContent ? (_jsx(RawBlock, { value: preview.currentContent })) : (_jsx(EmptyPanel, { title: "No existing content", description: "This proposal would create a new target or append to an empty target." }))] }), _jsxs("div", { children: [_jsx("div", { className: "mb-2 text-xs font-medium text-foreground", children: "Proposed content" }), _jsx(RawBlock, { value: preview?.proposedContent || proposal.content })] })] }), _jsx(Separator, {}), _jsxs("div", { children: [_jsx("div", { className: "mb-2 text-xs font-medium text-foreground", children: "Evidence" }), sourceRunIds.length > 0 ? (_jsx("div", { className: "mb-2 flex flex-wrap gap-1.5", children: sourceRunIds.map((id) => (_jsx(Badge, { variant: "outline", className: "font-mono", children: id }, id))) })) : null, evidence.length > 0 ? (_jsx("div", { className: "space-y-2", children: evidence.map((item, index) => (_jsxs("div", { className: "rounded-md border bg-muted/20 px-3 py-2", children: [_jsxs("div", { className: "flex flex-wrap items-center justify-between gap-2", children: [_jsx("div", { className: "text-xs font-medium text-foreground", children: evidenceLabel(item, index) }), _jsx("div", { className: "text-[11px] text-muted-foreground", children: formatDate(item.createdAt) })] }), _jsx("div", { className: "mt-1 text-xs leading-relaxed text-muted-foreground", children: item.quote ||
                                                                                item.snippet ||
                                                                                item.summary ||
                                                                                "No text" })] }, item.id || `${proposal.id}-review-${index}`))) })) : (_jsx(EmptyPanel, { title: "No structured evidence", description: "The proposal did not include compact evidence records." }))] }), canAct ? (_jsxs("div", { className: "space-y-2", children: [_jsx(Label, { htmlFor: `reject-${proposal.id}`, children: "Rejection reason" }), _jsx(Textarea, { id: `reject-${proposal.id}`, value: rejectReason, onChange: (event) => setRejectReason(event.target.value), placeholder: "Optional note for the audit log" })] })) : null] }) }), _jsxs(SheetFooter, { className: "gap-2 border-t px-5 py-4", children: [_jsxs(Button, { variant: "outline", disabled: !canAct || applying || rejecting, onClick: () => {
                                                        onReject(rejectReason.trim() || undefined);
                                                        setOpen(false);
                                                    }, children: [rejecting ? (_jsx(Spinner, { className: "mr-1.5 size-3.5" })) : (_jsx(IconX, { size: 14, className: "mr-1.5" })), "Reject"] }), _jsxs(Button, { disabled: !canAct || applying || rejecting, onClick: () => {
                                                        onApply();
                                                        setOpen(false);
                                                    }, children: [applying ? (_jsx(Spinner, { className: "mr-1.5 size-3.5" })) : (_jsx(IconCheck, { size: 14, className: "mr-1.5" })), needsApproval ? "Request approval" : "Apply"] })] })] })] }) })] }), _jsxs(Accordion, { type: "multiple", className: "px-4", children: [_jsxs(AccordionItem, { value: "evidence", className: "border-b-0", children: [_jsx(AccordionTrigger, { className: "py-3 text-xs hover:no-underline", children: "Evidence and provenance" }), _jsxs(AccordionContent, { className: "space-y-3 pb-4", children: [sourceRunIds.length > 0 ? (_jsx("div", { className: "flex flex-wrap gap-1.5", children: sourceRunIds.map((id) => (_jsx(Badge, { variant: "outline", className: "font-mono", children: id }, id))) })) : null, evidence.length > 0 ? (_jsx("div", { className: "space-y-2", children: evidence.map((item, index) => (_jsxs("div", { className: "rounded-md border bg-muted/20 px-3 py-2", children: [_jsxs("div", { className: "flex flex-wrap items-center justify-between gap-2", children: [_jsx("div", { className: "text-xs font-medium text-foreground", children: evidenceLabel(item, index) }), _jsx("div", { className: "text-[11px] text-muted-foreground", children: formatDate(item.createdAt) })] }), _jsx("div", { className: "mt-1 text-xs leading-relaxed text-muted-foreground", children: item.quote || item.snippet || item.summary || "No text" })] }, item.id || `${proposal.id}-evidence-${index}`))) })) : (_jsx("div", { className: "text-xs text-muted-foreground", children: "No structured evidence attached yet." }))] })] }), proposal.content ? (_jsxs(AccordionItem, { value: "content", className: "border-b-0", children: [_jsx(AccordionTrigger, { className: "py-3 text-xs hover:no-underline", children: "Proposed content" }), _jsx(AccordionContent, { className: "pb-4", children: _jsx(RawBlock, { value: proposal.content }) })] })) : null] })] }));
}
export default function DreamsRoute() {
    const [searchParams, setSearchParams] = useSearchParams();
    const [selectedDreamId, setSelectedDreamId] = useState(searchParams.get("dreamId"));
    const [settingsOpen, setSettingsOpen] = useState(false);
    const [settingsDraft, setSettingsDraft] = useState(() => dreamSettingsToDraft(null));
    const dreamsQuery = useActionQuery("list-dreams", { limit: 25 }, { staleTime: 15_000 });
    const candidatesQuery = useActionQuery("list-dream-candidates", {
        limit: 25,
        sourceTimeoutMs: 30_000,
        sourceConcurrency: 2,
        sourceStartStaggerMs: 250,
        threadConcurrency: 3,
        threadTimeoutMs: 8_000,
    }, { staleTime: 15_000 });
    const dreamSettingsQuery = useActionQuery("get-dream-settings", {}, { staleTime: 30_000 });
    const dreamDetailQuery = useActionQuery("get-dream", { id: selectedDreamId ?? "" }, { enabled: !!selectedDreamId, staleTime: 10_000 });
    const dreams = useMemo(() => normalizeArray(dreamsQuery.data, [
        "dreams",
        "items",
        "results",
    ]), [dreamsQuery.data]);
    const candidates = useMemo(() => normalizeArray(candidatesQuery.data, [
        "candidates",
        "items",
        "results",
    ]), [candidatesQuery.data]);
    const candidateSourceHealth = useMemo(() => normalizeSourceHealth(candidatesQuery.data), [candidatesQuery.data]);
    useEffect(() => {
        const urlDreamId = searchParams.get("dreamId");
        if (urlDreamId && urlDreamId !== selectedDreamId) {
            setSelectedDreamId(urlDreamId);
            return;
        }
        if (selectedDreamId && dreams.some((dream) => dream.id === selectedDreamId))
            return;
        const nextId = dreams[0]?.id ?? null;
        setSelectedDreamId(nextId);
        if (nextId && nextId !== urlDreamId) {
            const next = new URLSearchParams(searchParams);
            next.set("dreamId", nextId);
            setSearchParams(next, { replace: true });
        }
    }, [dreams, searchParams, selectedDreamId, setSearchParams]);
    function selectDream(dreamId) {
        setSelectedDreamId(dreamId);
        const next = new URLSearchParams(searchParams);
        next.set("dreamId", dreamId);
        setSearchParams(next, { replace: true });
    }
    const createDream = useActionMutation("create-dream-report", {
        onSuccess: (result) => {
            const nextId = resultDreamId(result);
            if (nextId)
                selectDream(nextId);
            toast.success("Dream report created");
        },
        onError: (err) => toast.error(String(err)),
    });
    const applyProposal = useActionMutation("apply-dream-proposal", {
        onSuccess: (result) => {
            toast.success(isApprovalRequestResult(result)
                ? "Approval requested"
                : "Proposal applied");
            dreamDetailQuery.refetch();
            dreamsQuery.refetch();
        },
        onError: (err) => toast.error(String(err)),
    });
    const rejectProposal = useActionMutation("reject-dream-proposal", {
        onSuccess: () => {
            toast.success("Proposal rejected");
            dreamDetailQuery.refetch();
            dreamsQuery.refetch();
        },
        onError: (err) => toast.error(String(err)),
    });
    const ensureDreamSchedule = useActionMutation("ensure-dream-job", {
        onSuccess: () => {
            toast.success("Dream schedule updated");
            dreamSettingsQuery.refetch();
        },
        onError: (err) => toast.error(String(err)),
    });
    const saveDreamSettings = useActionMutation("set-dream-settings", {
        onSuccess: (settings) => {
            toast.success("Dream settings saved");
            setSettingsDraft(dreamSettingsToDraft(settings));
            setSettingsOpen(false);
            dreamSettingsQuery.refetch();
            candidatesQuery.refetch();
        },
        onError: (err) => toast.error(String(err)),
    });
    const detail = dreamDetailQuery.data ?? null;
    const dreamSettings = dreamSettingsQuery.data ?? null;
    const selectedDream = detail?.dream ?? dreams.find((dream) => dream.id === selectedDreamId);
    const proposals = detail?.proposals ?? [];
    const inspectedRuns = detail?.inspectedRuns ?? detail?.candidates ?? [];
    const selectedSourceHealth = selectedDream?.sourceHealth ?? [];
    const pendingProposalCount = proposals.filter((proposal) => String(proposal.status || "pending").toLowerCase() === "pending").length;
    const appliedProposalCount = proposals.filter((proposal) => String(proposal.status || "").toLowerCase() === "applied").length;
    useEffect(() => {
        if (dreamSettings && !settingsOpen) {
            setSettingsDraft(dreamSettingsToDraft(dreamSettings));
        }
    }, [dreamSettings, settingsOpen]);
    function handleSettingsOpenChange(open) {
        if (open) {
            setSettingsDraft(dreamSettingsToDraft(dreamSettings));
        }
        setSettingsOpen(open);
    }
    function saveSettings() {
        const update = dreamSettingsUpdateFromDraft(settingsDraft);
        if (!update.schedule) {
            toast.error("Add a cron schedule before saving");
            return;
        }
        saveDreamSettings.mutate(update);
    }
    function runDream(scanAllSources = false) {
        createDream.mutate({
            sourceId: scanAllSources ? "all" : "current",
            allSources: scanAllSources,
            limit: scanAllSources
                ? 8
                : candidates.length > 0
                    ? candidates.length
                    : 20,
            sourceTimeoutMs: dreamSettings?.sourceTimeoutMs ?? 30_000,
            sourceConcurrency: dreamSettings?.sourceConcurrency ?? 2,
            sourceStartStaggerMs: dreamSettings?.sourceStartStaggerMs ?? 250,
            threadConcurrency: dreamSettings?.threadConcurrency ?? 3,
            threadTimeoutMs: dreamSettings?.threadTimeoutMs ?? 8_000,
        });
    }
    function ensureSchedule() {
        ensureDreamSchedule.mutate({
            schedule: dreamSettings?.schedule,
            sourceId: dreamSettings?.sourceId ?? "all",
            sourceIds: dreamSettings?.sourceIds,
            allSources: dreamSettings?.allSources ?? true,
            query: dreamSettings?.query ?? undefined,
            limit: dreamSettings?.limit ?? 8,
            sourceTimeoutMs: dreamSettings?.sourceTimeoutMs ?? 30_000,
            sourceConcurrency: dreamSettings?.sourceConcurrency ?? 2,
            sourceStartStaggerMs: dreamSettings?.sourceStartStaggerMs ?? 250,
            threadConcurrency: dreamSettings?.threadConcurrency ?? 3,
            threadTimeoutMs: dreamSettings?.threadTimeoutMs ?? 8_000,
            minCandidateCount: dreamSettings?.minCandidateCount ?? 1,
        });
    }
    return (_jsx(DispatchShell, { title: "Dreams", description: "Review agent runs, propose memory improvements, and apply evidence-backed learning changes.", children: _jsxs("div", { className: "space-y-4", children: [_jsxs("div", { className: "flex flex-col gap-3 md:flex-row md:items-center md:justify-between", children: [_jsxs("div", { className: "grid flex-1 gap-2 sm:grid-cols-2 xl:grid-cols-4", children: [_jsx(StatTile, { label: "Dream passes", value: dreams.length, icon: IconBrain }), _jsx(StatTile, { label: "Pending proposals", value: pendingProposalCount, icon: IconCircleDashed }), _jsx(StatTile, { label: "Candidate runs", value: candidates.length, icon: IconClock }), _jsx(StatTile, { label: "Inspected threads", value: selectedDream ? dreamInspectedCount(selectedDream) : 0, icon: IconCheck })] }), _jsxs("div", { className: "flex shrink-0 flex-wrap gap-2", children: [dreamSettings ? (_jsxs(Badge, { variant: "outline", className: "h-9 px-3", children: [dreamSettings.enabled ? "Enabled" : "Paused", " \u00B7", " ", dreamSettings.allSources
                                            ? "All sources"
                                            : dreamSettings.sourceId, " ", "\u00B7 ", dreamSettings.schedule] })) : null, _jsx(DreamSettingsSheet, { open: settingsOpen, onOpenChange: handleSettingsOpenChange, draft: settingsDraft, onDraftChange: setSettingsDraft, onSave: saveSettings, saving: saveDreamSettings.isPending, loading: dreamSettingsQuery.isLoading }), _jsxs(Button, { variant: "outline", onClick: () => {
                                        dreamsQuery.refetch();
                                        candidatesQuery.refetch();
                                        if (selectedDreamId)
                                            dreamDetailQuery.refetch();
                                    }, children: [_jsx(IconRefresh, { size: 15, className: "mr-1.5" }), "Refresh"] }), _jsxs(Button, { variant: "outline", onClick: ensureSchedule, disabled: ensureDreamSchedule.isPending, children: [ensureDreamSchedule.isPending ? (_jsx(Spinner, { className: "mr-1.5 size-3.5" })) : (_jsx(IconCalendarTime, { size: 15, className: "mr-1.5" })), "Ensure schedule"] }), _jsxs(Button, { variant: "outline", onClick: () => runDream(true), disabled: createDream.isPending, children: [createDream.isPending ? (_jsx(Spinner, { className: "mr-1.5 size-3.5" })) : (_jsx(IconDatabase, { size: 15, className: "mr-1.5" })), "Run all sources"] }), _jsxs(Button, { onClick: () => runDream(false), disabled: createDream.isPending, children: [createDream.isPending ? (_jsx(Spinner, { className: "mr-1.5 size-3.5" })) : (_jsx(IconPlayerPlay, { size: 15, className: "mr-1.5" })), "Run dream"] })] })] }), _jsxs("div", { className: "grid gap-4 xl:grid-cols-[280px_minmax(0,1fr)_380px]", children: [_jsxs("section", { className: "rounded-lg border bg-card", children: [_jsxs("div", { className: "border-b px-4 py-3", children: [_jsx("div", { className: "text-sm font-semibold text-foreground", children: "Recent passes" }), _jsx("div", { className: "mt-1 text-xs text-muted-foreground", children: "Reports generated from prior agent activity." })] }), _jsxs("div", { className: "max-h-[720px] overflow-auto p-3", children: [_jsx(QueryState, { error: dreamsQuery.error, label: "Could not load dream passes" }), dreamsQuery.isLoading ? _jsx(DreamListSkeleton, {}) : null, !dreamsQuery.isLoading && !dreamsQuery.error ? (dreams.length > 0 ? (_jsx("div", { className: "space-y-2", children: dreams.map((dream, index) => {
                                                const selected = dream.id === selectedDreamId;
                                                return (_jsxs("button", { type: "button", onClick: () => selectDream(dream.id), className: cn("w-full rounded-lg border px-3 py-3 text-left transition-colors", selected
                                                        ? "border-foreground bg-muted"
                                                        : "bg-background hover:border-foreground/30 hover:bg-muted/40"), children: [_jsxs("div", { className: "flex items-start justify-between gap-2", children: [_jsxs("div", { className: "min-w-0", children: [_jsx("div", { className: "truncate text-sm font-medium text-foreground", children: dreamLabel(dream, index) }), _jsx("div", { className: "mt-1 truncate font-mono text-[11px] text-muted-foreground", children: dream.id })] }), _jsx(StatusBadge, { status: dream.status })] }), _jsx("div", { className: "mt-2 line-clamp-2 text-xs leading-relaxed text-muted-foreground", children: dream.summary || "No summary yet." }), _jsxs("div", { className: "mt-3 flex flex-wrap gap-1.5", children: [_jsx(Badge, { variant: "outline", children: plural(dreamProposalCount(dream), "proposal") }), _jsx(Badge, { variant: "outline", children: plural(dreamInspectedCount(dream), "run") })] }), _jsx("div", { className: "mt-2 text-[11px] text-muted-foreground", children: compactDate(dream.completedAt ??
                                                                dream.updatedAt ??
                                                                dream.startedAt ??
                                                                dream.createdAt) })] }, dream.id));
                                            }) })) : (_jsx(EmptyPanel, { title: "No dreams yet", description: "Run the first dream pass to review recent agent history and generate proposed memory changes." }))) : null] })] }), _jsxs("section", { className: "min-w-0 rounded-lg border bg-card", children: [_jsx("div", { className: "border-b px-4 py-3", children: _jsxs("div", { className: "flex flex-wrap items-center justify-between gap-3", children: [_jsxs("div", { className: "min-w-0", children: [_jsx("div", { className: "truncate text-sm font-semibold text-foreground", children: selectedDream
                                                            ? selectedDream.title || selectedDream.id
                                                            : "Dream detail" }), _jsx("div", { className: "mt-1 text-xs text-muted-foreground", children: selectedDream
                                                            ? `Completed ${formatDate(selectedDream.completedAt ??
                                                                selectedDream.updatedAt ??
                                                                selectedDream.createdAt)}`
                                                            : "Select a pass or run a new dream." })] }), selectedDream ? (_jsxs("div", { className: "flex flex-wrap gap-1.5", children: [_jsx(StatusBadge, { status: selectedDream.status }), _jsx(Badge, { variant: "outline", children: plural(appliedProposalCount, "applied", "applied") })] })) : null] }) }), _jsxs("div", { className: "p-4", children: [_jsx(QueryState, { error: dreamDetailQuery.error, label: "Could not load dream detail" }), dreamDetailQuery.isLoading ? _jsx(ProposalSkeleton, {}) : null, !selectedDreamId && !dreamDetailQuery.isLoading ? (_jsx(EmptyPanel, { title: "Nothing selected", description: "Choose a recent dream pass or run one from candidate agent runs." })) : null, selectedDreamId &&
                                            !dreamDetailQuery.isLoading &&
                                            !dreamDetailQuery.error ? (_jsxs(Tabs, { defaultValue: "proposals", className: "w-full", children: [_jsxs(TabsList, { className: "grid w-full grid-cols-3", children: [_jsx(TabsTrigger, { value: "proposals", children: "Proposals" }), _jsx(TabsTrigger, { value: "report", children: "Report" }), _jsx(TabsTrigger, { value: "sources", children: "Sources" })] }), _jsx(TabsContent, { value: "proposals", className: "mt-4", children: proposals.length > 0 ? (_jsx("div", { className: "space-y-3", children: proposals.map((proposal) => (_jsx(ProposalCard, { proposal: proposal, applying: applyProposal.isPending &&
                                                                applyProposal.variables?.id === proposal.id, rejecting: rejectProposal.isPending &&
                                                                rejectProposal.variables?.id === proposal.id, onApply: () => applyProposal.mutate({
                                                                id: proposal.id,
                                                            }), onReject: (reason) => rejectProposal.mutate({
                                                                id: proposal.id,
                                                                reason,
                                                            }) }, proposal.id))) })) : (_jsx(EmptyPanel, { title: "No proposals", description: "This dream did not produce reviewable memory, skill, job, or instruction changes." })) }), _jsx(TabsContent, { value: "report", className: "mt-4", children: detail?.report || detail?.summary ? (_jsx(RawBlock, { value: detail.report || detail.summary || "" })) : (_jsx(EmptyPanel, { title: "No report text", description: "The dream detail action did not return a report body." })) }), _jsxs(TabsContent, { value: "sources", className: "mt-4", children: [selectedSourceHealth.length > 0 ? (_jsx("div", { className: "mb-4", children: _jsx(SourceHealthPanel, { sources: selectedSourceHealth }) })) : null, inspectedRuns.length > 0 || detail?.evidence?.length ? (_jsxs(Accordion, { type: "multiple", className: "rounded-lg border", children: [inspectedRuns.map((run, index) => (_jsxs(AccordionItem, { value: candidateId(run) || `run-${index}`, className: "px-4", children: [_jsx(AccordionTrigger, { className: "text-sm hover:no-underline", children: _jsx("span", { className: "min-w-0 truncate text-left", children: candidateLabel(run) }) }), _jsxs(AccordionContent, { className: "pb-4", children: [_jsxs("div", { className: "grid gap-2 text-xs text-muted-foreground sm:grid-cols-2", children: [_jsxs("div", { children: ["Thread:", " ", _jsx("span", { className: "font-mono text-foreground", children: run.thread?.id ?? run.threadId ?? "n/a" })] }), _jsxs("div", { children: ["Run:", " ", _jsx("span", { className: "font-mono text-foreground", children: run.runId ?? run.id })] }), _jsxs("div", { children: ["Owner: ", candidateOwner(run)] }), _jsxs("div", { children: ["Status: ", candidateStatus(run)] })] }), candidateSignals(run).length > 0 ? (_jsx("div", { className: "mt-3 flex flex-wrap gap-1.5", children: candidateSignals(run).map((signal) => (_jsx(Badge, { variant: "outline", children: signal }, signal))) })) : null] })] }, candidateId(run)))), (detail?.evidence ?? []).map((item, index) => (_jsxs(AccordionItem, { value: item.id || `evidence-${index}`, className: "px-4", children: [_jsx(AccordionTrigger, { className: "text-sm hover:no-underline", children: evidenceLabel(item, index) }), _jsx(AccordionContent, { className: "pb-4", children: _jsx(RawBlock, { value: item }) })] }, item.id || `evidence-${index}`)))] })) : (_jsx(EmptyPanel, { title: "No source runs", description: "This dream has no structured source list yet." }))] })] })) : null] })] }), _jsxs("section", { className: "rounded-lg border bg-card", children: [_jsx("div", { className: "border-b px-4 py-3", children: _jsxs("div", { children: [_jsx("div", { className: "text-sm font-semibold text-foreground", children: "Candidate runs" }), _jsx("div", { className: "mt-1 text-xs text-muted-foreground", children: "Grounded signals ready for review." })] }) }), _jsxs("div", { className: "max-h-[720px] overflow-auto p-3", children: [_jsx(QueryState, { error: candidatesQuery.error, label: "Could not load candidates" }), candidatesQuery.isLoading ? _jsx(DreamListSkeleton, {}) : null, !candidatesQuery.isLoading &&
                                            !candidatesQuery.error &&
                                            candidateSourceHealth.length > 0 ? (_jsx("div", { className: "mb-3", children: _jsx(SourceHealthPanel, { sources: candidateSourceHealth }) })) : null, !candidatesQuery.isLoading && !candidatesQuery.error ? (candidates.length > 0 ? (_jsxs(Table, { children: [_jsx(TableHeader, { children: _jsxs(TableRow, { children: [_jsx(TableHead, { children: "Run" }), _jsx(TableHead, { children: "Signals" }), _jsx(TableHead, { className: "w-20 text-right", children: "Score" })] }) }), _jsx(TableBody, { children: candidates.map((candidate) => {
                                                        const id = candidateId(candidate);
                                                        const signals = candidateSignals(candidate);
                                                        return (_jsxs(TableRow, { children: [_jsxs(TableCell, { className: "min-w-0 py-3", children: [_jsx("div", { className: "max-w-[230px] truncate text-sm font-medium text-foreground", children: candidateLabel(candidate) }), _jsx("div", { className: "mt-1 truncate font-mono text-[11px] text-muted-foreground", children: candidate.thread?.id ??
                                                                                candidate.threadId ??
                                                                                candidate.runId ??
                                                                                id }), _jsxs("div", { className: "mt-1 text-[11px] text-muted-foreground", children: [candidateOwner(candidate), " \u00B7", " ", compactDate(candidateUpdatedAt(candidate))] })] }), _jsx(TableCell, { className: "py-3", children: _jsxs("div", { className: "mt-1 flex flex-wrap gap-1", children: [_jsx(Badge, { variant: "outline", children: candidateStatus(candidate) }), signals.slice(0, 2).map((signal) => (_jsx(Badge, { variant: "secondary", children: signal }, signal)))] }) }), _jsx(TableCell, { className: "py-3 text-right text-sm tabular-nums text-muted-foreground", children: candidate.score ?? "n/a" })] }, id));
                                                    }) })] })) : (_jsx(EmptyPanel, { title: "No candidates", description: "No recent runs matched the dream candidate heuristics." }))) : null] })] })] })] }) }));
}
//# sourceMappingURL=dreams.js.map