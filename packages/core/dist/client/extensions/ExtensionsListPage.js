import { jsx as _jsx, jsxs as _jsxs } from "react/jsx-runtime";
import { agentNativePath } from "../api-path.js";
import { useState, useEffect } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { Link } from "react-router";
import { IconArrowLeft, IconDotsVertical, IconPlus, IconTool, IconTrash, } from "@tabler/icons-react";
import { cn } from "../utils.js";
import { AgentToggleButton } from "../AgentPanel.js";
import { NotificationsBell } from "../notifications/NotificationsBell.js";
import { sendToAgentChat } from "../agent-chat.js";
import { PromptComposer } from "../composer/PromptComposer.js";
import { Popover, PopoverContent, PopoverTrigger, } from "../components/ui/popover.js";
import { TOOLS_ORDER_CHANGE_EVENT, applyToolsOrder, getToolsOrder, } from "./extension-order.js";
import { deleteOrHideExtension, invalidateExtensionRemoval, } from "./delete-extension.js";
let lastCreateSubmission = null;
function submitCreateTool(prompt) {
    const trimmed = prompt.trim();
    if (!trimmed)
        return;
    const now = Date.now();
    if (lastCreateSubmission &&
        lastCreateSubmission.prompt === trimmed &&
        now - lastCreateSubmission.at < 2_000) {
        return;
    }
    lastCreateSubmission = { prompt: trimmed, at: now };
    sendToAgentChat({
        message: `Create an extension: ${trimmed}`,
        submit: true,
        openSidebar: true,
        newTab: true,
    });
}
function CreateToolInput({ className }) {
    return (_jsxs("div", { className: cn("flex flex-col gap-2 text-left", className), children: [_jsx("p", { className: "px-1 text-sm font-medium text-foreground", children: "What should it do?" }), _jsx(PromptComposer, { autoFocus: true, className: "text-left", placeholder: "A todo list, API dashboard, calculator...", draftScope: "extensions:create", onSubmit: (text) => submitCreateTool(text) })] }));
}
export function ExtensionsListPage() {
    const [showCreate, setShowCreate] = useState(false);
    const [confirmDeleteId, setConfirmDeleteId] = useState(null);
    const [deletingId, setDeletingId] = useState(null);
    const queryClient = useQueryClient();
    const [toolOrderState, setToolOrderState] = useState(() => typeof window !== "undefined" ? getToolsOrder() : []);
    useEffect(() => {
        fetch(agentNativePath("/_agent-native/application-state/navigation"), {
            method: "PUT",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ view: "extensions" }),
        }).catch(() => { });
    }, []);
    useEffect(() => {
        if (typeof window === "undefined")
            return;
        const syncOrder = () => setToolOrderState(getToolsOrder());
        window.addEventListener(TOOLS_ORDER_CHANGE_EVENT, syncOrder);
        window.addEventListener("storage", syncOrder);
        return () => {
            window.removeEventListener(TOOLS_ORDER_CHANGE_EVENT, syncOrder);
            window.removeEventListener("storage", syncOrder);
        };
    }, []);
    const { data: extensions, isLoading } = useQuery({
        queryKey: ["extensions"],
        queryFn: async () => {
            const res = await fetch(agentNativePath("/_agent-native/extensions"));
            if (!res.ok)
                return [];
            return res.json();
        },
    });
    const toolList = toolOrderState.length > 0
        ? applyToolsOrder(extensions ?? [], toolOrderState)
        : (extensions ?? []);
    const handleCreate = (text) => {
        submitCreateTool(text);
        setShowCreate(false);
    };
    const handleDelete = async (extension) => {
        setDeletingId(extension.id);
        const previous = queryClient.getQueryData(["extensions"]);
        queryClient.setQueryData(["extensions"], (old) => (old ?? []).filter((item) => item.id !== extension.id));
        try {
            await deleteOrHideExtension(extension);
            invalidateExtensionRemoval(queryClient, extension.id);
        }
        catch {
            if (previous)
                queryClient.setQueryData(["extensions"], previous);
        }
        finally {
            setDeletingId(null);
            setConfirmDeleteId(null);
            queryClient.invalidateQueries({ queryKey: ["extensions"] });
        }
    };
    return (_jsxs("div", { className: "flex h-full w-full flex-col", children: [_jsxs("header", { className: "flex h-12 items-center justify-between border-b px-4 shrink-0", children: [_jsxs("div", { className: "flex items-center gap-2", children: [_jsx(Link, { to: "/", className: "inline-flex h-8 w-8 items-center justify-center rounded-md text-muted-foreground hover:bg-accent hover:text-foreground", "aria-label": "Back to app", children: _jsx(IconArrowLeft, { className: "h-4 w-4" }) }), _jsx("h1", { className: "text-sm font-semibold", children: "Extensions" })] }), _jsxs("div", { className: "flex items-center gap-2", children: [_jsxs(Popover, { open: showCreate, onOpenChange: setShowCreate, children: [_jsx(PopoverTrigger, { asChild: true, children: _jsxs("button", { type: "button", className: "inline-flex cursor-pointer items-center justify-center gap-1.5 rounded-md bg-primary px-3 py-1.5 text-sm font-medium text-primary-foreground hover:bg-primary/90", children: [_jsx(IconPlus, { className: "h-4 w-4" }), "New Extension"] }) }), _jsxs(PopoverContent, { align: "end", sideOffset: 6, className: "w-[420px] p-3", children: [_jsx("p", { className: "px-1 pb-2 text-sm font-semibold text-foreground", children: "New extension" }), _jsx(PromptComposer, { autoFocus: true, placeholder: "Describe what you'd like to build...", draftScope: "extensions:create-popover", onSubmit: handleCreate })] })] }), _jsx(NotificationsBell, {}), _jsx(AgentToggleButton, {})] })] }), _jsx("div", { className: "flex-1 overflow-auto px-5 py-8 sm:px-8 sm:py-10", children: isLoading ? (_jsx("div", { className: "grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-3", children: Array.from({ length: 6 }).map((_, i) => (_jsxs("div", { className: "rounded-lg border border-border bg-card p-5", children: [_jsx("div", { className: "mb-3 h-10 w-10 rounded-lg bg-muted animate-pulse" }), _jsx("div", { className: "mb-2 h-4 w-2/3 rounded bg-muted animate-pulse" }), _jsx("div", { className: "h-3 w-4/5 rounded bg-muted animate-pulse" })] }, i))) })) : toolList.length === 0 ? (_jsx("div", { className: "flex min-h-[calc(100vh-9rem)] flex-col items-center justify-start px-2 pb-12 pt-[clamp(5rem,18vh,11rem)] sm:pb-16", children: _jsxs("div", { className: "mx-auto flex w-full max-w-[34rem] flex-col gap-7", children: [_jsxs("div", { className: "flex flex-col items-center gap-3 text-center", children: [_jsx(IconTool, { className: "h-10 w-10 text-muted-foreground/40" }), _jsxs("div", { className: "space-y-1.5", children: [_jsx("p", { className: "text-base font-semibold text-foreground", children: "Create your first extension" }), _jsx("p", { className: "mx-auto max-w-sm text-sm text-muted-foreground", children: "Describe a small app and the agent will build it." })] })] }), _jsx(CreateToolInput, { className: "w-full" })] }) })) : (_jsx("div", { className: "grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-3", children: toolList.map((extension) => (_jsxs("div", { className: cn("group relative rounded-lg border border-border bg-card", "hover:border-primary/30 hover:shadow-sm"), children: [_jsxs(Link, { to: `/extensions/${extension.id}`, className: "block p-5 pr-12", children: [_jsx("div", { className: "mb-3 flex h-10 w-10 items-center justify-center rounded-lg bg-muted text-muted-foreground group-hover:bg-primary/10 group-hover:text-primary", children: _jsx(IconTool, { className: "h-5 w-5" }) }), _jsx("h3", { className: "mb-1 text-sm font-semibold text-foreground", children: extension.name }), extension.description && (_jsx("p", { className: "line-clamp-2 text-xs text-muted-foreground", children: extension.description }))] }), _jsxs(Popover, { open: confirmDeleteId === extension.id, onOpenChange: (open) => setConfirmDeleteId(open ? extension.id : null), children: [_jsx(PopoverTrigger, { asChild: true, children: _jsx("button", { type: "button", className: "absolute right-3 top-3 inline-flex h-8 w-8 items-center justify-center rounded-md text-muted-foreground opacity-0 hover:bg-accent hover:text-foreground focus:opacity-100 focus:outline-none focus:ring-2 focus:ring-ring group-hover:opacity-100", "aria-label": `Options for ${extension.name}`, children: _jsx(IconDotsVertical, { className: "h-4 w-4" }) }) }), _jsx(PopoverContent, { align: "end", sideOffset: 4, className: "w-64 p-0", children: _jsxs("div", { className: "p-3", children: [_jsxs("p", { className: "text-[12px]", children: [extension.canDelete === false ? "Remove " : "Delete ", _jsx("span", { className: "font-medium", children: extension.name }), "?", extension.canDelete === false
                                                            ? " This hides it from your Extensions list without deleting it for anyone else."
                                                            : " This removes it everywhere it is shared."] }), _jsxs("div", { className: "mt-3 flex justify-end gap-1", children: [_jsx("button", { type: "button", onClick: () => setConfirmDeleteId(null), className: "rounded-md px-2 py-1 text-[12px] hover:bg-accent", children: "Cancel" }), _jsxs("button", { type: "button", onClick: () => handleDelete(extension), disabled: deletingId === extension.id, className: cn("inline-flex items-center gap-1.5 rounded-md bg-destructive px-2 py-1 text-[12px] text-destructive-foreground hover:bg-destructive/90", deletingId === extension.id && "opacity-60"), children: [_jsx(IconTrash, { className: "h-3.5 w-3.5" }), deletingId === extension.id
                                                                    ? extension.canDelete === false
                                                                        ? "Removing..."
                                                                        : "Deleting..."
                                                                    : extension.canDelete === false
                                                                        ? "Remove"
                                                                        : "Delete"] })] })] }) })] })] }, extension.id))) })) })] }));
}
//# sourceMappingURL=ExtensionsListPage.js.map