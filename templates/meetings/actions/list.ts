/**
 * meetings.list — list meetings the caller can see.
 *
 * Splits into "upcoming" (startsAt >= now) and "past" (startsAt < now or
 * null). Filters honor sharing via `accessFilter`.
 *
 * Usage:
 *   pnpm action list
 *   pnpm action list --filter=upcoming
 *   pnpm action list --search="standup"
 */
import { defineAction } from "@agent-native/core";
import { accessFilter } from "@agent-native/core/sharing";
import { and, desc, sql } from "drizzle-orm";
import { z } from "zod";
import { getDb, schema } from "../server/db/index.js";

function escapeLike(s: string): string {
  return s.replace(/([\\%_])/g, "\\$1");
}

export default defineAction({
  description:
    "List meetings the caller can see. Optional filter splits upcoming vs past relative to now().",
  schema: z.object({
    filter: z.enum(["upcoming", "past", "all"]).default("all"),
    search: z.string().optional(),
    limit: z.coerce.number().int().min(1).max(200).default(50),
  }),
  http: { method: "GET" },
  run: async (args) => {
    const db = getDb();
    const nowIso = new Date().toISOString();

    const whereClauses = [accessFilter(schema.meetings, schema.meetingShares)];

    if (args.filter === "upcoming") {
      whereClauses.push(sql`${schema.meetings.startsAt} >= ${nowIso}`);
    } else if (args.filter === "past") {
      whereClauses.push(
        sql`(${schema.meetings.startsAt} < ${nowIso} OR ${schema.meetings.startsAt} IS NULL)`,
      );
    }

    if (args.search) {
      const pat = `%${escapeLike(args.search.toLowerCase())}%`;
      whereClauses.push(
        sql`LOWER(${schema.meetings.title}) LIKE ${pat} ESCAPE '\\'`,
      );
    }

    const rows = await db
      .select()
      .from(schema.meetings)
      .where(and(...whereClauses))
      .orderBy(desc(schema.meetings.startsAt))
      .limit(args.limit);

    // Attendee counts per meeting — naive but fine for the v1 list view.
    const counts: Record<string, number> = {};
    for (const row of rows) {
      const atts = await db
        .select({ id: schema.meetingAttendees.id })
        .from(schema.meetingAttendees)
        .where(sql`${schema.meetingAttendees.meetingId} = ${row.id}`);
      counts[row.id] = atts.length;
    }

    return rows.map((r) => ({
      id: r.id,
      title: r.title,
      startsAt: r.startsAt,
      endsAt: r.endsAt,
      status: r.status,
      calendarEventId: r.calendarEventId,
      linkedNoteId: r.linkedNoteId,
      attendeeCount: counts[r.id] ?? 0,
    }));
  },
});
