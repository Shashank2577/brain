import { jsx as _jsx, jsxs as _jsxs } from "react/jsx-runtime";
import { useActionMutation, useActionQuery } from "@agent-native/core/client";
import { toast } from "sonner";
import { DispatchShell } from "../../components/dispatch-shell.js";
import { Button } from "../../components/ui/button.js";
export function meta() {
    return [{ title: "Identities — Dispatch" }];
}
export default function IdentitiesRoute() {
    const { data } = useActionQuery("list-linked-identities", {});
    const createToken = useActionMutation("create-link-token", {
        onSuccess: () => toast.success("Link token created"),
    });
    return (_jsx(DispatchShell, { title: "Identities", description: "Link external senders to workspace users.", children: _jsxs("div", { className: "grid gap-4 xl:grid-cols-2", children: [_jsxs("section", { className: "rounded-2xl border bg-card p-5", children: [_jsxs("div", { className: "flex flex-wrap items-center justify-between gap-2", children: [_jsx("h2", { className: "text-lg font-semibold text-foreground", children: "Active links" }), _jsxs("div", { className: "flex shrink-0 gap-2", children: [_jsx(Button, { variant: "outline", onClick: () => createToken.mutate({ platform: "slack" }), children: "New Slack token" }), _jsx(Button, { onClick: () => createToken.mutate({ platform: "telegram" }), children: "New Telegram token" })] })] }), _jsxs("div", { className: "mt-4 space-y-3", children: [(data?.links || []).map((link) => (_jsxs("div", { className: "rounded-xl border bg-muted/30 px-4 py-3", children: [_jsx("div", { className: "text-sm font-medium text-foreground", children: link.externalUserName || link.externalUserId }), _jsxs("div", { className: "mt-1 text-xs text-muted-foreground", children: [link.platform, " \u2192 ", link.ownerEmail] })] }, link.id))), (data?.links?.length || 0) === 0 && (_jsxs("div", { className: "rounded-xl border border-dashed px-4 py-8 text-sm text-muted-foreground", children: ["No linked identities yet. Generate a token and ask the user to send ", _jsx("code", { children: "/link TOKEN" }), " from Slack or Telegram."] }))] })] }), _jsxs("section", { className: "rounded-2xl border bg-card p-5", children: [_jsx("h2", { className: "text-lg font-semibold text-foreground", children: "Link tokens" }), _jsxs("div", { className: "mt-4 space-y-3", children: [(data?.tokens || []).map((token) => (_jsxs("div", { className: "rounded-xl border px-4 py-3", children: [_jsxs("div", { className: "text-sm font-medium text-foreground", children: ["/link ", token.token] }), _jsxs("div", { className: "mt-1 text-xs text-muted-foreground", children: [token.platform, " \u00B7 expires", " ", new Date(token.expiresAt).toLocaleString(), token.claimedAt
                                                    ? ` · claimed by ${token.claimedByExternalUserName || token.claimedByExternalUserId}`
                                                    : " · waiting to be claimed"] })] }, token.id))), (data?.tokens?.length || 0) === 0 && (_jsx("div", { className: "rounded-xl border border-dashed px-4 py-8 text-sm text-muted-foreground", children: "No active link tokens." }))] })] })] }) }));
}
//# sourceMappingURL=identities.js.map