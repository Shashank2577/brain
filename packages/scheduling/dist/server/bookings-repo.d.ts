import type { Booking, Attendee, BookingReference, BookingStatus, Location } from "../shared/index.js";
export declare function getBookingByUid(uid: string): Promise<Booking | null>;
export interface ListBookingsFilter {
    hostEmail?: string;
    eventTypeId?: string;
    status?: BookingStatus | "upcoming" | "past" | "unconfirmed" | "recurring";
    attendeeEmail?: string;
    /** Inclusive start (ISO) */
    from?: string;
    /** Exclusive end (ISO) */
    to?: string;
    limit?: number;
    /**
     * If true, admit any booking the current user owns, has been shared on, or
     * matches via org-visibility — in addition to the explicit `hostEmail`
     * filter (which still narrows further when set).
     */
    useAccessFilter?: boolean;
}
export declare function listBookings(filter: ListBookingsFilter): Promise<Booking[]>;
export declare function countBookingsByHostInRange(hostEmail: string, fromIso: string, toIso: string): Promise<number>;
export interface InsertBookingInput {
    eventTypeId: string;
    hostEmail: string;
    title: string;
    description?: string;
    startTime: string;
    endTime: string;
    timezone: string;
    status?: BookingStatus;
    location?: Location;
    attendees: Attendee[];
    customResponses?: Record<string, any>;
    iCalUid?: string;
    iCalSequence?: number;
    references?: BookingReference[];
    fromReschedule?: string;
    ownerEmail: string;
    orgId?: string;
}
export declare function insertBooking(input: InsertBookingInput): Promise<Booking>;
export declare function updateBookingStatus(uid: string, status: BookingStatus, extra?: {
    cancellationReason?: string;
    reschedulingReason?: string;
}): Promise<void>;
export declare function addBookingReference(bookingId: string, ref: BookingReference): Promise<void>;
export declare function markAttendeeNoShow(bookingId: string, email: string): Promise<void>;
//# sourceMappingURL=bookings-repo.d.ts.map