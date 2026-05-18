/**
 * Data access for event types.
 *
 * All write paths funnel through here so ownership, slug uniqueness, and
 * redirect history are handled consistently.
 */
import { eq, and } from "drizzle-orm";
import { nanoid } from "nanoid";
import { accessFilter } from "@agent-native/core/sharing";
import { getSchedulingContext } from "./context.js";
function keyFor(ownerEmail, teamId, slug) {
    if (teamId)
        return `team:${teamId}:${slug}`;
    return `user:${ownerEmail ?? ""}:${slug}`;
}
function rowToEventType(row) {
    return {
        id: row.id,
        title: row.title,
        slug: row.slug,
        description: row.description ?? undefined,
        length: row.length,
        durations: parseJson(row.durations),
        hidden: Boolean(row.hidden),
        position: row.position,
        schedulingType: row.schedulingType,
        ownerEmail: row.ownerEmail ?? undefined,
        teamId: row.teamId ?? undefined,
        scheduleId: row.scheduleId ?? undefined,
        locations: parseJson(row.locations) ?? [],
        customFields: parseJson(row.customFields) ?? [],
        minimumBookingNotice: row.minimumBookingNotice,
        beforeEventBuffer: row.beforeEventBuffer,
        afterEventBuffer: row.afterEventBuffer,
        slotInterval: row.slotInterval ?? null,
        periodType: row.periodType,
        periodDays: row.periodDays ?? undefined,
        periodStartDate: row.periodStartDate ?? undefined,
        periodEndDate: row.periodEndDate ?? undefined,
        seatsPerTimeSlot: row.seatsPerTimeSlot ?? undefined,
        requiresConfirmation: Boolean(row.requiresConfirmation),
        disableGuests: Boolean(row.disableGuests),
        hideCalendarNotes: Boolean(row.hideCalendarNotes),
        successRedirectUrl: row.successRedirectUrl ?? undefined,
        bookingLimits: parseJson(row.bookingLimits),
        lockTimeZoneToggle: Boolean(row.lockTimeZoneToggle),
        color: row.color ?? undefined,
        eventName: row.eventName ?? undefined,
        recurringEvent: parseJson(row.recurringEvent),
        metadata: parseJson(row.metadata),
        createdAt: row.createdAt,
        updatedAt: row.updatedAt,
    };
}
function parseJson(str) {
    if (!str)
        return undefined;
    try {
        return JSON.parse(str);
    }
    catch {
        return undefined;
    }
}
export async function listEventTypes(params) {
    const { getDb, schema } = getSchedulingContext();
    const db = getDb();
    let rows;
    if (params.teamId) {
        // Team-scoped listings. Callers are responsible for asserting team
        // membership before invoking — the repo does not (it runs without a
        // request context in some paths, e.g. public booking pages that
        // explicitly pass a teamId).
        rows = await db
            .select()
            .from(schema.eventTypes)
            .where(eq(schema.eventTypes.teamId, params.teamId));
    }
    else if (params.useAccessFilter) {
        rows = await db
            .select()
            .from(schema.eventTypes)
            .where(accessFilter(schema.eventTypes, schema.eventTypeShares));
    }
    else if (params.ownerEmail) {
        rows = await db
            .select()
            .from(schema.eventTypes)
            .where(eq(schema.eventTypes.ownerEmail, params.ownerEmail));
    }
    else {
        // Refuse to return unscoped results. Callers must supply at least
        // one of: teamId, useAccessFilter, or ownerEmail.
        return [];
    }
    return rows
        .filter((r) => (params.includeHidden ? true : !r.hidden))
        .sort((a, b) => a.position - b.position)
        .map(rowToEventType);
}
export async function getEventTypeById(id) {
    const { getDb, schema } = getSchedulingContext();
    const rows = await getDb()
        .select()
        .from(schema.eventTypes)
        .where(eq(schema.eventTypes.id, id));
    return rows[0] ? rowToEventType(rows[0]) : null;
}
export async function getEventTypeBySlug(params) {
    const { getDb, schema } = getSchedulingContext();
    const db = getDb();
    let rows;
    if (params.teamId) {
        rows = await db
            .select()
            .from(schema.eventTypes)
            .where(and(eq(schema.eventTypes.teamId, params.teamId), eq(schema.eventTypes.slug, params.slug)));
    }
    else if (params.ownerEmail) {
        rows = await db
            .select()
            .from(schema.eventTypes)
            .where(and(eq(schema.eventTypes.ownerEmail, params.ownerEmail), eq(schema.eventTypes.slug, params.slug)));
    }
    else {
        return null;
    }
    return rows[0] ? rowToEventType(rows[0]) : null;
}
export async function createEventType(input) {
    const { getDb, schema } = getSchedulingContext();
    const db = getDb();
    const now = new Date().toISOString();
    const id = nanoid();
    // Default location: the user's `isDefault` conferencing credential if they
    // have one installed (Zoom, Meet, Teams), otherwise no location — the
    // editor will prompt them to pick.
    const defaultLocations = input.locations ??
        (input.ownerEmail ? await resolveDefaultLocation(input.ownerEmail) : []);
    await db.insert(schema.eventTypes).values({
        id,
        title: input.title,
        slug: input.slug,
        description: input.description ?? null,
        length: input.length,
        position: 0,
        hidden: false,
        schedulingType: input.schedulingType ?? "personal",
        ownerEmail: input.ownerEmail ?? null,
        teamId: input.teamId ?? null,
        scheduleId: input.scheduleId ?? null,
        locations: JSON.stringify(defaultLocations),
        customFields: input.customFields
            ? JSON.stringify(input.customFields)
            : JSON.stringify([]),
        minimumBookingNotice: 0,
        beforeEventBuffer: 0,
        afterEventBuffer: 0,
        slotInterval: null,
        periodType: "rolling",
        periodDays: 60,
        requiresConfirmation: false,
        disableGuests: false,
        hideCalendarNotes: false,
        lockTimeZoneToggle: false,
        color: input.color ?? null,
        recurringEvent: input.recurringEvent
            ? JSON.stringify(input.recurringEvent)
            : null,
        createdAt: now,
        updatedAt: now,
        orgId: input.orgId ?? null,
    });
    const created = await getEventTypeById(id);
    if (!created)
        throw new Error("Failed to create event type");
    return created;
}
export async function updateEventType(id, patch) {
    const { getDb, schema } = getSchedulingContext();
    const db = getDb();
    const current = await getEventTypeById(id);
    if (!current)
        throw new Error(`Event type ${id} not found`);
    const dbPatch = {};
    if (patch.title != null)
        dbPatch.title = patch.title;
    if (patch.slug != null && patch.slug !== current.slug) {
        // Record slug redirect
        const oldKey = keyFor(current.ownerEmail ?? null, current.teamId ?? null, current.slug);
        const newKey = keyFor(current.ownerEmail ?? null, current.teamId ?? null, patch.slug);
        await db
            .insert(schema.eventTypeSlugRedirects)
            .values({
            oldKey,
            newKey,
            eventTypeId: id,
            createdAt: new Date().toISOString(),
        })
            .onConflictDoNothing?.();
        dbPatch.slug = patch.slug;
    }
    if (patch.description !== undefined)
        dbPatch.description = patch.description ?? null;
    if (patch.length != null)
        dbPatch.length = patch.length;
    if (patch.durations !== undefined)
        dbPatch.durations = patch.durations
            ? JSON.stringify(patch.durations)
            : null;
    if (patch.hidden != null)
        dbPatch.hidden = patch.hidden;
    if (patch.position != null)
        dbPatch.position = patch.position;
    if (patch.schedulingType != null)
        dbPatch.schedulingType = patch.schedulingType;
    if (patch.scheduleId !== undefined)
        dbPatch.scheduleId = patch.scheduleId ?? null;
    if (patch.locations !== undefined)
        dbPatch.locations = JSON.stringify(patch.locations ?? []);
    if (patch.customFields !== undefined)
        dbPatch.customFields = JSON.stringify(patch.customFields ?? []);
    if (patch.minimumBookingNotice != null)
        dbPatch.minimumBookingNotice = patch.minimumBookingNotice;
    if (patch.beforeEventBuffer != null)
        dbPatch.beforeEventBuffer = patch.beforeEventBuffer;
    if (patch.afterEventBuffer != null)
        dbPatch.afterEventBuffer = patch.afterEventBuffer;
    if (patch.slotInterval !== undefined)
        dbPatch.slotInterval = patch.slotInterval;
    if (patch.periodType != null)
        dbPatch.periodType = patch.periodType;
    if (patch.periodDays !== undefined)
        dbPatch.periodDays = patch.periodDays ?? null;
    if (patch.periodStartDate !== undefined)
        dbPatch.periodStartDate = patch.periodStartDate ?? null;
    if (patch.periodEndDate !== undefined)
        dbPatch.periodEndDate = patch.periodEndDate ?? null;
    if (patch.seatsPerTimeSlot !== undefined)
        dbPatch.seatsPerTimeSlot = patch.seatsPerTimeSlot ?? null;
    if (patch.requiresConfirmation != null)
        dbPatch.requiresConfirmation = patch.requiresConfirmation;
    if (patch.disableGuests != null)
        dbPatch.disableGuests = patch.disableGuests;
    if (patch.hideCalendarNotes != null)
        dbPatch.hideCalendarNotes = patch.hideCalendarNotes;
    if (patch.successRedirectUrl !== undefined)
        dbPatch.successRedirectUrl = patch.successRedirectUrl ?? null;
    if (patch.bookingLimits !== undefined)
        dbPatch.bookingLimits = patch.bookingLimits
            ? JSON.stringify(patch.bookingLimits)
            : null;
    if (patch.lockTimeZoneToggle != null)
        dbPatch.lockTimeZoneToggle = patch.lockTimeZoneToggle;
    if (patch.color !== undefined)
        dbPatch.color = patch.color ?? null;
    if (patch.eventName !== undefined)
        dbPatch.eventName = patch.eventName ?? null;
    if (patch.recurringEvent !== undefined)
        dbPatch.recurringEvent = patch.recurringEvent
            ? JSON.stringify(patch.recurringEvent)
            : null;
    if (patch.metadata !== undefined)
        dbPatch.metadata = patch.metadata ? JSON.stringify(patch.metadata) : null;
    dbPatch.updatedAt = new Date().toISOString();
    await db
        .update(schema.eventTypes)
        .set(dbPatch)
        .where(eq(schema.eventTypes.id, id));
    const updated = await getEventTypeById(id);
    if (!updated)
        throw new Error("Failed to update event type");
    return updated;
}
export async function deleteEventType(id) {
    const { getDb, schema } = getSchedulingContext();
    await getDb().delete(schema.eventTypes).where(eq(schema.eventTypes.id, id));
}
/**
 * Return a sensible default location for a freshly-created event type.
 * Priority: the user's `isDefault` video conferencing credential → the
 * first installed video credential → an empty list (editor prompts user).
 */
async function resolveDefaultLocation(ownerEmail) {
    const { getDb, schema } = getSchedulingContext();
    const rows = await getDb()
        .select()
        .from(schema.schedulingCredentials)
        .where(eq(schema.schedulingCredentials.userEmail, ownerEmail));
    const videoKinds = new Set(["zoom_video", "google_meet", "teams_video"]);
    const video = rows.filter((r) => videoKinds.has(r.type) && !r.invalid);
    const preferred = video.find((r) => r.isDefault) ?? video[0];
    if (!preferred)
        return [];
    const kindMap = {
        zoom_video: "zoom",
        google_meet: "google-meet",
        teams_video: "teams",
    };
    const kind = kindMap[preferred.type];
    if (!kind)
        return [];
    return [{ kind, credentialId: preferred.id }];
}
export async function resolveEventTypeSlug(params) {
    const direct = await getEventTypeBySlug(params);
    if (direct)
        return direct;
    const { getDb, schema } = getSchedulingContext();
    const oldKey = keyFor(params.ownerEmail ?? null, params.teamId ?? null, params.slug);
    const redirects = await getDb()
        .select()
        .from(schema.eventTypeSlugRedirects)
        .where(eq(schema.eventTypeSlugRedirects.oldKey, oldKey));
    if (redirects[0]?.eventTypeId) {
        return getEventTypeById(redirects[0].eventTypeId);
    }
    return null;
}
//# sourceMappingURL=event-types-repo.js.map