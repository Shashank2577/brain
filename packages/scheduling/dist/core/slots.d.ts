/**
 * Slot computation — the heart of the scheduling package.
 *
 * Input: an event type's config (duration, buffers, limits, period),
 *        a schedule (weekly hours + date overrides),
 *        a set of busy intervals (from external calendars + existing bookings),
 *        a time range to compute over.
 * Output: an array of Slot objects (UTC start/end) that are available
 *         and pass every constraint.
 *
 * Correctness priorities, in order:
 *   1. Never return a slot in the past (respect `now + minimumBookingNotice`)
 *   2. Never return a slot that overlaps a busy interval (with buffers)
 *   3. Never return a slot outside the schedule's available windows
 *   4. Never exceed booking limits (per-day/week/month/year)
 *   5. Respect the event type's period (rolling / range / unlimited)
 *   6. Correctness across DST transitions
 */
import type { Slot, BusyInterval, BookingLimits, PeriodType } from "../shared/index.js";
import { type ScheduleInput } from "./rules.js";
import { type BookingCounts } from "./limits.js";
export interface ComputeSlotsInput {
    /** Event type duration, minutes */
    duration: number;
    /** Minutes before event start where the event type becomes unbookable; 0 = up to now */
    minimumBookingNotice: number;
    /** Buffers in minutes applied to any existing busy interval and the candidate slot */
    beforeEventBuffer: number;
    afterEventBuffer: number;
    /** Null = increment by duration */
    slotInterval: number | null;
    periodType: PeriodType;
    periodDays?: number;
    periodStartDate?: string;
    periodEndDate?: string;
    bookingLimits?: BookingLimits;
    /** Schedule — intervals in schedule's timezone */
    schedule: ScheduleInput;
    /** Busy intervals in UTC (already aggregated from all sources) */
    busy: BusyInterval[];
    /** Existing bookings grouped by bucket key — used for limit enforcement */
    bookingCounts?: BookingCounts;
    /** Week start for limit-bucketing */
    weekStartsOn?: 0 | 1;
    /** Range to compute over, UTC */
    rangeStart: Date;
    rangeEnd: Date;
    /** Current time (UTC). Defaults to now. */
    now?: Date;
    /** Seats per slot — if > 1, slot stays available until seats exhausted */
    seatsPerTimeSlot?: number;
    /** Seat count already reserved, keyed by ISO start */
    seatsTaken?: Map<string, number>;
    /** Timezone in which the Booker displays the slots (for limit buckets) */
    viewerTimezone?: string;
}
export declare function computeAvailableSlots(input: ComputeSlotsInput): Slot[];
//# sourceMappingURL=slots.d.ts.map