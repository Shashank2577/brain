import { jsx as _jsx, jsxs as _jsxs } from "react/jsx-runtime";
import { useState, useCallback } from "react";
import { IconBrandSlack, IconBrandTelegram, IconBrandWhatsapp, IconMessageCircle, IconChevronDown, IconChevronRight, IconCopy, IconCheck, } from "@tabler/icons-react";
import { agentNativePath } from "../api-path.js";
import { Tooltip, TooltipContent, TooltipTrigger, } from "../components/ui/tooltip.js";
// eslint-disable-next-line @typescript-eslint/no-explicit-any
const platformIcons = {
    slack: IconBrandSlack,
    telegram: IconBrandTelegram,
    whatsapp: IconBrandWhatsapp,
};
function StatusDot({ enabled, configured, }) {
    const color = enabled && configured
        ? "bg-green-500"
        : configured
            ? "bg-yellow-500"
            : "bg-gray-400";
    return _jsx("span", { className: `inline-block h-2 w-2 rounded-full ${color}` });
}
export function IntegrationCard({ status, onRefresh, }) {
    const [expanded, setExpanded] = useState(false);
    const [toggling, setToggling] = useState(false);
    const [copied, setCopied] = useState(false);
    const [toggleError, setToggleError] = useState(null);
    const Icon = platformIcons[status.platform] || IconMessageCircle;
    const handleToggle = useCallback(async () => {
        setToggling(true);
        setToggleError(null);
        try {
            const action = status.enabled ? "disable" : "enable";
            const res = await fetch(agentNativePath(`/_agent-native/integrations/${status.platform}/${action}`), { method: "POST" });
            if (res.ok) {
                onRefresh();
                return;
            }
            const data = (await res.json().catch(() => null));
            setToggleError(data?.error ||
                res.statusText ||
                `Couldn't ${action} ${status.label} (HTTP ${res.status})`);
        }
        catch (err) {
            setToggleError(err instanceof Error
                ? err.message
                : "Network error reaching the server");
        }
        finally {
            setToggling(false);
        }
    }, [status.platform, status.enabled, status.label, onRefresh]);
    const handleCopy = useCallback(async () => {
        if (!status.webhookUrl)
            return;
        await navigator.clipboard.writeText(status.webhookUrl);
        setCopied(true);
        setTimeout(() => setCopied(false), 2000);
    }, [status.webhookUrl]);
    return (_jsxs("div", { className: "rounded-md border border-border bg-background", children: [_jsxs("button", { onClick: () => setExpanded(!expanded), className: "flex w-full items-center gap-2 px-2.5 py-2 text-left hover:bg-accent/50", children: [expanded ? (_jsx(IconChevronDown, { size: 12, className: "text-muted-foreground shrink-0" })) : (_jsx(IconChevronRight, { size: 12, className: "text-muted-foreground shrink-0" })), _jsx(Icon, { size: 16, className: "text-muted-foreground shrink-0" }), _jsx("span", { className: "flex-1 text-xs font-medium text-foreground", children: status.label }), _jsx(StatusDot, { enabled: status.enabled, configured: status.configured })] }), expanded && (_jsxs("div", { className: "border-t border-border px-2.5 py-2 space-y-2", children: [status.webhookUrl && (_jsxs("div", { children: [_jsx("div", { className: "text-[10px] font-medium text-muted-foreground mb-1", children: "Webhook URL" }), _jsxs("div", { className: "flex items-center gap-1", children: [_jsx("code", { className: "flex-1 truncate rounded bg-muted px-1.5 py-0.5 text-[10px] text-foreground", children: status.webhookUrl }), _jsxs(Tooltip, { children: [_jsx(TooltipTrigger, { asChild: true, children: _jsx("button", { onClick: handleCopy, className: "shrink-0 rounded p-0.5 text-muted-foreground hover:text-foreground hover:bg-accent/50", children: copied ? (_jsx(IconCheck, { size: 12 })) : (_jsx(IconCopy, { size: 12 })) }) }), _jsx(TooltipContent, { children: "Copy webhook URL" })] })] })] })), status.error && (_jsx("p", { className: "text-[10px] text-destructive", children: status.error })), toggleError && (_jsx("p", { className: "text-[10px] text-destructive", children: toggleError })), !status.configured && !status.error && (_jsx("p", { className: "text-[10px] text-muted-foreground", children: "Not configured. Set the required secrets to enable this integration." })), status.configured && (_jsx("button", { onClick: handleToggle, disabled: toggling, className: "w-full rounded-md border border-border px-2 py-1 text-[11px] font-medium text-foreground hover:bg-accent/50 disabled:opacity-50", children: toggling ? "..." : status.enabled ? "Disable" : "Enable" }))] }))] }));
}
//# sourceMappingURL=IntegrationCard.js.map