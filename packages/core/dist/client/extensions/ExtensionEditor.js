import { jsx as _jsx, jsxs as _jsxs, Fragment as _Fragment } from "react/jsx-runtime";
import { agentNativePath } from "../api-path.js";
import { useState, useEffect } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { Link, useNavigate } from "react-router";
import { IconArrowLeft, IconDeviceFloppy, IconDots, IconTrash, IconX, } from "@tabler/icons-react";
import { Popover, PopoverContent, PopoverTrigger, } from "../components/ui/popover.js";
import { cn } from "../utils.js";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger, } from "../components/ui/tooltip.js";
import { deleteOrHideExtension, invalidateExtensionRemoval, } from "./delete-extension.js";
export function ExtensionEditor({ extensionId }) {
    const navigate = useNavigate();
    const queryClient = useQueryClient();
    const isEdit = !!extensionId;
    const [name, setName] = useState("");
    const [description, setDescription] = useState("");
    const [content, setContent] = useState("");
    const [saving, setSaving] = useState(false);
    const [deleting, setDeleting] = useState(false);
    const [menuOpen, setMenuOpen] = useState(false);
    const [confirmingDelete, setConfirmingDelete] = useState(false);
    const { data: slots = [] } = useQuery({
        queryKey: ["extension-slots", extensionId],
        queryFn: async () => {
            const res = await fetch(agentNativePath(`/_agent-native/slots/extension/${extensionId}`));
            if (!res.ok)
                return [];
            return res.json();
        },
        enabled: isEdit && menuOpen,
    });
    const { data: existingTool } = useQuery({
        queryKey: ["extension", extensionId],
        queryFn: async () => {
            const res = await fetch(agentNativePath(`/_agent-native/extensions/${extensionId}`));
            if (!res.ok)
                throw new Error("Failed to fetch extension");
            return res.json();
        },
        enabled: isEdit,
    });
    useEffect(() => {
        if (existingTool) {
            setName(existingTool.name ?? "");
            setDescription(existingTool.description ?? "");
            setContent(existingTool.content ?? "");
        }
    }, [existingTool]);
    const handleSave = async () => {
        if (!name.trim())
            return;
        setSaving(true);
        try {
            const body = JSON.stringify({
                name: name.trim(),
                description: description.trim() || undefined,
                content,
            });
            if (isEdit) {
                const res = await fetch(agentNativePath(`/_agent-native/extensions/${extensionId}`), {
                    method: "PUT",
                    headers: { "Content-Type": "application/json" },
                    body,
                });
                if (!res.ok)
                    throw new Error("Update failed");
                queryClient.invalidateQueries({ queryKey: ["extension", extensionId] });
                queryClient.invalidateQueries({ queryKey: ["extensions"] });
                navigate(`/extensions/${extensionId}`);
            }
            else {
                const res = await fetch(agentNativePath("/_agent-native/extensions"), {
                    method: "POST",
                    headers: { "Content-Type": "application/json" },
                    body,
                });
                if (!res.ok)
                    throw new Error("Create failed");
                const created = await res.json();
                queryClient.invalidateQueries({ queryKey: ["extensions"] });
                navigate(`/extensions/${created.id}`);
            }
        }
        finally {
            setSaving(false);
        }
    };
    const handleDelete = async () => {
        if (!extensionId)
            return;
        setDeleting(true);
        const prev = queryClient.getQueryData(["extensions"]);
        try {
            queryClient.setQueryData(["extensions"], (old) => (old ?? []).filter((t) => t.id !== extensionId));
            await deleteOrHideExtension({
                id: extensionId,
                canDelete: existingTool?.canDelete,
            });
            invalidateExtensionRemoval(queryClient, extensionId);
            slots.forEach((s) => queryClient.invalidateQueries({
                queryKey: ["slot-installs", s.slotId],
            }));
            navigate("/extensions");
        }
        catch {
            if (prev)
                queryClient.setQueryData(["extensions"], prev);
        }
        finally {
            setDeleting(false);
            setConfirmingDelete(false);
            setMenuOpen(false);
        }
    };
    const handleRemoveFromSlot = async (slotId) => {
        if (!extensionId)
            return;
        try {
            await fetch(agentNativePath(`/_agent-native/slots/${encodeURIComponent(slotId)}/install/${encodeURIComponent(extensionId)}`), { method: "DELETE" });
        }
        finally {
            queryClient.invalidateQueries({ queryKey: ["slot-installs", slotId] });
        }
    };
    return (_jsx(TooltipProvider, { delayDuration: 200, children: _jsxs("div", { className: "flex h-full flex-col", children: [_jsxs("header", { className: "flex items-center justify-between border-b px-4 py-3", children: [_jsxs("div", { className: "flex items-center gap-3", children: [_jsx(Link, { to: isEdit ? `/extensions/${extensionId}` : "/extensions", className: "inline-flex cursor-pointer items-center justify-center rounded-md p-1 text-muted-foreground hover:bg-accent hover:text-accent-foreground", "aria-label": "Back", children: _jsx(IconArrowLeft, { className: "h-4 w-4" }) }), _jsx("h1", { className: "text-sm font-semibold", children: isEdit ? "Edit Extension" : "New Extension" })] }), _jsxs("div", { className: "flex items-center gap-2", children: [_jsxs("button", { type: "button", onClick: handleSave, disabled: saving || !name.trim(), className: cn("inline-flex cursor-pointer items-center justify-center gap-1.5 rounded-md bg-primary px-3 py-1.5 text-sm text-primary-foreground hover:bg-primary/90", (saving || !name.trim()) && "opacity-60"), children: [_jsx(IconDeviceFloppy, { className: "h-3.5 w-3.5" }), saving ? "Saving..." : isEdit ? "Save" : "Create"] }), isEdit && (_jsxs(Popover, { open: menuOpen, onOpenChange: (o) => {
                                        setMenuOpen(o);
                                        if (!o)
                                            setConfirmingDelete(false);
                                    }, children: [_jsxs(Tooltip, { children: [_jsx(TooltipTrigger, { asChild: true, children: _jsx(PopoverTrigger, { asChild: true, children: _jsx("button", { type: "button", className: "inline-flex h-8 w-8 cursor-pointer items-center justify-center rounded-md text-muted-foreground hover:bg-accent hover:text-accent-foreground", "aria-label": "More options", children: _jsx(IconDots, { className: "h-4 w-4" }) }) }) }), _jsx(TooltipContent, { children: "More options" })] }), _jsx(PopoverContent, { align: "end", sideOffset: 4, className: "w-72 p-0", children: !confirmingDelete ? (_jsxs(_Fragment, { children: [_jsxs("div", { className: "px-3 py-2 border-b border-border/40", children: [_jsx("p", { className: "text-[12px] font-medium", children: "Appears in" }), slots.length === 0 ? (_jsx("p", { className: "text-[11px] text-muted-foreground/70 mt-0.5", children: "Not installed in any widget areas. Ask the agent to add it somewhere." })) : (_jsxs("p", { className: "text-[11px] text-muted-foreground/70 mt-0.5", children: ["This extension can render in ", slots.length, " widget area", slots.length === 1 ? "" : "s", "."] }))] }), slots.length > 0 && (_jsx("div", { className: "max-h-48 overflow-y-auto py-1", children: slots.map((s) => (_jsxs("div", { className: "flex items-center gap-2 px-3 py-1.5 text-[12px]", children: [_jsx("span", { className: "flex-1 truncate font-mono text-[11px] text-muted-foreground", children: s.slotId }), _jsxs(Tooltip, { children: [_jsx(TooltipTrigger, { asChild: true, children: _jsx("button", { type: "button", onClick: () => handleRemoveFromSlot(s.slotId), className: "rounded p-1 text-muted-foreground/60 hover:bg-accent hover:text-foreground cursor-pointer", "aria-label": "Remove from this widget area", children: _jsx(IconX, { className: "h-3.5 w-3.5" }) }) }), _jsx(TooltipContent, { children: "Remove from this widget area (for me)" })] })] }, s.id))) })), _jsx("div", { className: "border-t border-border/40 p-1", children: _jsxs("button", { type: "button", onClick: () => setConfirmingDelete(true), className: "flex w-full items-center gap-2 rounded-sm px-2 py-1.5 text-[12px] text-destructive hover:bg-destructive/10 cursor-pointer text-left", children: [_jsx(IconTrash, { className: "h-3.5 w-3.5" }), _jsx("span", { children: existingTool?.canDelete === false
                                                                        ? "Remove from my list..."
                                                                        : "Delete extension..." })] }) })] })) : (_jsxs("div", { className: "flex flex-col gap-2 p-3", children: [_jsxs("p", { className: "text-[12px]", children: [existingTool?.canDelete === false
                                                                ? "Remove "
                                                                : "Delete ", _jsx("span", { className: "font-medium", children: name }), "?", existingTool?.canDelete === false
                                                                ? " This hides it from your Extensions list without deleting it for anyone else."
                                                                : " This removes the extension everywhere, for everyone it's shared with."] }), _jsxs("div", { className: "flex justify-end gap-1", children: [_jsx("button", { type: "button", onClick: () => setConfirmingDelete(false), className: "rounded-md px-2 py-1 text-[12px] hover:bg-accent cursor-pointer", children: "Cancel" }), _jsx("button", { type: "button", onClick: handleDelete, disabled: deleting, className: cn("rounded-md bg-destructive px-2 py-1 text-[12px] text-destructive-foreground hover:bg-destructive/90 cursor-pointer", deleting && "opacity-60"), children: deleting
                                                                    ? existingTool?.canDelete === false
                                                                        ? "Removing..."
                                                                        : "Deleting..."
                                                                    : existingTool?.canDelete === false
                                                                        ? "Remove"
                                                                        : "Delete" })] })] })) })] }))] })] }), _jsxs("div", { className: "flex flex-1 overflow-hidden", children: [_jsxs("div", { className: "flex w-1/2 flex-col gap-4 overflow-auto border-r p-4", children: [_jsxs("div", { children: [_jsx("label", { className: "mb-1.5 block text-sm font-medium text-foreground", children: "Name" }), _jsx("input", { type: "text", value: name, onChange: (e) => setName(e.target.value), placeholder: "My Extension", className: "h-9 w-full rounded-md border border-input bg-background px-3 text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2 focus:ring-offset-background" })] }), _jsxs("div", { children: [_jsx("label", { className: "mb-1.5 block text-sm font-medium text-foreground", children: "Description" }), _jsx("textarea", { value: description, onChange: (e) => setDescription(e.target.value), placeholder: "What does this extension do?", rows: 2, className: "w-full resize-none rounded-md border border-input bg-background px-3 py-2 text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2 focus:ring-offset-background" })] }), _jsxs("div", { className: "flex flex-1 flex-col", children: [_jsx("label", { className: "mb-1.5 block text-sm font-medium text-foreground", children: "Content" }), _jsx("textarea", { value: content, onChange: (e) => setContent(e.target.value), placeholder: "<html>...</html>", className: "flex-1 resize-none rounded-md border border-input bg-background p-3 font-mono text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2 focus:ring-offset-background", spellCheck: false })] })] }), _jsx("div", { className: "w-1/2", children: content ? (_jsx("iframe", { srcDoc: content, className: "h-full w-full border-0", sandbox: "allow-scripts allow-forms", title: "Extension preview" })) : (_jsx("div", { className: "flex h-full items-center justify-center text-sm text-muted-foreground", children: "Preview will appear here" })) })] })] }) }));
}
//# sourceMappingURL=ExtensionEditor.js.map