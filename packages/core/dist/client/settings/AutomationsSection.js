import { jsxs as _jsxs, jsx as _jsx } from "react/jsx-runtime";
import { agentNativePath } from "../api-path.js";
import { useEffect, useState, useCallback } from "react";
import { IconBolt, IconClock, IconLoader2, IconPlayerPlay, IconPlus, IconTrash, } from "@tabler/icons-react";
import { sendToAgentChat } from "../agent-chat.js";
import { PromptComposer } from "../composer/PromptComposer.js";
import { Tooltip, TooltipContent, TooltipTrigger, } from "../components/ui/tooltip.js";
import { Popover, PopoverContent, PopoverTrigger, } from "../components/ui/popover.js";
function flattenJobs(nodes) {
    const items = [];
    for (const node of nodes) {
        if (node.type === "folder" && node.children) {
            items.push(...flattenJobs(node.children));
        }
        if (node.type === "file" &&
            node.kind === "job" &&
            node.resource &&
            node.jobMeta) {
            const name = node.name.replace(/\.md$/, "").replace(/-/g, " ");
            items.push({
                id: node.resource.id,
                name,
                path: node.resource.path,
                schedule: node.jobMeta.schedule,
                scheduleDescription: node.jobMeta.scheduleDescription,
                enabled: node.jobMeta.enabled ?? false,
                lastStatus: node.jobMeta.lastStatus,
                lastRun: node.jobMeta.lastRun,
                nextRun: node.jobMeta.nextRun,
            });
        }
    }
    return items;
}
export function AutomationsSection() {
    const [automations, setAutomations] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
    const [togglingId, setTogglingId] = useState(null);
    const [deletingId, setDeletingId] = useState(null);
    const [confirmDeleteId, setConfirmDeleteId] = useState(null);
    const [toast, setToast] = useState(null);
    const [reloadToken, setReloadToken] = useState(0);
    const showToast = useCallback((kind, text, ms = 2500) => {
        setToast({ kind, text });
        setTimeout(() => setToast(null), ms);
    }, []);
    useEffect(() => {
        let cancelled = false;
        setLoading(true);
        fetch(agentNativePath("/_agent-native/resources/tree"))
            .then(async (r) => {
            if (!r.ok)
                throw new Error(`Failed to load (${r.status})`);
            return (await r.json());
        })
            .then(({ tree }) => {
            if (cancelled)
                return;
            const jobsFolder = tree.find((n) => n.name === "jobs" && n.type === "folder");
            const items = jobsFolder?.children
                ? flattenJobs(jobsFolder.children)
                : [];
            setAutomations(items);
            setLoading(false);
        })
            .catch((err) => {
            if (cancelled)
                return;
            setError(err?.message ?? "Failed to load");
            setLoading(false);
        });
        return () => {
            cancelled = true;
        };
    }, [reloadToken]);
    const reload = useCallback(() => setReloadToken((t) => t + 1), []);
    const handleToggle = useCallback(async (item) => {
        setTogglingId(item.id);
        try {
            const res = await fetch(agentNativePath(`/_agent-native/resources/${encodeURIComponent(item.id)}`));
            if (!res.ok) {
                showToast("err", "Failed to read automation");
                return;
            }
            const resource = await res.json();
            const content = resource.content ?? "";
            const newEnabled = !item.enabled;
            const updated = content.replace(/^(enabled:\s*)(true|false)/m, `$1${newEnabled}`);
            const putRes = await fetch(agentNativePath(`/_agent-native/resources/${encodeURIComponent(item.id)}`), {
                method: "PUT",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ content: updated }),
            });
            if (!putRes.ok) {
                showToast("err", "Failed to update automation");
                return;
            }
            showToast("ok", newEnabled ? "Enabled" : "Disabled");
            reload();
        }
        finally {
            setTogglingId(null);
        }
    }, [reload, showToast]);
    const handleDelete = useCallback(async (item) => {
        setDeletingId(item.id);
        try {
            const res = await fetch(agentNativePath(`/_agent-native/resources/${encodeURIComponent(item.id)}`), {
                method: "DELETE",
                headers: { "Content-Type": "application/json" },
            });
            if (!res.ok) {
                showToast("err", "Failed to delete automation");
                return;
            }
            showToast("ok", "Deleted");
            setConfirmDeleteId(null);
            reload();
        }
        finally {
            setDeletingId(null);
        }
    }, [reload, showToast]);
    const handleFireTestEvent = useCallback(async () => {
        showToast("ok", "Firing test event...");
        try {
            const res = await fetch(agentNativePath("/_agent-native/automations/fire-test"), {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ data: {} }),
            });
            if (!res.ok) {
                showToast("err", `Failed to fire event (${res.status})`);
                return;
            }
            showToast("ok", "Event fired");
        }
        catch (err) {
            showToast("err", err?.message ?? "Failed to fire event");
        }
    }, [showToast]);
    const [newOpen, setNewOpen] = useState(false);
    const [newScope, setNewScope] = useState("personal");
    const handleNewSubmit = useCallback((text) => {
        const trimmed = text.trim();
        if (!trimmed)
            return;
        window.dispatchEvent(new CustomEvent("agent-panel:set-mode", {
            detail: { mode: "chat" },
        }));
        sendToAgentChat({
            message: trimmed,
            context: `The user wants to create a new automation. Scope: ${newScope}. Use manage-automations with action=define to create it. Ask clarifying questions if needed about what event to trigger on, conditions, and what actions to take.`,
            submit: true,
            newTab: true,
        });
        setNewOpen(false);
    }, [newScope]);
    if (error) {
        return (_jsxs("p", { className: "text-[10px] text-red-500", children: ["Failed to load automations: ", error] }));
    }
    if (loading) {
        return (_jsxs("div", { className: "flex items-center gap-1.5 text-[10px] text-muted-foreground", children: [_jsx(IconLoader2, { size: 10, className: "animate-spin" }), "Loading..."] }));
    }
    return (_jsxs("div", { className: "space-y-2", children: [_jsxs("div", { className: "flex items-center gap-1.5", children: [_jsxs(Popover, { open: newOpen, onOpenChange: setNewOpen, children: [_jsx(PopoverTrigger, { asChild: true, children: _jsxs("button", { type: "button", className: "inline-flex items-center gap-1 rounded border border-border px-2 py-1 text-[10px] font-medium text-muted-foreground hover:text-foreground hover:bg-accent/40", children: [_jsx(IconPlus, { size: 10 }), "New Automation"] }) }), _jsxs(PopoverContent, { align: "start", sideOffset: 6, collisionPadding: 8, className: "z-[260] w-[calc(100vw-24px)] max-w-[380px] p-3", children: [_jsx("p", { className: "px-1 pb-2 text-sm font-semibold text-foreground", children: "New automation" }), _jsx(PromptComposer, { autoFocus: true, placeholder: "Describe what you want to automate...", draftScope: "automations:create", onSubmit: handleNewSubmit }), _jsx("div", { className: "mt-2", children: _jsxs("select", { value: newScope, onChange: (e) => setNewScope(e.target.value), className: "w-full cursor-pointer rounded-md border border-input bg-background px-3 py-1.5 text-[12px] text-foreground", children: [_jsx("option", { value: "personal", children: "Personal" }), _jsx("option", { value: "organization", children: "Organization" })] }) })] })] }), automations.length > 0 && (_jsxs("button", { type: "button", onClick: handleFireTestEvent, className: "inline-flex items-center gap-1 rounded border border-border px-2 py-1 text-[10px] font-medium text-muted-foreground hover:text-foreground hover:bg-accent/40", children: [_jsx(IconPlayerPlay, { size: 10 }), "Fire Test Event"] }))] }), automations.length === 0 ? (_jsx("p", { className: "text-[10px] text-muted-foreground", children: "No automations yet. Click \"New Automation\" to create one, or ask the agent to set up a scheduled or event-triggered task." })) : (automations.map((item) => (_jsxs("div", { className: "rounded-md border border-border px-2.5 py-2 bg-accent/30", children: [_jsxs("div", { className: "flex items-center justify-between gap-2", children: [_jsxs("div", { className: "min-w-0 flex-1", children: [_jsxs("div", { className: "flex items-center gap-1.5", children: [_jsx("span", { className: "text-muted-foreground shrink-0", children: item.schedule ? (_jsx(IconClock, { size: 11 })) : (_jsx(IconBolt, { size: 11 })) }), _jsx("span", { className: "text-[11px] font-medium text-foreground truncate capitalize", children: item.name })] }), item.scheduleDescription && (_jsx("p", { className: "text-[10px] text-muted-foreground mt-0.5 ml-[17px]", children: item.scheduleDescription })), item.schedule && !item.scheduleDescription && (_jsx("p", { className: "text-[10px] text-muted-foreground mt-0.5 ml-[17px] font-mono", children: item.schedule }))] }), _jsxs("div", { className: "flex items-center gap-1.5 shrink-0", children: [_jsx(StatusBadge, { status: item.lastStatus }), _jsxs(Tooltip, { children: [_jsx(TooltipTrigger, { asChild: true, children: _jsx("button", { type: "button", onClick: () => handleToggle(item), disabled: togglingId === item.id, className: `rounded px-1.5 py-0.5 text-[9px] font-semibold uppercase tracking-wide ${item.enabled
                                                        ? "bg-green-500/15 text-green-500"
                                                        : "bg-accent/60 text-muted-foreground"} hover:opacity-80 disabled:opacity-40`, children: togglingId === item.id ? (_jsx(IconLoader2, { size: 10, className: "animate-spin" })) : item.enabled ? ("On") : ("Off") }) }), _jsx(TooltipContent, { children: item.enabled ? "Disable" : "Enable" })] }), confirmDeleteId === item.id ? (_jsxs("div", { className: "flex items-center gap-1", children: [_jsx("button", { type: "button", onClick: () => handleDelete(item), disabled: deletingId === item.id, className: "rounded px-1.5 py-0.5 text-[9px] font-semibold uppercase tracking-wide bg-red-500/15 text-red-500 hover:bg-red-500/25 disabled:opacity-40", children: deletingId === item.id ? (_jsx(IconLoader2, { size: 10, className: "animate-spin" })) : ("Confirm") }), _jsx("button", { type: "button", onClick: () => setConfirmDeleteId(null), className: "rounded px-1.5 py-0.5 text-[9px] font-semibold uppercase tracking-wide bg-accent/60 text-muted-foreground hover:text-foreground", children: "Cancel" })] })) : (_jsxs(Tooltip, { children: [_jsx(TooltipTrigger, { asChild: true, children: _jsx("button", { type: "button", onClick: () => setConfirmDeleteId(item.id), className: "text-muted-foreground hover:text-red-500 disabled:opacity-40", children: _jsx(IconTrash, { size: 12 }) }) }), _jsx(TooltipContent, { children: "Delete" })] }))] })] }), item.lastRun && (_jsxs("p", { className: "text-[10px] text-muted-foreground mt-1 ml-[17px]", children: ["Last run:", " ", new Date(item.lastRun).toLocaleString(undefined, {
                                month: "short",
                                day: "numeric",
                                hour: "numeric",
                                minute: "2-digit",
                            })] }))] }, item.id)))), toast && (_jsx("p", { className: `text-[10px] ${toast.kind === "ok" ? "text-green-500" : "text-red-500"}`, children: toast.text }))] }));
}
function StatusBadge({ status }) {
    if (!status)
        return null;
    const styles = {
        success: "bg-green-500/15 text-green-500",
        error: "bg-red-500/15 text-red-500",
        running: "bg-blue-500/15 text-blue-500",
        skipped: "bg-accent/60 text-muted-foreground",
    };
    return (_jsx("span", { className: `rounded-full px-1.5 py-0.5 text-[9px] font-semibold uppercase tracking-wide ${styles[status] ?? styles.skipped}`, children: status }));
}
//# sourceMappingURL=AutomationsSection.js.map