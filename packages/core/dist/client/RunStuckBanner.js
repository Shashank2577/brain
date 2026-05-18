import { jsx as _jsx, jsxs as _jsxs } from "react/jsx-runtime";
import { useEffect, useRef, useState } from "react";
import { IconAlertTriangle, IconLoader2 } from "@tabler/icons-react";
import { useRunStuckDetection, useAbortRun, } from "./use-run-stuck-detection.js";
import { trackEvent } from "./analytics.js";
import { cn } from "./utils.js";
export function RunStuckBanner({ threadId, apiUrl, stuckThresholdMs, onRetry, onStuckStateChange, className, }) {
    const state = useRunStuckDetection({ threadId, stuckThresholdMs, apiUrl });
    const abortRun = useAbortRun(apiUrl);
    const [busy, setBusy] = useState("none");
    const lastReportedRef = useRef({ isStuck: false, runId: null });
    useEffect(() => {
        const last = lastReportedRef.current;
        if (last.isStuck === state.isStuck && last.runId === state.runId)
            return;
        lastReportedRef.current = { isStuck: state.isStuck, runId: state.runId };
        onStuckStateChange?.(state);
        if (state.isStuck && state.runId) {
            trackEvent("agent_chat_stuck_detected", {
                runId: state.runId,
                threadId: threadId ?? null,
                stuckSinceMs: state.stuckSinceMs ?? null,
                stuckSinceSec: state.stuckSinceMs != null
                    ? Math.floor(state.stuckSinceMs / 1000)
                    : null,
                runStatus: state.status,
            });
        }
    }, [state, onStuckStateChange, threadId]);
    // Reset the busy spinner once the underlying run has flipped away from
    // running — no need to keep showing a stale "Retrying…" indicator.
    useEffect(() => {
        if (state.status !== "running") {
            setBusy("none");
        }
    }, [state.status]);
    if (!state.isStuck || !state.runId)
        return null;
    const handleCancel = async () => {
        if (!state.runId || busy !== "none")
            return;
        setBusy("cancel");
        trackEvent("agent_chat_stuck_cancel", {
            runId: state.runId,
            threadId: threadId ?? null,
            stuckSinceMs: state.stuckSinceMs ?? null,
        });
        await abortRun(state.runId, "user_stuck_cancel");
    };
    const handleRetry = async () => {
        if (!state.runId || busy !== "none")
            return;
        setBusy("retry");
        trackEvent("agent_chat_stuck_retry", {
            runId: state.runId,
            threadId: threadId ?? null,
            stuckSinceMs: state.stuckSinceMs ?? null,
        });
        const aborted = await abortRun(state.runId, "user_stuck_retry");
        if (aborted)
            onRetry?.(aborted);
    };
    const stuckSeconds = state.stuckSinceMs != null ? Math.floor(state.stuckSinceMs / 1000) : null;
    return (_jsxs("div", { role: "status", "aria-live": "polite", className: cn("mx-3 mt-2 flex items-start gap-2.5 rounded-md border border-amber-500/40 bg-amber-500/10 px-3 py-2.5 text-xs text-foreground", className), children: [_jsx(IconAlertTriangle, { size: 16, className: "mt-0.5 shrink-0 text-amber-500", "aria-hidden": "true" }), _jsxs("div", { className: "flex min-w-0 flex-1 flex-col gap-1.5", children: [_jsxs("div", { className: "leading-snug", children: [_jsx("span", { className: "font-medium", children: "This chat looks stuck." }), " ", _jsxs("span", { className: "text-muted-foreground", children: ["No progress", stuckSeconds != null ? ` for ${stuckSeconds}s` : "", ". The agent may have hit a server timeout or lost its connection."] })] }), _jsxs("div", { className: "flex flex-wrap items-center gap-2", children: [_jsxs("button", { type: "button", onClick: handleRetry, disabled: busy !== "none", className: "inline-flex h-7 cursor-pointer items-center gap-1.5 rounded-md bg-foreground px-2.5 text-[11px] font-medium text-background transition-colors hover:bg-foreground/90 disabled:cursor-not-allowed disabled:opacity-60", children: [busy === "retry" ? (_jsx(IconLoader2, { size: 12, className: "animate-spin", "aria-hidden": "true" })) : null, "Retry"] }), _jsxs("button", { type: "button", onClick: handleCancel, disabled: busy !== "none", className: "inline-flex h-7 cursor-pointer items-center gap-1.5 rounded-md border border-border bg-background px-2.5 text-[11px] font-medium text-foreground transition-colors hover:bg-accent disabled:cursor-not-allowed disabled:opacity-60", children: [busy === "cancel" ? (_jsx(IconLoader2, { size: 12, className: "animate-spin", "aria-hidden": "true" })) : null, "Cancel"] })] })] })] }));
}
//# sourceMappingURL=RunStuckBanner.js.map