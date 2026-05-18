/**
 * Return the intervals available for a given local date.
 * Intervals are in the schedule's local HH:MM, not UTC.
 */
export function evaluateAvailabilityForDate(schedule, localDate, dayOfWeek) {
    const override = schedule.dateOverrides.find((o) => o.date === localDate);
    if (override)
        return override.intervals;
    const weekly = schedule.weeklyAvailability.find((w) => w.day === dayOfWeek);
    return weekly?.intervals ?? [];
}
/**
 * Normalize an interval list: sort by start, merge overlapping/adjacent,
 * drop zero-length.
 */
export function normalizeIntervals(intervals) {
    const sorted = intervals
        .filter((i) => toMinutes(i.startTime) < toMinutes(i.endTime))
        .slice()
        .sort((a, b) => toMinutes(a.startTime) - toMinutes(b.startTime));
    const out = [];
    for (const iv of sorted) {
        const last = out[out.length - 1];
        if (last && toMinutes(iv.startTime) <= toMinutes(last.endTime)) {
            last.endTime =
                toMinutes(iv.endTime) > toMinutes(last.endTime)
                    ? iv.endTime
                    : last.endTime;
        }
        else {
            out.push({ ...iv });
        }
    }
    return out;
}
function toMinutes(hhmm) {
    const [h, m] = hhmm.split(":").map(Number);
    return (h ?? 0) * 60 + (m ?? 0);
}
//# sourceMappingURL=rules.js.map