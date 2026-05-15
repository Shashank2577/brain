/**
 * meetings.create — create a meeting (ad-hoc or from a calendar event).
 *
 * When `calendarEventId` is provided, attendees + title + start/end are
 * seeded from `calendar.get-event` via the Phase 1 capability registry.
 * If that call fails (calendar app not installed, event deleted, etc.)
 * the meeting is still created with whatever the caller passed in
 * directly — graceful degradation.
 *
 * Usage:
 *   pnpm action create
 *   pnpm action create --title="Weekly sync"
 *   pnpm action create --calendarEventId=google-abc123
 */
import { defineAction } from "@agent-native/core";
import { writeAppState } from "@agent-native/core/application-state";
import { z } from "zod";
import { getDb, schema } from "../server/db/index.js";
import { getCurrentOwnerEmail, nanoid } from "../server/lib/meetings.js";
import { dispatchCrossApp } from "../server/lib/dispatch.js";

interface CalendarEventLike {
  id?: string;
  title?: string;
  summary?: string;
  start?: string;
  end?: string;
  startTime?: string;
  endTime?: string;
  attendees?: Array<{
    email?: string;
    displayName?: string;
    name?: string;
    organizer?: boolean;
    self?: boolean;
  }>;
}

export default defineAction({
  description:
    "Create a meeting. If calendarEventId is provided, seeds title/time/attendees from the calendar app via calendar.get-event.",
  schema: z.object({
    id: z
      .string()
      .optional()
      .describe("Pre-generated meeting id (for optimistic UI)"),
    title: z.string().min(1).max(200).optional(),
    startsAt: z
      .string()
      .optional()
      .describe("ISO datetime — when the meeting starts"),
    endsAt: z
      .string()
      .optional()
      .describe("ISO datetime — when the meeting ends"),
    calendarEventId: z
      .string()
      .optional()
      .describe("Calendar event id; triggers calendar.get-event seeding"),
    attendees: z
      .array(
        z.object({
          email: z.string().optional(),
          name: z.string(),
          role: z
            .enum(["organizer", "required", "optional"])
            .optional()
            .default("required"),
        }),
      )
      .optional(),
  }),
  run: async (args) => {
    const db = getDb();
    const ownerEmail = getCurrentOwnerEmail();
    const id = args.id || nanoid();
    const nowIso = new Date().toISOString();

    let title = args.title?.trim() || "Untitled meeting";
    let startsAt = args.startsAt ?? null;
    let endsAt = args.endsAt ?? null;
    let attendees = args.attendees ?? [];

    // Seed from calendar.get-event if a calendar event id was provided.
    // Graceful degradation — failure does NOT block creation.
    if (args.calendarEventId) {
      try {
        const result = await dispatchCrossApp("calendar.get-event", {
          id: args.calendarEventId,
        });
        const event = result as CalendarEventLike | null;
        if (event && !(event as any).error) {
          title =
            args.title?.trim() ||
            event.title ||
            event.summary ||
            "Untitled meeting";
          startsAt = args.startsAt ?? event.start ?? event.startTime ?? null;
          endsAt = args.endsAt ?? event.end ?? event.endTime ?? null;
          if (!args.attendees && event.attendees?.length) {
            attendees = event.attendees.map((a) => ({
              email: a.email,
              name: a.displayName || a.name || a.email || "Attendee",
              role: a.organizer ? "organizer" : "required",
            }));
          }
        }
      } catch (err) {
        console.warn(
          `[meetings.create] calendar.get-event failed (continuing): ${err}`,
        );
      }
    }

    await db.insert(schema.meetings).values({
      id,
      title,
      startsAt,
      endsAt,
      calendarEventId: args.calendarEventId ?? null,
      status: "scheduled",
      prepNotes: "",
      linkedNoteId: null,
      ownerEmail,
      createdAt: nowIso,
      updatedAt: nowIso,
    } as any);

    // Insert attendees — caller email is auto-marked as `isOwner`.
    for (const att of attendees) {
      await db.insert(schema.meetingAttendees).values({
        id: nanoid(),
        meetingId: id,
        email: att.email ?? null,
        name: att.name,
        role: att.role ?? "required",
        isOwner: att.email?.toLowerCase() === ownerEmail.toLowerCase(),
      } as any);
    }

    await writeAppState("refresh-signal", { ts: Date.now() });

    console.log(`Created meeting "${title}" (${id})`);

    return { id, status: "scheduled" as const };
  },
});
