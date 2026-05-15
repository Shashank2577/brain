/**
 * Meetings — Granola-style meeting lifecycle mini-app schema.
 *
 * 5 tables per docs/apps/meetings.md:
 *   1. meetings           — the core resource (ownable)
 *   2. meeting_transcripts — live transcript segments + full text
 *   3. meeting_attendees   — attendee list (copied from calendar.get-event)
 *   4. meeting_summaries   — AI output: 3 rows per finalize (summary | bullets | action_items)
 *   5. meeting_followups   — one row per action item, linked to a tasks.create row
 *
 * Access control: only `meetings` is ownable. Children scope through their
 * parent meeting via `meetingId`, gated by `accessFilter`/`assertAccess`.
 */
import {
  table,
  text,
  integer,
  now,
  ownableColumns,
  createSharesTable,
} from "@agent-native/core/db/schema";

export const meetings = table("meetings", {
  id: text("id").primaryKey(),
  title: text("title").notNull().default("Untitled meeting"),
  startsAt: text("starts_at"),
  endsAt: text("ends_at"),
  // Nullable FK to a calendar event. Cross-template — no DB-level FK.
  // Deleting the calendar event does NOT delete the meeting.
  calendarEventId: text("calendar_event_id"),
  // High-level state used by the right-pane spinner / CTA.
  status: text("status", {
    enum: ["scheduled", "live", "finalizing", "done", "failed"],
  })
    .notNull()
    .default("scheduled"),
  // User-typed pre-meeting / during-meeting notes (the left-pane Granola pad).
  prepNotes: text("prep_notes").notNull().default(""),
  // Nullable FK to the notes.create output (the published summary note).
  linkedNoteId: text("linked_note_id"),
  createdAt: text("created_at").notNull().default(now()),
  updatedAt: text("updated_at").notNull().default(now()),
  ...ownableColumns(),
});

export const meetingShares = createSharesTable("meeting_shares");

export const meetingTranscripts = table("meeting_transcripts", {
  id: text("id").primaryKey(),
  meetingId: text("meeting_id").notNull(),
  // Array of { startMs, endMs, speaker, text } stored as JSON text for
  // dialect portability (Neon, SQLite, Turso).
  segmentsJson: text("segments_json").notNull().default("[]"),
  fullText: text("full_text").notNull().default(""),
  // Source priority enforced by start-transcript: native > whisper > manual.
  source: text("source", { enum: ["native", "whisper", "manual"] })
    .notNull()
    .default("manual"),
  status: text("status", {
    enum: ["pending", "streaming", "ready", "failed"],
  })
    .notNull()
    .default("pending"),
  createdAt: text("created_at").notNull().default(now()),
  updatedAt: text("updated_at").notNull().default(now()),
});

export const meetingAttendees = table("meeting_attendees", {
  id: text("id").primaryKey(),
  meetingId: text("meeting_id").notNull(),
  email: text("email"),
  name: text("name").notNull(),
  role: text("role", { enum: ["organizer", "required", "optional"] })
    .notNull()
    .default("required"),
  isOwner: integer("is_owner", { mode: "boolean" }).notNull().default(false),
});

export const meetingSummaries = table("meeting_summaries", {
  id: text("id").primaryKey(),
  meetingId: text("meeting_id").notNull(),
  // Three AI output kinds. Separate rows so we can regenerate one without
  // losing the others.
  kind: text("kind", {
    enum: ["summary", "bullets", "action_items"],
  }).notNull(),
  // Markdown for `summary`; JSON for `bullets` and `action_items`.
  content: text("content").notNull(),
  generatedAt: text("generated_at").notNull().default(now()),
  // Which model / route produced it (used by the eval pipeline).
  provider: text("provider"),
});

export const meetingFollowups = table("meeting_followups", {
  id: text("id").primaryKey(),
  meetingId: text("meeting_id").notNull(),
  // Natural-language action item ("Alice will write the spec by Friday").
  text: text("text").notNull(),
  assigneeEmail: text("assignee_email"),
  // ISO date (YYYY-MM-DD); nullable when AI couldn't extract one.
  dueDate: text("due_date"),
  // Nullable FK to the tasks row created by `tasks.create`. NULL means the
  // followup hasn't been promoted to a task yet (or the promotion failed).
  taskId: text("task_id"),
  createdAt: text("created_at").notNull().default(now()),
});
