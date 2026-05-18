import { jsx as _jsx } from "react/jsx-runtime";
// A compact list; consumers can replace with the full 600+ IANA zones from
// `Intl.supportedValuesOf("timeZone")` at the call site if they need all of them.
const COMMON_ZONES = [
    "UTC",
    "America/New_York",
    "America/Chicago",
    "America/Denver",
    "America/Los_Angeles",
    "America/Sao_Paulo",
    "Europe/London",
    "Europe/Paris",
    "Europe/Berlin",
    "Europe/Moscow",
    "Africa/Cairo",
    "Asia/Jerusalem",
    "Asia/Dubai",
    "Asia/Kolkata",
    "Asia/Singapore",
    "Asia/Tokyo",
    "Asia/Shanghai",
    "Australia/Sydney",
    "Pacific/Auckland",
];
export function TimezoneSelect(props) {
    const supported = typeof Intl !== "undefined" && Intl.supportedValuesOf
        ? Intl.supportedValuesOf("timeZone")
        : COMMON_ZONES;
    return (_jsx("select", { value: props.value, onChange: (e) => props.onChange(e.currentTarget.value), className: props.className ?? "", children: supported.map((tz) => (_jsx("option", { value: tz, children: tz }, tz))) }));
}
//# sourceMappingURL=TimezoneSelect.js.map