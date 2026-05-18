/**
 * Availability rule evaluation.
 *
 * Given a Schedule (weekly rules + date overrides) and a local date in the
 * schedule's timezone, produce the set of available intervals on that day.
 *
 * Date overrides win over weekly rules: an empty-intervals override blocks
 * the day entirely; a non-empty override replaces the weekly rules for the day.
 */
import type { AvailabilityInterval, DateOverride, WeeklyAvailability } from "../shared/index.js";
export interface ScheduleInput {
    timezone: string;
    weeklyAvailability: WeeklyAvailability[];
    dateOverrides: DateOverride[];
}
/**
 * Return the intervals available for a given local date.
 * Intervals are in the schedule's local HH:MM, not UTC.
 */
export declare function evaluateAvailabilityForDate(schedule: ScheduleInput, localDate: string, dayOfWeek: number): AvailabilityInterval[];
/**
 * Normalize an interval list: sort by start, merge overlapping/adjacent,
 * drop zero-length.
 */
export declare function normalizeIntervals(intervals: AvailabilityInterval[]): AvailabilityInterval[];
//# sourceMappingURL=rules.d.ts.map