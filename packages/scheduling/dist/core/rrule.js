/**
 * Recurring event expansion.
 *
 * Given an RRULE string and a time range, return the list of occurrence
 * start times. Uses `rrule` npm package under the hood.
 */
import { rrulestr } from "rrule";
export function expandRecurring(rruleString, dtstart, rangeStart, rangeEnd, maxOccurrences = 10) {
    // rrulestr parses RRULE:... with or without the DTSTART prefix.
    const rule = rrulestr(rruleString, { dtstart });
    const all = rule.between(rangeStart, rangeEnd, true);
    return all.slice(0, maxOccurrences);
}
//# sourceMappingURL=rrule.js.map