import { jsx as _jsx, jsxs as _jsxs } from "react/jsx-runtime";
import { useState, useCallback } from "react";
import * as PopoverPrimitive from "@radix-ui/react-popover";
import { IconThumbUp, IconThumbDown } from "@tabler/icons-react";
import { cn } from "../utils.js";
import { agentNativePath } from "../api-path.js";
const THUMBS_DOWN_CATEGORIES = [
    "Inaccurate",
    "Not helpful",
    "Wrong tool",
    "Too slow",
];
export function ThumbsFeedback({ threadId, runId, messageSeq, className, }) {
    const [selection, setSelection] = useState(null);
    const [categoryOpen, setCategoryOpen] = useState(false);
    const [submittedCategory, setSubmittedCategory] = useState(null);
    const sendFeedback = useCallback(async (feedbackType, value) => {
        try {
            await fetch(agentNativePath("/_agent-native/observability/feedback"), {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({
                    threadId,
                    runId,
                    messageSeq,
                    feedbackType,
                    value: value ?? "",
                }),
            });
        }
        catch {
            // Fire-and-forget; don't block the UI on feedback submission failures
        }
    }, [threadId, runId, messageSeq]);
    const handleThumbsUp = useCallback(() => {
        if (selection === "up")
            return;
        setSelection("up");
        setCategoryOpen(false);
        setSubmittedCategory(null);
        sendFeedback("thumbs_up");
    }, [selection, sendFeedback]);
    const handleThumbsDown = useCallback(() => {
        if (selection === "down") {
            setCategoryOpen((prev) => !prev);
            return;
        }
        setSelection("down");
        setCategoryOpen(true);
        sendFeedback("thumbs_down");
    }, [selection, sendFeedback]);
    const handleCategory = useCallback((category) => {
        setSubmittedCategory(category);
        setCategoryOpen(false);
        sendFeedback("category", category);
    }, [sendFeedback]);
    return (_jsxs("div", { className: cn("inline-flex items-center gap-0.5", className), children: [_jsx("button", { type: "button", "aria-label": "Thumbs up", onClick: handleThumbsUp, className: cn("flex h-6 w-6 items-center justify-center rounded", selection === "up"
                    ? "text-foreground"
                    : "text-muted-foreground/70 hover:text-muted-foreground hover:bg-accent/50"), children: _jsx(IconThumbUp, { size: 16, stroke: selection === "up" ? 2.5 : 1.5, fill: selection === "up" ? "currentColor" : "none" }) }), _jsxs(PopoverPrimitive.Root, { open: categoryOpen, onOpenChange: setCategoryOpen, children: [_jsx(PopoverPrimitive.Trigger, { asChild: true, children: _jsx("button", { type: "button", "aria-label": "Thumbs down", onClick: handleThumbsDown, className: cn("flex h-6 w-6 items-center justify-center rounded", selection === "down"
                                ? "text-foreground"
                                : "text-muted-foreground/70 hover:text-muted-foreground hover:bg-accent/50"), children: _jsx(IconThumbDown, { size: 16, stroke: selection === "down" ? 2.5 : 1.5, fill: selection === "down" ? "currentColor" : "none" }) }) }), _jsx(PopoverPrimitive.Portal, { children: _jsx(PopoverPrimitive.Content, { side: "bottom", align: "start", sideOffset: 4, collisionPadding: 8, className: "z-[300] overflow-hidden rounded-lg border border-border bg-popover p-1 shadow-lg outline-none", children: _jsx("div", { className: "flex flex-col gap-0.5", children: THUMBS_DOWN_CATEGORIES.map((category) => (_jsx("button", { type: "button", onClick: () => handleCategory(category), className: cn("rounded-md px-3 py-1.5 text-left text-xs", submittedCategory === category
                                        ? "bg-accent text-foreground font-medium"
                                        : "text-muted-foreground hover:bg-accent/50 hover:text-foreground"), children: category }, category))) }) }) })] })] }));
}
//# sourceMappingURL=ThumbsFeedback.js.map