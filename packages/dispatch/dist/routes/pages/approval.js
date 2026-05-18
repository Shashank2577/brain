import { jsx as _jsx, jsxs as _jsxs } from "react/jsx-runtime";
import { useSearchParams } from "react-router";
import { useActionMutation, useActionQuery, isInAgentEmbed, postNavigate, appPath, } from "@agent-native/core/client";
import { toast } from "sonner";
import { Button } from "../../components/ui/button.js";
import { Badge } from "../../components/ui/badge.js";
import { Skeleton } from "../../components/ui/skeleton.js";
import { IconCheck, IconX, IconArrowUpRight, IconShieldCheck, IconClock, IconAlertCircle, } from "@tabler/icons-react";
export function meta() {
    return [{ title: "Approval — Dispatch" }];
}
function StatusBadge({ status }) {
    if (status === "pending") {
        return (_jsxs(Badge, { variant: "outline", className: "gap-1.5 border-amber-500/40 bg-amber-500/10 text-amber-600 dark:text-amber-400", children: [_jsx(IconClock, { size: 11 }), "Pending"] }));
    }
    if (status === "approved") {
        return (_jsxs(Badge, { variant: "outline", className: "gap-1.5 border-emerald-500/40 bg-emerald-500/10 text-emerald-600 dark:text-emerald-400", children: [_jsx(IconCheck, { size: 11 }), "Approved"] }));
    }
    return (_jsxs(Badge, { variant: "outline", className: "gap-1.5 border-red-500/40 bg-red-500/10 text-red-600 dark:text-red-400", children: [_jsx(IconX, { size: 11 }), "Rejected"] }));
}
export default function ApprovalPreviewRoute() {
    const [searchParams] = useSearchParams();
    const id = searchParams.get("id") ?? "";
    const { data: approvals, isLoading } = useActionQuery("list-dispatch-approvals", {});
    const approve = useActionMutation("approve-dispatch-change", {
        onSuccess: () => toast.success("Change approved"),
    });
    const reject = useActionMutation("reject-dispatch-change", {
        onSuccess: () => toast.success("Change rejected"),
    });
    const inEmbed = isInAgentEmbed();
    const approval = approvals?.find((item) => item.id === id) ?? null;
    if (!id) {
        return (_jsx("div", { className: "flex min-h-screen items-center justify-center bg-background p-6", children: _jsxs("div", { className: "w-full max-w-md rounded-2xl border bg-card p-6 text-center", children: [_jsx(IconAlertCircle, { size: 32, className: "mx-auto mb-3 text-muted-foreground" }), _jsx("p", { className: "text-sm font-medium text-foreground", children: "No approval id provided" }), _jsxs("p", { className: "mt-1 text-xs text-muted-foreground", children: ["Add ", _jsx("code", { className: "rounded bg-muted px-1", children: "?id=<id>" }), " to the URL."] })] }) }));
    }
    if (isLoading) {
        return (_jsx("div", { className: "flex min-h-screen items-start justify-center bg-background p-6", children: _jsx("div", { className: "w-full max-w-md space-y-4", children: _jsxs("div", { className: "rounded-2xl border bg-card p-5", children: [_jsxs("div", { className: "flex items-start gap-3", children: [_jsx(Skeleton, { className: "h-9 w-9 shrink-0 rounded-xl" }), _jsxs("div", { className: "min-w-0 flex-1 space-y-2", children: [_jsxs("div", { className: "flex flex-wrap items-center gap-2", children: [_jsx(Skeleton, { className: "h-4 w-40" }), _jsx(Skeleton, { className: "h-5 w-20 rounded-full" })] }), _jsx(Skeleton, { className: "h-3 w-32" })] })] }), _jsxs("div", { className: "mt-4 space-y-2 rounded-xl border bg-muted/30 px-4 py-3", children: [_jsxs("div", { className: "flex justify-between gap-4", children: [_jsx(Skeleton, { className: "h-3 w-20" }), _jsx(Skeleton, { className: "h-3 w-24" })] }), _jsxs("div", { className: "flex justify-between gap-4", children: [_jsx(Skeleton, { className: "h-3 w-20" }), _jsx(Skeleton, { className: "h-3 w-28" })] }), _jsxs("div", { className: "flex justify-between gap-4", children: [_jsx(Skeleton, { className: "h-3 w-16" }), _jsx(Skeleton, { className: "h-3 w-32" })] })] }), _jsxs("div", { className: "mt-4 flex gap-2", children: [_jsx(Skeleton, { className: "h-8 flex-1 rounded-md" }), _jsx(Skeleton, { className: "h-8 flex-1 rounded-md" })] })] }) }) }));
    }
    if (!approval) {
        return (_jsx("div", { className: "flex min-h-screen items-center justify-center bg-background p-6", children: _jsxs("div", { className: "w-full max-w-md rounded-2xl border bg-card p-6 text-center", children: [_jsx(IconAlertCircle, { size: 32, className: "mx-auto mb-3 text-muted-foreground" }), _jsx("p", { className: "text-sm font-medium text-foreground", children: "Approval not found" }), _jsxs("p", { className: "mt-1 text-xs text-muted-foreground", children: ["The approval with id", " ", _jsx("code", { className: "rounded bg-muted px-1", children: id }), " does not exist."] }), inEmbed && (_jsxs(Button, { size: "sm", variant: "outline", className: "mt-4 gap-1.5", onClick: () => postNavigate(appPath("/approvals")), children: [_jsx(IconArrowUpRight, { size: 14 }), "View all approvals"] }))] }) }));
    }
    const isPending = approval.status === "pending";
    return (_jsx("div", { className: "flex min-h-screen items-start justify-center bg-background p-6", children: _jsxs("div", { className: "w-full max-w-md space-y-4", children: [_jsxs("div", { className: "rounded-2xl border bg-card p-5", children: [_jsxs("div", { className: "flex items-start gap-3", children: [_jsx("div", { className: "flex h-9 w-9 shrink-0 items-center justify-center rounded-xl border bg-muted text-foreground", children: _jsx(IconShieldCheck, { size: 17 }) }), _jsxs("div", { className: "min-w-0 flex-1", children: [_jsxs("div", { className: "flex flex-wrap items-center gap-2", children: [_jsx("span", { className: "text-sm font-semibold text-foreground", children: approval.summary }), _jsx(StatusBadge, { status: approval.status })] }), _jsxs("div", { className: "mt-1 text-xs text-muted-foreground", children: ["Requested by", " ", _jsx("span", { className: "font-medium text-foreground", children: approval.requestedBy })] })] })] }), _jsxs("div", { className: "mt-4 space-y-2 rounded-xl border bg-muted/30 px-4 py-3 text-xs", children: [_jsxs("div", { className: "flex justify-between gap-4", children: [_jsx("span", { className: "text-muted-foreground", children: "Change type" }), _jsx("span", { className: "font-mono font-medium text-foreground", children: approval.changeType })] }), _jsxs("div", { className: "flex justify-between gap-4", children: [_jsx("span", { className: "text-muted-foreground", children: "Target type" }), _jsx("span", { className: "font-mono font-medium text-foreground", children: approval.targetType })] }), approval.targetId && (_jsxs("div", { className: "flex justify-between gap-4", children: [_jsx("span", { className: "text-muted-foreground", children: "Target id" }), _jsx("span", { className: "truncate font-mono font-medium text-foreground", children: approval.targetId })] })), approval.reviewedBy && (_jsxs("div", { className: "flex justify-between gap-4", children: [_jsx("span", { className: "text-muted-foreground", children: "Reviewed by" }), _jsx("span", { className: "font-medium text-foreground", children: approval.reviewedBy })] }))] }), isPending && (_jsxs("div", { className: "mt-4 flex gap-2", children: [_jsxs(Button, { size: "sm", className: "flex-1", disabled: approve.isPending || reject.isPending, onClick: () => approve.mutate({ id: approval.id }), children: [_jsx(IconCheck, { size: 14, className: "mr-1.5" }), "Approve"] }), _jsxs(Button, { size: "sm", variant: "outline", className: "flex-1", disabled: approve.isPending || reject.isPending, onClick: () => reject.mutate({
                                        id: approval.id,
                                        reason: "Rejected in dispatch UI",
                                    }), children: [_jsx(IconX, { size: 14, className: "mr-1.5" }), "Reject"] })] }))] }), inEmbed && (_jsx("div", { className: "flex justify-end", children: _jsxs(Button, { size: "sm", variant: "ghost", className: "gap-1.5 text-muted-foreground", onClick: () => postNavigate(appPath("/approvals")), children: [_jsx(IconArrowUpRight, { size: 14 }), "Open in app"] }) }))] }) }));
}
//# sourceMappingURL=approval.js.map