import { jsx as _jsx, jsxs as _jsxs } from "react/jsx-runtime";
/**
 * AvailabilityEditor — weekly schedule grid with per-day toggles and time
 * pickers. Matches the calendar template's visual baseline.
 *
 * This is the "schedule body" — for the full per-day intervals +
 * date-override grid, compose this with a `DateOverridesEditor`
 * (not included yet; scheduling's existing per-page implementation
 * remains canonical for v0.1).
 *
 * Shadcn primitives expected in the consumer: input, label, switch.
 */
import { Input } from "@/components/ui/input";
import { Switch } from "@/components/ui/switch";
const DAYS = [
    { key: "monday", label: "Monday", short: "Mon" },
    { key: "tuesday", label: "Tuesday", short: "Tue" },
    { key: "wednesday", label: "Wednesday", short: "Wed" },
    { key: "thursday", label: "Thursday", short: "Thu" },
    { key: "friday", label: "Friday", short: "Fri" },
    { key: "saturday", label: "Saturday", short: "Sat" },
    { key: "sunday", label: "Sunday", short: "Sun" },
];
export function AvailabilityEditor({ value, onChange, }) {
    const setDay = (day, patch) => {
        onChange({
            ...value,
            [day]: { ...value[day], ...patch },
        });
    };
    const setSlot = (day, field, next) => {
        const prevSlots = value[day].slots.length
            ? value[day].slots
            : [{ start: "09:00", end: "17:00" }];
        onChange({
            ...value,
            [day]: {
                ...value[day],
                slots: [{ ...prevSlots[0], [field]: next }],
            },
        });
    };
    return (_jsx("div", { className: "space-y-2.5", children: DAYS.map(({ key, label, short }) => {
            const day = value[key] ?? { enabled: false, slots: [] };
            const slot = day.slots[0] ?? { start: "09:00", end: "17:00" };
            return (_jsxs("div", { className: "flex flex-wrap items-center gap-3 rounded-lg border border-border px-3 py-3 sm:gap-4 sm:px-4", children: [_jsxs("div", { className: "flex w-28 items-center gap-3 sm:w-40", children: [_jsx(Switch, { checked: day.enabled, onCheckedChange: (checked) => setDay(key, { enabled: checked }), "aria-label": `Toggle ${label}` }), _jsxs("span", { className: "text-sm font-medium", children: [_jsx("span", { className: "hidden sm:inline", children: label }), _jsx("span", { className: "sm:hidden", children: short })] })] }), day.enabled ? (_jsxs("div", { className: "flex items-center gap-2", children: [_jsx(Input, { type: "time", value: slot.start, onChange: (e) => setSlot(key, "start", e.target.value), className: "w-28 sm:w-32" }), _jsx("span", { className: "text-muted-foreground", children: "to" }), _jsx(Input, { type: "time", value: slot.end, onChange: (e) => setSlot(key, "end", e.target.value), className: "w-28 sm:w-32" })] })) : (_jsx("span", { className: "text-sm text-muted-foreground", children: "Unavailable" }))] }, key));
        }) }));
}
/**
 * Summarize a `WeeklySchedule` in a short phrase, e.g. "Weekdays, 9 am - 5 pm".
 * Useful for list-row subtitles.
 */
export function summarizeAvailability(ws) {
    const weekdayKeys = [
        "monday",
        "tuesday",
        "wednesday",
        "thursday",
        "friday",
    ];
    const weekendKeys = ["saturday", "sunday"];
    const allDays = [...weekdayKeys, ...weekendKeys];
    const enabled = allDays.filter((d) => ws[d]?.enabled);
    if (enabled.length === 0)
        return "No availability set";
    const weekdaysOn = weekdayKeys.every((d) => ws[d]?.enabled);
    const weekendsOn = weekendKeys.every((d) => ws[d]?.enabled);
    const weekdaysOff = weekdayKeys.every((d) => !ws[d]?.enabled);
    const weekendsOff = weekendKeys.every((d) => !ws[d]?.enabled);
    let dayLabel;
    if (weekdaysOn && weekendsOn)
        dayLabel = "Every day";
    else if (weekdaysOn && weekendsOff)
        dayLabel = "Weekdays";
    else if (weekdaysOff && weekendsOn)
        dayLabel = "Weekends";
    else {
        const shortNames = {
            monday: "Mon",
            tuesday: "Tue",
            wednesday: "Wed",
            thursday: "Thu",
            friday: "Fri",
            saturday: "Sat",
            sunday: "Sun",
        };
        dayLabel = enabled.map((d) => shortNames[d]).join(", ");
    }
    const slot = ws[enabled[0]].slots[0];
    if (!slot)
        return dayLabel;
    return `${dayLabel}, ${formatTime12(slot.start)} - ${formatTime12(slot.end)}`;
}
function formatTime12(time) {
    const [h, m] = time.split(":").map(Number);
    const suffix = h >= 12 ? "pm" : "am";
    const hour = h % 12 || 12;
    return m
        ? `${hour}:${String(m).padStart(2, "0")} ${suffix}`
        : `${hour} ${suffix}`;
}
//# sourceMappingURL=AvailabilityEditor.js.map