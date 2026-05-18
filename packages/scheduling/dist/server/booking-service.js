import { insertBooking, getBookingByUid, updateBookingStatus, markAttendeeNoShow, addBookingReference, } from "./bookings-repo.js";
import { getEventTypeById } from "./event-types-repo.js";
import { getCalendarProvider, getVideoProvider } from "./providers/registry.js";
import { onBookingCreated, onBookingCancelled, onBookingRescheduled, } from "./hooks.js";
import { getSchedulingContext } from "./context.js";
import { eq } from "drizzle-orm";
export async function createBooking(input) {
    const eventType = input.eventType;
    const title = input.title ??
        eventType.eventName?.replace("{attendeeName}", input.attendee.name) ??
        `${eventType.title} with ${input.attendee.name}`;
    const attendees = [input.attendee, ...(input.guests ?? [])];
    const booking = await insertBooking({
        eventTypeId: eventType.id,
        hostEmail: input.hostEmail,
        title,
        description: input.description,
        startTime: input.startTime,
        endTime: input.endTime,
        timezone: input.timezone,
        status: eventType.requiresConfirmation ? "pending" : "confirmed",
        location: input.location ?? eventType.locations[0],
        attendees,
        customResponses: input.customResponses,
        iCalUid: input.iCalUid,
        iCalSequence: input.iCalSequence,
        fromReschedule: input.fromReschedule,
        ownerEmail: input.hostEmail,
        orgId: input.orgId,
    });
    // Create video meeting if location is a video kind
    if (booking.location && isVideoKind(booking.location.kind)) {
        const provider = getVideoProvider(videoProviderKindFor(booking.location.kind));
        if (provider) {
            try {
                const meeting = await provider.createMeeting({
                    credentialId: booking.location.credentialId,
                    booking,
                });
                if (meeting.meetingUrl) {
                    await addBookingReference(booking.id, {
                        type: provider.kind,
                        externalId: meeting.meetingId,
                        meetingUrl: meeting.meetingUrl,
                        meetingPassword: meeting.meetingPassword,
                        credentialId: booking.location.credentialId,
                    });
                }
            }
            catch (err) {
                // Continue without the video link; the host can fix on the booking detail page
            }
        }
    }
    // Write to destination calendar
    await writeToDestinationCalendars(booking);
    // Fire workflow hooks
    await onBookingCreated(booking);
    const final = await getBookingByUid(booking.uid);
    if (!final)
        throw new Error("Booking disappeared after creation");
    return final;
}
export async function rescheduleBooking(input) {
    const original = await getBookingByUid(input.uid);
    if (!original)
        throw new Error(`Booking ${input.uid} not found`);
    const eventType = await getEventTypeById(original.eventTypeId);
    if (!eventType)
        throw new Error("Event type missing");
    // Mark old as rescheduled
    await updateBookingStatus(input.uid, "rescheduled", {
        reschedulingReason: input.reason,
    });
    // Create new booking linked back to the original
    const attendee = original.attendees[0];
    const guests = original.attendees.slice(1);
    const newBooking = await createBooking({
        eventType,
        hostEmail: original.hostEmail,
        startTime: input.newStartTime,
        endTime: input.newEndTime,
        timezone: original.timezone,
        title: original.title,
        description: original.description,
        location: original.location,
        attendee,
        guests,
        customResponses: original.customResponses,
        iCalUid: original.iCalUid,
        iCalSequence: original.iCalSequence + 1,
        fromReschedule: input.uid,
    });
    // Update external calendar events (PATCH, not delete+create)
    for (const ref of original.references) {
        const provider = getCalendarProvider(ref.type);
        if (provider?.updateEvent && ref.credentialId) {
            try {
                await provider.updateEvent({
                    credentialId: ref.credentialId,
                    externalId: ref.externalId,
                    booking: newBooking,
                });
            }
            catch {
                // Event may have been deleted manually; fall through
            }
        }
    }
    await onBookingRescheduled(original, newBooking);
    return newBooking;
}
export async function cancelBooking(input) {
    const booking = await getBookingByUid(input.uid);
    if (!booking)
        throw new Error(`Booking ${input.uid} not found`);
    await updateBookingStatus(input.uid, "cancelled", {
        cancellationReason: input.reason,
    });
    for (const ref of booking.references) {
        const calProvider = getCalendarProvider(ref.type);
        if (calProvider?.deleteEvent && ref.credentialId) {
            try {
                await calProvider.deleteEvent({
                    credentialId: ref.credentialId,
                    externalId: ref.externalId,
                });
            }
            catch { }
        }
        const videoProvider = getVideoProvider(ref.type);
        if (videoProvider?.deleteMeeting) {
            try {
                await videoProvider.deleteMeeting({
                    credentialId: ref.credentialId,
                    meetingId: ref.externalId,
                });
            }
            catch { }
        }
    }
    await onBookingCancelled(booking);
    return (await getBookingByUid(input.uid));
}
export async function markNoShow(uid, attendeeEmail) {
    const booking = await getBookingByUid(uid);
    if (!booking)
        throw new Error(`Booking ${uid} not found`);
    await markAttendeeNoShow(booking.id, attendeeEmail);
}
function isVideoKind(kind) {
    return ["builtin-video", "zoom", "google-meet", "teams"].includes(kind);
}
function videoProviderKindFor(kind) {
    if (kind === "builtin-video")
        return "builtin_video";
    if (kind === "zoom")
        return "zoom_video";
    if (kind === "google-meet")
        return "google_meet";
    if (kind === "teams")
        return "teams_video";
    return kind;
}
async function writeToDestinationCalendars(booking) {
    const { getDb, schema } = getSchedulingContext();
    const db = getDb();
    const destinations = await db
        .select()
        .from(schema.destinationCalendars)
        .where(eq(schema.destinationCalendars.userEmail, booking.hostEmail));
    for (const dest of destinations) {
        if (dest.eventTypeId && dest.eventTypeId !== booking.eventTypeId)
            continue;
        const provider = getCalendarProvider(dest.integration);
        if (!provider)
            continue;
        try {
            const result = await provider.createEvent({
                credentialId: dest.credentialId,
                calendarExternalId: dest.externalId,
                booking,
                includeConference: booking.location?.kind === "google-meet" &&
                    dest.integration === "google_calendar",
            });
            await addBookingReference(booking.id, {
                type: dest.integration,
                externalId: result.externalId,
                meetingUrl: result.meetingUrl,
                credentialId: dest.credentialId,
            });
        }
        catch {
            // Calendar write failed; booking still exists locally
        }
    }
}
//# sourceMappingURL=booking-service.js.map