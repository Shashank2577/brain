import { TZDate } from "@date-fns/tz";
import { startOfWeek, startOfMonth, startOfYear, format } from "date-fns";
export function bucketKeysForSlot(slotStart, timezone, weekStartsOn = 0) {
    const local = new TZDate(slotStart.getTime(), timezone);
    const day = format(local, "yyyy-MM-dd");
    const week = format(startOfWeek(local, { weekStartsOn }), "yyyy-MM-dd");
    const month = format(startOfMonth(local), "yyyy-MM");
    const year = format(startOfYear(local), "yyyy");
    return { day, week, month, year };
}
export function exceedsLimits(slotStart, timezone, limits, counts, weekStartsOn = 0) {
    if (!limits)
        return false;
    const keys = bucketKeysForSlot(slotStart, timezone, weekStartsOn);
    if (limits.perDay != null && (counts.perDay[keys.day] ?? 0) >= limits.perDay)
        return true;
    if (limits.perWeek != null &&
        (counts.perWeek[keys.week] ?? 0) >= limits.perWeek)
        return true;
    if (limits.perMonth != null &&
        (counts.perMonth[keys.month] ?? 0) >= limits.perMonth)
        return true;
    if (limits.perYear != null &&
        (counts.perYear[keys.year] ?? 0) >= limits.perYear)
        return true;
    return false;
}
//# sourceMappingURL=limits.js.map