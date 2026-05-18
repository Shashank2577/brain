import { jsx as _jsx, jsxs as _jsxs } from "react/jsx-runtime";
/**
 * ConferencingSelector — choose how a booking's video meeting is set up.
 *
 * Renders a grid of options (no conferencing, Google Meet, Zoom, custom
 * link). Each option is fully styled with the consumer's shadcn
 * primitives. The Zoom option does NOT accept a pasted personal meeting
 * URL — the user connects their Zoom account via OAuth instead, and the
 * app auto-creates a meeting per booking. See `connect-video` action.
 *
 * Shadcn primitives expected in the consumer: button, input, label,
 * badge. Icons from `@tabler/icons-react`.
 *
 * Props:
 *   - `value`        — current conferencing config { type, url? }
 *   - `onChange`     — called with the next config (call instantly — the
 *                      caller owns persistence, typically optimistic)
 *   - `zoomStatus`   — 'connected' | 'disconnected' | 'not-configured'
 *                      drives the Connect Zoom button / installed chip
 *   - `onConnectZoom` — optional callback that starts the OAuth flow; if
 *                      omitted, the button is hidden (useful for preview)
 *   - `googleConnected` — whether Google Meet is available (depends on
 *                         Google Calendar credential)
 *   - `onConnectGoogle` — optional, same shape as onConnectZoom
 */
import { useId } from "react";
import { IconBrandGoogle, IconBrandZoom, IconCheck, IconLink, IconVideo, IconVideoOff, } from "@tabler/icons-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, } from "@/components/ui/select";
const OPTIONS = [
    {
        type: "none",
        label: "No conferencing",
        description: "In-person or other",
        Icon: IconVideoOff,
    },
    {
        type: "google_meet",
        label: "Google Meet",
        description: "Auto-generate a Meet link",
        Icon: IconBrandGoogle,
    },
    {
        type: "zoom",
        label: "Zoom",
        description: "Auto-create a meeting per booking",
        Icon: IconBrandZoom,
    },
    {
        type: "custom",
        label: "Custom link",
        description: "Paste any meeting URL",
        Icon: IconLink,
    },
];
export function ConferencingSelector(props) {
    const id = useId();
    const { value, onChange, zoomStatus = "disconnected", googleStatus = "disconnected", onConnectZoom, onConnectGoogle, hideLabel, } = props;
    const statusFor = (type) => {
        if (type === "zoom")
            return zoomStatus;
        if (type === "google_meet")
            return googleStatus;
        return "connected";
    };
    const selectedOption = OPTIONS.find((opt) => opt.type === value.type) ?? OPTIONS[0];
    const selectedStatus = statusFor(selectedOption.type);
    const SelectedIcon = selectedOption.Icon;
    return (_jsxs("div", { className: "space-y-3", children: [!hideLabel && (_jsxs(Label, { className: "flex items-center gap-1.5", children: [_jsx(IconVideo, { className: "h-4 w-4" }), "Conferencing"] })), _jsxs(Select, { value: value.type, onValueChange: (type) => onChange({
                    type: type,
                    url: type === "custom" ? value.url : undefined,
                }), children: [_jsx(SelectTrigger, { className: "h-auto min-h-11 py-2", children: _jsxs("div", { className: "flex min-w-0 items-center gap-2 text-left", children: [_jsx(SelectedIcon, { className: "h-4 w-4 shrink-0" }), _jsxs("div", { className: "min-w-0", children: [_jsxs("div", { className: "flex items-center gap-2", children: [_jsx("span", { className: "truncate font-medium", children: selectedOption.label }), selectedStatus === "connected" &&
                                                    selectedOption.type !== "none" &&
                                                    selectedOption.type !== "custom" && (_jsxs(Badge, { variant: "secondary", className: "h-5 gap-1 text-[10px] font-normal", children: [_jsx(IconCheck, { className: "h-3 w-3" }), "Connected"] }))] }), _jsx("p", { className: "truncate text-xs text-muted-foreground", children: selectedStatus === "not-configured"
                                                ? `${selectedOption.label} is not configured on this server.`
                                                : selectedOption.description })] })] }) }), _jsx(SelectContent, { children: OPTIONS.map((opt) => {
                            const status = statusFor(opt.type);
                            const isUnavailable = status === "not-configured";
                            return (_jsx(SelectItem, { value: opt.type, disabled: isUnavailable, className: "py-2", children: _jsxs("div", { className: "flex min-w-0 items-start gap-2", children: [_jsx(opt.Icon, { className: "mt-0.5 h-4 w-4 shrink-0" }), _jsxs("div", { className: "min-w-0", children: [_jsxs("div", { className: "flex items-center gap-2", children: [_jsx("span", { className: "font-medium", children: opt.label }), status === "connected" &&
                                                            opt.type !== "none" &&
                                                            opt.type !== "custom" && (_jsx("span", { className: "text-[10px] text-muted-foreground", children: "Connected" }))] }), _jsx("p", { className: "text-xs text-muted-foreground", children: isUnavailable
                                                        ? `${opt.label} needs server OAuth credentials before it can be used.`
                                                        : opt.description })] })] }) }, opt.type));
                        }) })] }), value.type === "zoom" && zoomStatus !== "connected" && onConnectZoom && (_jsxs("div", { className: "rounded-md border border-border/60 bg-muted/30 p-3", children: [_jsxs("div", { className: "flex flex-wrap items-center justify-between gap-2", children: [_jsxs("div", { className: "min-w-0 flex-1", children: [_jsx("p", { className: "text-sm font-medium", children: "Connect your Zoom account" }), _jsx("p", { className: "text-xs text-muted-foreground", children: "We'll create a real Zoom meeting for every booking \u2014 no need to paste a personal link." })] }), _jsxs(Button, { type: "button", size: "sm", onClick: onConnectZoom, disabled: zoomStatus === "not-configured", children: [_jsx(IconBrandZoom, { className: "mr-1.5 h-4 w-4" }), "Connect Zoom"] })] }), zoomStatus === "not-configured" && (_jsxs("p", { className: "mt-2 text-[11px] text-muted-foreground", children: ["Ask your admin to set ", _jsx("code", { children: "ZOOM_CLIENT_ID" }), " and", " ", _jsx("code", { children: "ZOOM_CLIENT_SECRET" }), " to enable Zoom OAuth."] }))] })), value.type === "google_meet" &&
                googleStatus !== "connected" &&
                onConnectGoogle && (_jsx("div", { className: "rounded-md border border-border/60 bg-muted/30 p-3", children: _jsxs("div", { className: "flex flex-wrap items-center justify-between gap-2", children: [_jsxs("div", { className: "min-w-0 flex-1", children: [_jsx("p", { className: "text-sm font-medium", children: "Connect Google Calendar" }), _jsx("p", { className: "text-xs text-muted-foreground", children: "Meet links are auto-generated when the calendar event is created." })] }), _jsxs(Button, { type: "button", size: "sm", variant: "outline", onClick: onConnectGoogle, disabled: googleStatus === "not-configured", children: [_jsx(IconBrandGoogle, { className: "mr-1.5 h-4 w-4" }), "Connect Google"] })] }) })), value.type === "custom" && (_jsxs("div", { className: "space-y-1.5", children: [_jsx(Label, { htmlFor: `${id}-url`, className: "text-xs", children: "Meeting URL" }), _jsx(Input, { id: `${id}-url`, type: "url", value: value.url ?? "", onChange: (e) => onChange({ type: "custom", url: e.currentTarget.value }), placeholder: "https://meet.example.com/room", className: "h-8 text-sm" })] }))] }));
}
//# sourceMappingURL=ConferencingSelector.js.map