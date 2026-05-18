import { jsx as _jsx, jsxs as _jsxs } from "react/jsx-runtime";
import { useMemo, useState } from "react";
import { useActionMutation, useActionQuery } from "@agent-native/core/client";
import { useOrg } from "@agent-native/core/client/org";
import { toast } from "sonner";
import { DispatchShell } from "../../components/dispatch-shell.js";
import { Button } from "../../components/ui/button.js";
import { Input } from "../../components/ui/input.js";
import { Switch } from "../../components/ui/switch.js";
export function meta() {
    return [{ title: "Approvals — Dispatch" }];
}
export default function ApprovalsRoute() {
    const { data: settings } = useActionQuery("get-dispatch-settings", {});
    const { data: approvals } = useActionQuery("list-dispatch-approvals", {});
    const { data: org } = useOrg();
    const hasOrg = !!org?.orgId;
    const [emails, setEmails] = useState("");
    const approverList = useMemo(() => emails
        .split(",")
        .map((value) => value.trim())
        .filter(Boolean), [emails]);
    const savePolicy = useActionMutation("set-dispatch-approval-policy", {
        onSuccess: () => toast.success("Approval policy updated"),
        onError: (err) => toast.error(String(err)),
    });
    const approve = useActionMutation("approve-dispatch-change", {
        onSuccess: () => toast.success("Change approved"),
        onError: (err) => toast.error(String(err)),
    });
    const reject = useActionMutation("reject-dispatch-change", {
        onSuccess: () => toast.success("Change rejected"),
        onError: (err) => toast.error(String(err)),
    });
    return (_jsx(DispatchShell, { title: "Approvals", description: "Review durable dispatch changes before they apply.", children: _jsxs("div", { className: "grid gap-4 xl:grid-cols-[minmax(0,0.9fr)_minmax(0,1.1fr)]", children: [_jsxs("section", { className: "rounded-2xl border bg-card p-5", children: [_jsx("h2", { className: "text-lg font-semibold text-foreground", children: "Approval policy" }), _jsxs("div", { className: "mt-4 space-y-4", children: [_jsxs("label", { className: "flex items-center justify-between rounded-xl border px-4 py-3", children: [_jsxs("div", { children: [_jsx("div", { className: "text-sm font-medium text-foreground", children: "Require approval for durable changes" }), _jsx("div", { className: "mt-1 text-xs text-muted-foreground", children: hasOrg
                                                        ? "Applies to saved destinations and dispatch settings today."
                                                        : "Requires a team workspace. Set one up on the Team page." })] }), _jsx(Switch, { checked: settings?.enabled || false, disabled: !hasOrg || savePolicy.isPending, onCheckedChange: (checked) => savePolicy.mutate({
                                                enabled: checked,
                                                approverEmails: settings?.approverEmails || approverList,
                                            }) })] }), _jsxs("div", { className: "space-y-2", children: [_jsx("div", { className: "text-sm font-medium text-foreground", children: "Approver emails" }), _jsx(Input, { value: emails, onChange: (event) => setEmails(event.target.value), placeholder: (settings?.approverEmails || []).join(", "), disabled: !hasOrg }), _jsx(Button, { className: "w-full", variant: "outline", disabled: !hasOrg || savePolicy.isPending, onClick: () => savePolicy.mutate({
                                                enabled: settings?.enabled || false,
                                                approverEmails: approverList,
                                            }), children: "Save approvers" })] })] })] }), _jsxs("section", { className: "rounded-2xl border bg-card p-5", children: [_jsx("h2", { className: "text-lg font-semibold text-foreground", children: "Pending and recent requests" }), _jsxs("div", { className: "mt-4 space-y-3", children: [(approvals || []).map((approval) => (_jsx("div", { className: "rounded-xl border bg-muted/30 px-4 py-3", children: _jsxs("div", { className: "flex items-start justify-between gap-3", children: [_jsxs("div", { children: [_jsx("div", { className: "text-sm font-medium text-foreground", children: approval.summary }), _jsxs("div", { className: "mt-1 text-xs text-muted-foreground", children: [approval.status, " \u00B7 requested by ", approval.requestedBy] })] }), approval.status === "pending" && (_jsxs("div", { className: "flex gap-2", children: [_jsx(Button, { size: "sm", onClick: () => approve.mutate({ id: approval.id }), children: "Approve" }), _jsx(Button, { size: "sm", variant: "outline", onClick: () => reject.mutate({
                                                            id: approval.id,
                                                            reason: "Rejected in dispatch UI",
                                                        }), children: "Reject" })] }))] }) }, approval.id))), (approvals?.length || 0) === 0 && (_jsx("div", { className: "rounded-xl border border-dashed px-4 py-8 text-sm text-muted-foreground", children: "No approval requests yet." }))] })] })] }) }));
}
//# sourceMappingURL=approvals.js.map