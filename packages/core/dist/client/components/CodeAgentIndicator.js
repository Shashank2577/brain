import { jsx as _jsx, Fragment as _Fragment, jsxs as _jsxs } from "react/jsx-runtime";
/**
 * CodeAgentIndicator — shows when a code editing request is being
 * processed by the frame (local dev frame or Builder.io).
 *
 * Renders as a subtle status bar that appears at the top of the chat area.
 */
import { useEffect, useState } from "react";
export function CodeAgentIndicator({ isWorking, label, }) {
    const [visible, setVisible] = useState(false);
    useEffect(() => {
        if (isWorking) {
            setVisible(true);
        }
        else {
            // Brief delay before hiding so the user sees "done"
            const t = setTimeout(() => setVisible(false), 1500);
            return () => clearTimeout(t);
        }
    }, [isWorking]);
    if (!visible)
        return null;
    return (_jsx("div", { className: "flex items-center gap-2 px-3 py-1.5 border-b border-border text-[11px]", style: {
            background: isWorking
                ? "hsl(var(--accent) / 0.3)"
                : "hsl(var(--accent) / 0.15)",
        }, children: isWorking ? (_jsxs(_Fragment, { children: [_jsx("span", { className: "h-1.5 w-1.5 rounded-full bg-blue-400 animate-pulse" }), _jsx("span", { className: "text-muted-foreground", children: label || "Code agent is working on your request..." })] })) : (_jsxs(_Fragment, { children: [_jsx("span", { className: "h-1.5 w-1.5 rounded-full bg-green-400" }), _jsx("span", { className: "text-muted-foreground", children: "Code changes applied" })] })) }));
}
//# sourceMappingURL=CodeAgentIndicator.js.map