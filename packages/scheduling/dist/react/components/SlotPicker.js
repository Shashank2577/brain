import { jsx as _jsx, jsxs as _jsxs } from "react/jsx-runtime";
import { TZDate } from "@date-fns/tz";
import { format } from "date-fns";
export function SlotPicker(props) {
    const grouped = new Map();
    for (const s of props.slots) {
        const localDay = format(new TZDate(new Date(s.start).getTime(), props.timezone), "yyyy-MM-dd");
        if (!grouped.has(localDay))
            grouped.set(localDay, []);
        grouped.get(localDay).push(s);
    }
    const fmt = props.timeFormat === "24h" ? "HH:mm" : "h:mma";
    return (_jsx("div", { className: props.className ?? "", children: Array.from(grouped.entries()).map(([date, daySlots]) => (_jsxs("section", { className: props.dayClassName ?? "", children: [_jsx("header", { children: format(new TZDate(`${date}T12:00:00Z`, props.timezone), "EEEE, MMM d") }), _jsx("ul", { children: daySlots.map((s) => (_jsx("li", { children: _jsxs("button", { type: "button", className: props.slotClassName ?? "", "aria-pressed": props.selectedStart === s.start, disabled: !s.available, onClick: () => props.onSelect(s), children: [format(new TZDate(new Date(s.start).getTime(), props.timezone), fmt), s.seatsRemaining != null && s.seatsRemaining > 0 && (_jsxs("span", { children: [" \u00B7 ", s.seatsRemaining, " left"] }))] }) }, s.start))) })] }, date))) }));
}
//# sourceMappingURL=SlotPicker.js.map