/**
 * Booking limits enforcement.
 *
 * Limits constrain how many bookings an event type can receive in a time
 * window (day / week / month / year). We pass in existing booking counts
 * per bucket and return a function that tells us whether a proposed start
 * time would exceed any limit.
 */
import type { BookingLimits } from "../shared/index.js";
export interface BookingCounts {
    perDay: Record<string, number>;
    perWeek: Record<string, number>;
    perMonth: Record<string, number>;
    perYear: Record<string, number>;
}
export declare function bucketKeysForSlot(slotStart: Date, timezone: string, weekStartsOn?: 0 | 1): {
    day: string;
    week: string;
    month: string;
    year: string;
};
export declare function exceedsLimits(slotStart: Date, timezone: string, limits: BookingLimits | undefined, counts: BookingCounts, weekStartsOn?: 0 | 1): boolean;
//# sourceMappingURL=limits.d.ts.map