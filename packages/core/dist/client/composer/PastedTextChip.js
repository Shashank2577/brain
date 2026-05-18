import { jsx as _jsx, jsxs as _jsxs } from "react/jsx-runtime";
import { useCallback, useEffect, useState } from "react";
import { IconClipboardText, IconX } from "@tabler/icons-react";
import * as PopoverPrimitive from "@radix-ui/react-popover";
import { cn } from "../utils.js";
import { countLines, unwrapAttachmentEnvelope } from "./pasted-text.js";
function readAttachmentText(attachment) {
    if ("file" in attachment && attachment.file instanceof File) {
        return attachment.file.text();
    }
    const textPart = attachment.content?.find((p) => p.type === "text" && "text" in p && typeof p.text === "string");
    return textPart ? unwrapAttachmentEnvelope(textPart.text) : "";
}
function usePastedAttachmentText(attachment) {
    const [text, setText] = useState("");
    useEffect(() => {
        let cancelled = false;
        const result = readAttachmentText(attachment);
        if (typeof result === "string") {
            setText(result);
            return;
        }
        result
            .then((value) => {
            if (!cancelled)
                setText(value);
        })
            .catch(() => { });
        return () => {
            cancelled = true;
        };
    }, [attachment]);
    return { text, lines: countLines(text), chars: text.length };
}
export function PastedTextChip({ attachment, onRemove, compact = false, }) {
    const [open, setOpen] = useState(false);
    const { text, lines, chars } = usePastedAttachmentText(attachment);
    const handleRemove = useCallback((event) => {
        event.stopPropagation();
        onRemove?.(attachment.id);
    }, [attachment.id, onRemove]);
    const summary = lines > 0 ? `${lines} lines` : `${chars} chars`;
    return (_jsxs(PopoverPrimitive.Root, { open: open, onOpenChange: setOpen, children: [_jsx(PopoverPrimitive.Trigger, { asChild: true, children: _jsxs("button", { type: "button", className: cn("group relative inline-flex items-center gap-2 rounded-md border border-border/70 bg-muted/50 text-left text-foreground hover:bg-muted/70 cursor-pointer", compact
                        ? "max-w-[220px] px-2 py-1.5 text-xs"
                        : "max-w-[260px] px-2.5 py-2 text-xs", onRemove && !compact && "pr-7"), "aria-label": "Preview pasted text", children: [_jsx("span", { className: cn("flex shrink-0 items-center justify-center rounded bg-background text-muted-foreground", compact ? "h-6 w-6" : "h-8 w-8"), children: _jsx(IconClipboardText, { className: compact ? "h-3.5 w-3.5" : "h-4 w-4" }) }), _jsxs("span", { className: "min-w-0 flex-1", children: [_jsx("span", { className: "block truncate font-medium", children: "Pasted text" }), _jsx("span", { className: "block text-[11px] text-muted-foreground", children: summary })] }), onRemove && (_jsx("span", { role: "button", tabIndex: -1, onClick: handleRemove, "aria-label": "Remove pasted text", className: cn("flex h-5 w-5 shrink-0 cursor-pointer items-center justify-center rounded text-muted-foreground hover:text-foreground", compact ? "" : "absolute right-1.5 top-1.5"), children: _jsx(IconX, { className: "h-3 w-3" }) }))] }) }), _jsx(PopoverPrimitive.Portal, { children: _jsxs(PopoverPrimitive.Content, { side: "top", align: "start", sideOffset: 6, collisionPadding: 12, className: "z-50 w-[min(560px,calc(100vw-32px))] rounded-lg border border-border bg-popover text-popover-foreground shadow-lg animate-in fade-in-0 zoom-in-95", children: [_jsxs("div", { className: "flex items-center justify-between gap-2 border-b border-border px-3 py-2", children: [_jsxs("div", { className: "flex items-center gap-2 min-w-0", children: [_jsx(IconClipboardText, { className: "h-4 w-4 shrink-0 text-muted-foreground" }), _jsx("span", { className: "text-sm font-medium truncate", children: "Pasted text" }), _jsxs("span", { className: "text-[11px] text-muted-foreground shrink-0", children: [lines, " lines \u00B7 ", chars, " chars"] })] }), _jsx("button", { type: "button", onClick: () => setOpen(false), "aria-label": "Close preview", className: "flex h-6 w-6 shrink-0 cursor-pointer items-center justify-center rounded text-muted-foreground hover:text-foreground", children: _jsx(IconX, { className: "h-3.5 w-3.5" }) })] }), _jsx("pre", { className: "max-h-[60vh] overflow-auto px-3 py-2 text-[12px] leading-[1.5] whitespace-pre-wrap break-words font-mono text-foreground", children: text })] }) })] }));
}
//# sourceMappingURL=PastedTextChip.js.map