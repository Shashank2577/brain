import { addMinutes, getDayOfWeek, zonedTimeToUtc, localDatesInRange, } from "./time.js";
import { evaluateAvailabilityForDate } from "./rules.js";
import { hasConflict, mergeBusy } from "./conflicts.js";
import { exceedsLimits, } from "./limits.js";
import { expandSlotForConflictCheck } from "./buffers.js";
export function computeAvailableSlots(input) {
    const now = input.now ?? new Date();
    const minBookableTime = addMinutes(now, input.minimumBookingNotice);
    const rangeStart = capToPeriodStart(input, input.rangeStart, now);
    const rangeEnd = capToPeriodEnd(input, input.rangeEnd, now);
    if (rangeStart >= rangeEnd)
        return [];
    const mergedBusy = mergeBusy(input.busy);
    const interval = input.slotInterval ?? input.duration;
    const viewerTz = input.viewerTimezone ?? input.schedule.timezone;
    const slots = [];
    // Enumerate each local day in the schedule's timezone that the range touches.
    const dates = localDatesInRange(rangeStart, rangeEnd, input.schedule.timezone);
    for (const localDate of dates) {
        const dow = dayOfWeekForLocalDate(localDate, input.schedule.timezone);
        const dayIntervals = evaluateAvailabilityForDate(input.schedule, localDate, dow);
        if (dayIntervals.length === 0)
            continue;
        for (const iv of dayIntervals) {
            const dayStartUtc = zonedTimeToUtc(localDate, iv.startTime, input.schedule.timezone);
            const dayEndUtc = zonedTimeToUtc(localDate, iv.endTime, input.schedule.timezone);
            let slotStart = dayStartUtc;
            while (addMinutes(slotStart, input.duration) <= dayEndUtc) {
                const slotEnd = addMinutes(slotStart, input.duration);
                // Cap to range
                if (slotStart < rangeStart || slotEnd > rangeEnd) {
                    slotStart = addMinutes(slotStart, interval);
                    continue;
                }
                // Respect minimum notice
                if (slotStart < minBookableTime) {
                    slotStart = addMinutes(slotStart, interval);
                    continue;
                }
                // Conflict check (expanded with buffers)
                const expanded = expandSlotForConflictCheck(slotStart, slotEnd, input.beforeEventBuffer, input.afterEventBuffer);
                if (hasConflict(expanded, mergedBusy)) {
                    slotStart = addMinutes(slotStart, interval);
                    continue;
                }
                // Booking limits (in viewer's timezone for perDay buckets)
                if (input.bookingCounts &&
                    exceedsLimits(slotStart, viewerTz, input.bookingLimits, input.bookingCounts, input.weekStartsOn ?? 0)) {
                    slotStart = addMinutes(slotStart, interval);
                    continue;
                }
                // Seats
                const seatsTaken = input.seatsTaken?.get(slotStart.toISOString()) ?? 0;
                const seatsRemaining = input.seatsPerTimeSlot != null
                    ? Math.max(0, input.seatsPerTimeSlot - seatsTaken)
                    : undefined;
                if (input.seatsPerTimeSlot != null && seatsRemaining === 0) {
                    slotStart = addMinutes(slotStart, interval);
                    continue;
                }
                slots.push({
                    start: slotStart.toISOString(),
                    end: slotEnd.toISOString(),
                    available: true,
                    seatsRemaining,
                });
                slotStart = addMinutes(slotStart, interval);
            }
        }
    }
    return slots;
}
function capToPeriodStart(input, rangeStart, now) {
    if (input.periodType === "range" && input.periodStartDate) {
        const start = new Date(input.periodStartDate);
        return rangeStart > start ? rangeStart : start;
    }
    // Rolling + unlimited don't restrict start
    return rangeStart > now ? rangeStart : now;
}
function capToPeriodEnd(input, rangeEnd, now) {
    if (input.periodType === "range" && input.periodEndDate) {
        const end = new Date(input.periodEndDate);
        return rangeEnd < end ? rangeEnd : end;
    }
    if (input.periodType === "rolling" && input.periodDays != null) {
        const rollingEnd = addMinutes(now, input.periodDays * 24 * 60);
        return rangeEnd < rollingEnd ? rangeEnd : rollingEnd;
    }
    return rangeEnd;
}
function dayOfWeekForLocalDate(localDate, timezone) {
    // Construct a UTC date that corresponds to noon on that local date in the
    // target timezone, then ask what day-of-week it is in that timezone.
    const noon = zonedTimeToUtc(localDate, "12:00", timezone);
    return getDayOfWeek(noon, timezone);
}
//# sourceMappingURL=slots.js.map