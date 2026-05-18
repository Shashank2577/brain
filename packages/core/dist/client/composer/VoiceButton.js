import { jsx as _jsx, jsxs as _jsxs, Fragment as _Fragment } from "react/jsx-runtime";
import { IconMicrophone, IconPlayerStopFilled, IconLoader2, IconX, } from "@tabler/icons-react";
import { Tooltip, TooltipContent, TooltipTrigger, } from "../components/ui/tooltip.js";
export function VoiceButton({ voice, isMac, disabled }) {
    const { state, start, stop, supported } = voice;
    if (!supported)
        return null;
    const recording = state === "recording" || state === "starting";
    const transcribing = state === "transcribing";
    const label = recording
        ? "Stop recording"
        : transcribing
            ? "Transcribing…"
            : `Dictate (${isMac ? "⌘⇧M" : "Ctrl+Shift+M"})`;
    const onClick = () => {
        if (recording)
            stop();
        else if (!transcribing)
            void start();
    };
    return (_jsxs(Tooltip, { children: [_jsx(TooltipTrigger, { asChild: true, children: _jsx("button", { type: "button", onClick: onClick, disabled: disabled || transcribing, "aria-label": label, "aria-pressed": recording, className: `shrink-0 flex h-7 w-7 items-center justify-center rounded-md disabled:opacity-30 disabled:cursor-not-allowed ${recording
                        ? "text-[#00B5FF] bg-[#00B5FF]/10 hover:bg-[#00B5FF]/20"
                        : "text-muted-foreground hover:text-foreground hover:bg-accent/50"}`, children: transcribing ? (_jsx(IconLoader2, { className: "h-4 w-4 animate-spin" })) : recording ? (_jsx(IconPlayerStopFilled, { className: "h-3.5 w-3.5" })) : (_jsx(IconMicrophone, { className: "h-4 w-4" })) }) }), _jsx(TooltipContent, { children: label })] }));
}
export function VoiceRecordingOverlay({ voice }) {
    const { state, amplitude, durationMs, errorMessage, cancel } = voice;
    const { dismissError, start } = voice;
    if (state === "error" && errorMessage) {
        return (_jsxs("div", { role: "alert", className: "mx-2 mt-1 flex items-start gap-2 rounded-md border border-red-500/40 bg-red-500/10 px-2 py-1.5 text-[11px] text-red-500", children: [_jsx("span", { className: "flex-1 min-w-0", children: errorMessage }), _jsxs(Tooltip, { children: [_jsx(TooltipTrigger, { asChild: true, children: _jsx("button", { type: "button", onClick: () => {
                                    dismissError();
                                    void start();
                                }, className: "shrink-0 cursor-pointer rounded px-1.5 py-0.5 text-[11px] font-medium text-red-500 hover:bg-red-500/20", "aria-label": "Try again", children: "Try again" }) }), _jsx(TooltipContent, { children: "Try again" })] }), _jsxs(Tooltip, { children: [_jsx(TooltipTrigger, { asChild: true, children: _jsx("button", { type: "button", onClick: dismissError, className: "shrink-0 flex h-4 w-4 cursor-pointer items-center justify-center rounded text-red-500 hover:bg-red-500/20", "aria-label": "Dismiss", children: _jsx(IconX, { className: "h-3 w-3" }) }) }), _jsx(TooltipContent, { children: "Dismiss" })] })] }));
    }
    if (state !== "recording" && state !== "starting" && state !== "transcribing")
        return null;
    return (_jsxs("div", { className: "flex items-center gap-2 mx-2 mt-2 mb-1 h-[2rem] rounded-md border border-[#00B5FF]/40 bg-[#00B5FF]/10 px-2", "aria-live": "polite", children: [_jsxs(Tooltip, { children: [_jsx(TooltipTrigger, { asChild: true, children: _jsx("button", { type: "button", onClick: cancel, className: "shrink-0 flex h-5 w-5 items-center justify-center rounded text-muted-foreground hover:text-foreground hover:bg-accent/40", "aria-label": "Cancel recording", children: _jsx(IconX, { className: "h-3 w-3" }) }) }), _jsx(TooltipContent, { children: "Cancel (Esc)" })] }), _jsx("div", { className: "flex-1 flex items-center gap-[2px] min-w-0 h-4", children: state === "transcribing" ? (_jsx("span", { className: "text-[11px] text-muted-foreground", children: "Transcribing\u2026" })) : (_jsx(AmplitudeBars, { amplitude: amplitude })) }), _jsx("span", { className: "shrink-0 text-[11px] font-medium tabular-nums text-muted-foreground", children: state === "transcribing" ? (_jsx(IconLoader2, { className: "h-3 w-3 animate-spin" })) : (formatDuration(durationMs)) })] }));
}
const BAR_COUNT = 24;
function AmplitudeBars({ amplitude }) {
    // Render a symmetric meter — the middle bars peak first so the visual
    // matches what voice input looks like in Lovable / iOS dictation.
    const bars = [];
    for (let i = 0; i < BAR_COUNT; i++) {
        const centerDistance = Math.abs(i - (BAR_COUNT - 1) / 2) / ((BAR_COUNT - 1) / 2);
        const heightPct = Math.max(0.1, amplitude * (1 - centerDistance * 0.6)) * 100;
        bars.push(_jsx("span", { className: "flex-1 rounded-full bg-[#00B5FF]", style: { height: `${heightPct}%`, minHeight: 2 } }, i));
    }
    return _jsx(_Fragment, { children: bars });
}
function formatDuration(ms) {
    const total = Math.floor(ms / 1000);
    const m = Math.floor(total / 60);
    const s = total % 60;
    return `${m}:${s.toString().padStart(2, "0")}`;
}
//# sourceMappingURL=VoiceButton.js.map