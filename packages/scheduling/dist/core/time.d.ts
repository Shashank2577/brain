/** Parse an ISO 8601 string to a UTC Date. */
export declare function parseISO(iso: string): Date;
/** Format a Date to an ISO 8601 UTC string ending in "Z". */
export declare function toISO(d: Date): string;
/** Add minutes to a Date (UTC-safe; DST-safe because we stay in UTC). */
export declare function addMinutes(d: Date, minutes: number): Date;
/** Minutes between two Dates (end - start). Can be negative. */
export declare function minutesBetween(start: Date, end: Date): number;
/**
 * Build a UTC Date from a local date + time of day + timezone.
 *
 * Example:
 *   zonedTimeToUtc("2026-04-04", "09:00", "America/Los_Angeles")
 *   → Date where UTC hour depends on whether PDT or PST is active.
 */
export declare function zonedTimeToUtc(localDate: string, localTime: string, timezone: string): Date;
/** Format a UTC Date into a "YYYY-MM-DD" string in the target timezone. */
export declare function formatLocalDate(d: Date, timezone: string): string;
/** Format a UTC Date into a "HH:MM" string in the target timezone. */
export declare function formatLocalTime(d: Date, timezone: string): string;
/** Day of week (0=Sun, 6=Sat) for a UTC Date in the target timezone. */
export declare function getDayOfWeek(d: Date, timezone: string): number;
/** True if two intervals overlap (end-exclusive). */
export declare function overlaps(a: {
    start: Date;
    end: Date;
}, b: {
    start: Date;
    end: Date;
}): boolean;
/** Clamp a date range to a window. Returns null if they don't intersect. */
export declare function clampRange(range: {
    start: Date;
    end: Date;
}, window: {
    start: Date;
    end: Date;
}): {
    start: Date;
    end: Date;
} | null;
/**
 * Iterate UTC Date objects from start (inclusive) to end (exclusive) by
 * stepping `stepMinutes`. Safe across DST because we never touch local time.
 */
export declare function steppedDates(start: Date, end: Date, stepMinutes: number): Generator<Date>;
/**
 * Enumerate "YYYY-MM-DD" local dates in `timezone` from `startUtc` to `endUtc`.
 * Useful for iterating per-day availability over a booking window.
 */
export declare function localDatesInRange(startUtc: Date, endUtc: Date, timezone: string): string[];
//# sourceMappingURL=time.d.ts.map