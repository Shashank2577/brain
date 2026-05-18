/**
 * Data access for bookings + their attendees, references, and notes.
 */
import { eq, and, gte, lt, or, desc, asc, isNotNull } from "drizzle-orm";
import { nanoid } from "nanoid";
import { accessFilter } from "@agent-native/core/sharing";
import { getSchedulingContext } from "./context.js";
function rowToBooking(row, attendees = [], references = []) {
    return {
        id: row.id,
        uid: row.uid,
        eventTypeId: row.eventTypeId,
        hostEmail: row.hostEmail,
        title: row.title,
        description: row.description ?? undefined,
        startTime: row.startTime,
        endTime: row.endTime,
        timezone: row.timezone,
        status: row.status,
        location: parseJson(row.location),
        attendees: attendees
            .filter((a) => a.bookingId === row.id)
            .map((a) => ({
            email: a.email,
            name: a.name,
            timezone: a.timezone ?? undefined,
            locale: a.locale ?? undefined,
            noShow: Boolean(a.noShow),
        })),
        references: references
            .filter((r) => r.bookingId === row.id)
            .map((r) => ({
            type: r.type,
            externalId: r.externalId,
            meetingUrl: r.meetingUrl ?? undefined,
            meetingPassword: r.meetingPassword ?? undefined,
            credentialId: r.credentialId ?? undefined,
        })),
        customResponses: parseJson(row.customResponses),
        cancellationReason: row.cancellationReason ?? undefined,
        reschedulingReason: row.reschedulingReason ?? undefined,
        cancelToken: row.cancelToken ?? undefined,
        rescheduleToken: row.rescheduleToken ?? undefined,
        fromReschedule: row.fromReschedule ?? undefined,
        iCalUid: row.iCalUid,
        iCalSequence: row.iCalSequence,
        recurringEventId: row.recurringEventId ?? undefined,
        paid: Boolean(row.paid),
        metadata: parseJson(row.metadata),
        createdAt: row.createdAt,
        updatedAt: row.updatedAt,
    };
}
function parseJson(s) {
    if (!s)
        return undefined;
    try {
        return JSON.parse(s);
    }
    catch {
        return undefined;
    }
}
export async function getBookingByUid(uid) {
    const { getDb, schema } = getSchedulingContext();
    const db = getDb();
    const rows = await db
        .select()
        .from(schema.bookings)
        .where(eq(schema.bookings.uid, uid));
    if (!rows[0])
        return null;
    const attendees = await db
        .select()
        .from(schema.bookingAttendees)
        .where(eq(schema.bookingAttendees.bookingId, rows[0].id));
    const references = await db
        .select()
        .from(schema.bookingReferences)
        .where(eq(schema.bookingReferences.bookingId, rows[0].id));
    return rowToBooking(rows[0], attendees, references);
}
export async function listBookings(filter) {
    const { getDb, schema } = getSchedulingContext();
    const db = getDb();
    const now = new Date().toISOString();
    const wheres = [];
    if (filter.useAccessFilter) {
        wheres.push(accessFilter(schema.bookings, schema.bookingShares));
    }
    if (filter.hostEmail)
        wheres.push(eq(schema.bookings.hostEmail, filter.hostEmail));
    if (filter.eventTypeId)
        wheres.push(eq(schema.bookings.eventTypeId, filter.eventTypeId));
    if (filter.status === "upcoming") {
        wheres.push(gte(schema.bookings.startTime, now));
        wheres.push(eq(schema.bookings.status, "confirmed"));
    }
    else if (filter.status === "past") {
        wheres.push(lt(schema.bookings.endTime, now));
    }
    else if (filter.status === "unconfirmed") {
        wheres.push(eq(schema.bookings.status, "pending"));
    }
    else if (filter.status === "recurring") {
        wheres.push(isNotNull(schema.bookings.recurringEventId));
    }
    else if (filter.status) {
        wheres.push(eq(schema.bookings.status, filter.status));
    }
    if (filter.from)
        wheres.push(gte(schema.bookings.startTime, filter.from));
    if (filter.to)
        wheres.push(lt(schema.bookings.startTime, filter.to));
    const rows = await db
        .select()
        .from(schema.bookings)
        .where(wheres.length ? and(...wheres) : undefined)
        .orderBy(filter.status === "past"
        ? desc(schema.bookings.startTime)
        : asc(schema.bookings.startTime))
        .limit(filter.limit ?? 200);
    if (rows.length === 0)
        return [];
    const ids = rows.map((r) => r.id);
    const attendees = await db
        .select()
        .from(schema.bookingAttendees)
        .where(or(...ids.map((id) => eq(schema.bookingAttendees.bookingId, id))));
    const references = await db
        .select()
        .from(schema.bookingReferences)
        .where(or(...ids.map((id) => eq(schema.bookingReferences.bookingId, id))));
    let out = rows.map((r) => rowToBooking(r, attendees, references));
    if (filter.attendeeEmail) {
        out = out.filter((b) => b.attendees.some((a) => a.email === filter.attendeeEmail));
    }
    return out;
}
export async function countBookingsByHostInRange(hostEmail, fromIso, toIso) {
    const { getDb, schema } = getSchedulingContext();
    const rows = await getDb()
        .select({ id: schema.bookings.id })
        .from(schema.bookings)
        .where(and(eq(schema.bookings.hostEmail, hostEmail), gte(schema.bookings.startTime, fromIso), lt(schema.bookings.startTime, toIso), eq(schema.bookings.status, "confirmed")));
    return rows.length;
}
export async function insertBooking(input) {
    const { getDb, schema } = getSchedulingContext();
    const db = getDb();
    const now = new Date().toISOString();
    const id = nanoid();
    const uid = nanoid(12);
    const iCalUid = input.iCalUid ?? `${uid}@agent-native-scheduling`;
    await db.insert(schema.bookings).values({
        id,
        uid,
        eventTypeId: input.eventTypeId,
        hostEmail: input.hostEmail,
        title: input.title,
        description: input.description ?? null,
        startTime: input.startTime,
        endTime: input.endTime,
        timezone: input.timezone,
        status: input.status ?? "confirmed",
        location: input.location ? JSON.stringify(input.location) : null,
        customResponses: input.customResponses
            ? JSON.stringify(input.customResponses)
            : null,
        cancelToken: nanoid(24),
        rescheduleToken: nanoid(24),
        fromReschedule: input.fromReschedule ?? null,
        iCalUid,
        iCalSequence: input.iCalSequence ?? 0,
        paid: false,
        createdAt: now,
        updatedAt: now,
        ownerEmail: input.ownerEmail,
        orgId: input.orgId ?? null,
    });
    for (const a of input.attendees) {
        await db.insert(schema.bookingAttendees).values({
            id: nanoid(),
            bookingId: id,
            email: a.email,
            name: a.name,
            timezone: a.timezone ?? null,
            locale: a.locale ?? null,
            noShow: false,
            createdAt: now,
        });
    }
    for (const r of input.references ?? []) {
        await db.insert(schema.bookingReferences).values({
            id: nanoid(),
            bookingId: id,
            type: r.type,
            externalId: r.externalId,
            meetingUrl: r.meetingUrl ?? null,
            meetingPassword: r.meetingPassword ?? null,
            credentialId: r.credentialId ?? null,
            createdAt: now,
        });
    }
    const created = await getBookingByUid(uid);
    if (!created)
        throw new Error("Failed to create booking");
    return created;
}
export async function updateBookingStatus(uid, status, extra) {
    const { getDb, schema } = getSchedulingContext();
    const set = { status, updatedAt: new Date().toISOString() };
    if (extra?.cancellationReason)
        set.cancellationReason = extra.cancellationReason;
    if (extra?.reschedulingReason)
        set.reschedulingReason = extra.reschedulingReason;
    await getDb()
        .update(schema.bookings)
        .set(set)
        .where(eq(schema.bookings.uid, uid));
}
export async function addBookingReference(bookingId, ref) {
    const { getDb, schema } = getSchedulingContext();
    await getDb()
        .insert(schema.bookingReferences)
        .values({
        id: nanoid(),
        bookingId,
        type: ref.type,
        externalId: ref.externalId,
        meetingUrl: ref.meetingUrl ?? null,
        meetingPassword: ref.meetingPassword ?? null,
        credentialId: ref.credentialId ?? null,
        createdAt: new Date().toISOString(),
    });
}
export async function markAttendeeNoShow(bookingId, email) {
    const { getDb, schema } = getSchedulingContext();
    await getDb()
        .update(schema.bookingAttendees)
        .set({ noShow: true })
        .where(and(eq(schema.bookingAttendees.bookingId, bookingId), eq(schema.bookingAttendees.email, email)));
}
//# sourceMappingURL=bookings-repo.js.map