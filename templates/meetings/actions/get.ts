/**
 * meetings.get — single meeting with transcript + summaries + attendees +
 * followups. Access checked via `accessFilter` on the parent row.
 *
 * Usage:
 *   pnpm action get --id=<meetingId>
 */
import { defineAction } from "@agent-native/core";
import { accessFilter } from "@agent-native/core/sharing";
import { and, eq } from "drizzle-orm";
import { z } from "zod";
import { getDb, schema } from "../server/db/index.js";

export default defineAction({
  description:
    "Get a meeting with its transcript, AI summaries, attendees, and followups.",
  schema: z.object({ id: z.string() }),
  http: { method: "GET" },
  run: async (args) => {
    const db = getDb();

    const [meeting] = await db
      .select()
      .from(schema.meetings)
      .where(
        and(
          eq(schema.meetings.id, args.id),
          accessFilter(schema.meetings, schema.meetingShares),
        ),
      );

    if (!meeting) {
      throw new Error(`Meeting not found: ${args.id}`);
    }

    const [transcripts, summaries, attendees, followups] = await Promise.all([
      db
        .select()
        .from(schema.meetingTranscripts)
        .where(eq(schema.meetingTranscripts.meetingId, args.id)),
      db
        .select()
        .from(schema.meetingSummaries)
        .where(eq(schema.meetingSummaries.meetingId, args.id)),
      db
        .select()
        .from(schema.meetingAttendees)
        .where(eq(schema.meetingAttendees.meetingId, args.id)),
      db
        .select()
        .from(schema.meetingFollowups)
        .where(eq(schema.meetingFollowups.meetingId, args.id)),
    ]);

    const transcript = transcripts[0] ?? null;
    let segments: unknown = [];
    if (transcript) {
      try {
        segments = JSON.parse(transcript.segmentsJson);
      } catch {
        segments = [];
      }
    }

    return {
      meeting: {
        id: meeting.id,
        title: meeting.title,
        startsAt: meeting.startsAt,
        endsAt: meeting.endsAt,
        calendarEventId: meeting.calendarEventId,
        status: meeting.status,
        prepNotes: meeting.prepNotes,
        linkedNoteId: meeting.linkedNoteId,
        createdAt: meeting.createdAt,
        updatedAt: meeting.updatedAt,
      },
      transcript: transcript
        ? {
            id: transcript.id,
            status: transcript.status,
            source: transcript.source,
            fullText: transcript.fullText,
            segments,
          }
        : null,
      summaries: summaries.map((s) => ({
        kind: s.kind,
        content: s.content,
        generatedAt: s.generatedAt,
      })),
      attendees: attendees.map((a) => ({
        email: a.email,
        name: a.name,
        role: a.role,
        isOwner: a.isOwner,
      })),
      followups: followups.map((f) => ({
        id: f.id,
        text: f.text,
        assigneeEmail: f.assigneeEmail,
        dueDate: f.dueDate,
        taskId: f.taskId,
      })),
    };
  },
});
