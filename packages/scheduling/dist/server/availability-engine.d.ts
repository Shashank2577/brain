import type { EventType, BusyInterval, Slot } from "../shared/index.js";
export interface GetSlotsInput {
    eventType: EventType;
    /** The user we're finding availability for — their schedule + calendars. */
    forUserEmail: string;
    rangeStart: Date;
    rangeEnd: Date;
    viewerTimezone?: string;
    now?: Date;
}
export declare function getAvailableSlots(input: GetSlotsInput): Promise<Slot[]>;
/**
 * Merge busy intervals from: (a) existing bookings for the user, (b) selected
 * external calendars (via providers), (c) the calendar cache.
 */
export declare function aggregateBusy(input: {
    userEmail: string;
    rangeStart: Date;
    rangeEnd: Date;
}): Promise<BusyInterval[]>;
//# sourceMappingURL=availability-engine.d.ts.map