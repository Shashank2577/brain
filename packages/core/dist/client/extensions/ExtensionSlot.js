import { jsx as _jsx, jsxs as _jsxs } from "react/jsx-runtime";
import { agentNativePath } from "../api-path.js";
import { useState } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { IconPlus } from "@tabler/icons-react";
import { Popover, PopoverContent, PopoverTrigger, } from "../components/ui/popover.js";
import { sendToAgentChat } from "../agent-chat.js";
import { EmbeddedExtension } from "./EmbeddedExtension.js";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger, } from "../components/ui/tooltip.js";
/**
 * A named UI slot that user-installed extensions can render into. Apps drop this
 * component wherever they want to allow extensions; the framework handles
 * fetching, sandboxing, context delivery, and lifecycle.
 *
 * Example:
 *
 *   <ExtensionSlot
 *     id="mail.contact-sidebar.bottom"
 *     context={{ contactEmail }}
 *     showEmptyAffordance
 *   />
 */
export function ExtensionSlot({ id, context, showEmptyAffordance, className, toolClassName, }) {
    const { data: installs = [], isLoading } = useQuery({
        queryKey: ["slot-installs", id],
        queryFn: async () => {
            const res = await fetch(agentNativePath(`/_agent-native/slots/${encodeURIComponent(id)}/installs`));
            if (!res.ok)
                return [];
            return res.json();
        },
    });
    if (isLoading) {
        return null;
    }
    if (installs.length === 0) {
        if (!showEmptyAffordance)
            return null;
        return (_jsx("div", { className: className, children: _jsx(SlotEmptyAffordance, { slotId: id }) }));
    }
    return (_jsx("div", { className: className, children: installs.map((install) => (_jsx(EmbeddedExtension, { extensionId: install.extensionId, slotId: id, context: context, className: toolClassName }, install.installId))) }));
}
function SlotEmptyAffordance({ slotId }) {
    const [open, setOpen] = useState(false);
    const { data: available = [], isLoading } = useQuery({
        queryKey: ["slot-available", slotId],
        queryFn: async () => {
            const res = await fetch(agentNativePath(`/_agent-native/slots/${encodeURIComponent(slotId)}/available`));
            if (!res.ok)
                return [];
            return res.json();
        },
        enabled: open,
    });
    const queryClient = useQueryClient();
    const install = async (extensionId) => {
        queryClient.setQueryData(["slot-installs", slotId], (old) => {
            const extension = available.find((t) => t.extensionId === extensionId);
            if (!extension || !old)
                return old;
            return [
                ...old,
                {
                    installId: `optimistic-${extensionId}`,
                    extensionId,
                    name: extension.name,
                    description: extension.description,
                    icon: extension.icon,
                    updatedAt: new Date().toISOString(),
                    position: old.length,
                    config: extension.config,
                },
            ];
        });
        setOpen(false);
        try {
            await fetch(agentNativePath(`/_agent-native/slots/${encodeURIComponent(slotId)}/install`), {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ extensionId }),
            });
        }
        finally {
            queryClient.invalidateQueries({ queryKey: ["slot-installs", slotId] });
        }
    };
    const requestNew = () => {
        setOpen(false);
        sendToAgentChat({
            message: `Create a new widget that fits in slot "${slotId}". I'll describe what it should do next.`,
            submit: false,
            openSidebar: true,
        });
    };
    const slotDescription = describeSlot(slotId);
    return (_jsxs(Popover, { open: open, onOpenChange: setOpen, children: [_jsx(TooltipProvider, { delayDuration: 200, children: _jsxs(Tooltip, { children: [_jsx(TooltipTrigger, { asChild: true, children: _jsx(PopoverTrigger, { asChild: true, children: _jsxs("button", { type: "button", className: "flex w-full items-center gap-2 px-4 py-2 text-[11px] text-muted-foreground/60 hover:text-muted-foreground cursor-pointer", children: [_jsx("div", { className: "h-5 w-5 rounded-md border border-dashed border-border/40 flex items-center justify-center shrink-0", children: _jsx(IconPlus, { className: "h-3 w-3" }) }), _jsx("span", { children: "Add widget" })] }) }) }), _jsx(TooltipContent, { children: "Add a widget" })] }) }), _jsxs(PopoverContent, { side: "left", align: "end", sideOffset: 8, className: "w-72 p-0 overflow-hidden", children: [_jsxs("div", { className: "px-3 py-2 border-b border-border/40", children: [_jsx("p", { className: "text-[12px] font-medium", children: slotDescription.title }), _jsx("p", { className: "text-[11px] text-muted-foreground/70", children: slotDescription.description })] }), _jsxs("div", { className: "max-h-72 overflow-y-auto py-1", children: [isLoading && (_jsx("div", { className: "px-3 py-3 text-[12px] text-muted-foreground/60", children: "Loading\u2026" })), !isLoading && available.length === 0 && (_jsx("div", { className: "px-3 py-3 text-[12px] text-muted-foreground/60", children: "No widgets available for this slot yet." })), available.map((extension) => (_jsx("button", { type: "button", onClick: () => install(extension.extensionId), className: "flex w-full items-start gap-2 px-3 py-2 text-left hover:bg-accent cursor-pointer", children: _jsxs("div", { className: "flex-1 min-w-0", children: [_jsx("p", { className: "text-[12px] font-medium truncate", children: extension.name }), extension.description && (_jsx("p", { className: "text-[11px] text-muted-foreground/70 truncate", children: extension.description }))] }) }, extension.extensionId)))] }), _jsx("div", { className: "border-t border-border/40 p-1", children: _jsxs("button", { type: "button", onClick: requestNew, className: "flex w-full items-center gap-2 rounded-md px-3 py-2 text-[12px] text-muted-foreground hover:bg-accent hover:text-foreground cursor-pointer", children: [_jsx(IconPlus, { className: "h-3.5 w-3.5" }), _jsx("span", { children: "Build a new widget" })] }) })] })] }));
}
function describeSlot(slotId) {
    if (slotId === "mail.contact-sidebar.bottom") {
        return {
            title: "Contact sidebar widget",
            description: "Appears beside the current conversation with contact and thread context.",
        };
    }
    return {
        title: "Add widget here",
        description: slotId,
    };
}
//# sourceMappingURL=ExtensionSlot.js.map