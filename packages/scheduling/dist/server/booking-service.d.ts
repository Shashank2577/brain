/**
 * Booking lifecycle — create, reschedule, cancel — wired to providers and
 * workflow hooks.
 *
 * The booking flow:
 *   1. Load event type and resolve host (1:1, round-robin).
 *   2. Validate requested slot against availability engine.
 *   3. Insert the booking row + attendees.
 *   4. For each video/calendar provider, create external events and attach
 *      references to the booking.
 *   5. Emit lifecycle event → workflows materialize scheduled reminders.
 */
import type { Booking, Attendee, Location, EventType } from "../shared/index.js";
export interface CreateBookingInput {
    eventType: EventType;
    hostEmail: string;
    startTime: string;
    endTime: string;
    timezone: string;
    title?: string;
    description?: string;
    location?: Location;
    attendee: Attendee;
    guests?: Attendee[];
    customResponses?: Record<string, any>;
    iCalUid?: string;
    iCalSequence?: number;
    orgId?: string;
    /** If set, we're rescheduling from this booking uid */
    fromReschedule?: string;
}
export declare function createBooking(input: CreateBookingInput): Promise<Booking>;
export declare function rescheduleBooking(input: {
    uid: string;
    newStartTime: string;
    newEndTime: string;
    reason?: string;
    rescheduledBy?: "attendee" | "host";
}): Promise<Booking>;
export declare function cancelBooking(input: {
    uid: string;
    reason?: string;
    cancelledBy?: "attendee" | "host";
}): Promise<Booking>;
export declare function markNoShow(uid: string, attendeeEmail: string): Promise<void>;
//# sourceMappingURL=booking-service.d.ts.map