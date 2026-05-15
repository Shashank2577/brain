/**
 * Meetings database plugin — additive migrations, Postgres-compatible SQL.
 *
 * No DROP / TRUNCATE / destructive ALTER. Every migration adds new columns
 * or tables. See AGENTS.md "No breaking database changes" rule.
 */
import { runMigrations } from "@agent-native/core/db";
import { registerEvent } from "@agent-native/core/event-bus";
import { z } from "zod";
// Side-effect import — registers `meeting` as a shareable resource with the
// framework before any HTTP request runs.
import "../db/index.js";

const migrations = runMigrations(
  [
    // ---------------------------------------------------------------------
    // 1. meetings — the core ownable resource
    // ---------------------------------------------------------------------
    {
      version: 1,
      sql: `CREATE TABLE IF NOT EXISTS meetings (
        id TEXT PRIMARY KEY,
        title TEXT NOT NULL DEFAULT 'Untitled meeting',
        starts_at TEXT,
        ends_at TEXT,
        calendar_event_id TEXT,
        status TEXT NOT NULL DEFAULT 'scheduled',
        prep_notes TEXT NOT NULL DEFAULT '',
        linked_note_id TEXT,
        created_at TEXT NOT NULL DEFAULT (datetime('now')),
        updated_at TEXT NOT NULL DEFAULT (datetime('now')),
        owner_email TEXT NOT NULL DEFAULT 'local@localhost',
        org_id TEXT,
        visibility TEXT NOT NULL DEFAULT 'private'
      )`,
    },
    // ---------------------------------------------------------------------
    // 2. meeting_shares — framework sharing table
    // ---------------------------------------------------------------------
    {
      version: 2,
      sql: `CREATE TABLE IF NOT EXISTS meeting_shares (
        id TEXT PRIMARY KEY,
        resource_id TEXT NOT NULL,
        principal_type TEXT NOT NULL,
        principal_id TEXT NOT NULL,
        role TEXT NOT NULL DEFAULT 'viewer',
        created_by TEXT NOT NULL,
        created_at TEXT NOT NULL DEFAULT (datetime('now'))
      )`,
    },
    // ---------------------------------------------------------------------
    // 3. meeting_transcripts
    // ---------------------------------------------------------------------
    {
      version: 3,
      sql: `CREATE TABLE IF NOT EXISTS meeting_transcripts (
        id TEXT PRIMARY KEY,
        meeting_id TEXT NOT NULL,
        segments_json TEXT NOT NULL DEFAULT '[]',
        full_text TEXT NOT NULL DEFAULT '',
        source TEXT NOT NULL DEFAULT 'manual',
        status TEXT NOT NULL DEFAULT 'pending',
        created_at TEXT NOT NULL DEFAULT (datetime('now')),
        updated_at TEXT NOT NULL DEFAULT (datetime('now'))
      )`,
    },
    // ---------------------------------------------------------------------
    // 4. meeting_attendees
    // ---------------------------------------------------------------------
    {
      version: 4,
      sql: `CREATE TABLE IF NOT EXISTS meeting_attendees (
        id TEXT PRIMARY KEY,
        meeting_id TEXT NOT NULL,
        email TEXT,
        name TEXT NOT NULL,
        role TEXT NOT NULL DEFAULT 'required',
        is_owner BOOLEAN NOT NULL DEFAULT FALSE
      )`,
    },
    // ---------------------------------------------------------------------
    // 5. meeting_summaries — 3 rows per finalize (summary | bullets | action_items)
    // ---------------------------------------------------------------------
    {
      version: 5,
      sql: `CREATE TABLE IF NOT EXISTS meeting_summaries (
        id TEXT PRIMARY KEY,
        meeting_id TEXT NOT NULL,
        kind TEXT NOT NULL,
        content TEXT NOT NULL,
        generated_at TEXT NOT NULL DEFAULT (datetime('now')),
        provider TEXT
      )`,
    },
    // ---------------------------------------------------------------------
    // 6. meeting_followups — one row per action item, with task FK
    // ---------------------------------------------------------------------
    {
      version: 6,
      sql: `CREATE TABLE IF NOT EXISTS meeting_followups (
        id TEXT PRIMARY KEY,
        meeting_id TEXT NOT NULL,
        text TEXT NOT NULL,
        assignee_email TEXT,
        due_date TEXT,
        task_id TEXT,
        created_at TEXT NOT NULL DEFAULT (datetime('now'))
      )`,
    },
  ],
  { table: "_meetings_migrations" },
);

export default async (nitroApp: any): Promise<void> => {
  await migrations(nitroApp);

  // Register meetings template events for the automations system.
  registerEvent({
    name: "meeting.created",
    description: "A new meeting was created.",
    payloadSchema: z.object({
      meetingId: z.string(),
      title: z.string().optional(),
      createdBy: z.string().optional(),
      startsAt: z.string().optional(),
    }) as any,
  });

  registerEvent({
    name: "meeting.finalized",
    description:
      "A meeting was finalized — summary / bullets / action items generated, note and tasks created.",
    payloadSchema: z.object({
      meetingId: z.string(),
      noteId: z.string().optional(),
      taskCount: z.number().optional(),
    }) as any,
  });

  registerEvent({
    name: "meeting.transcript-started",
    description:
      "Live transcription started for a meeting (native / whisper / manual).",
    payloadSchema: z.object({
      meetingId: z.string(),
      transcriptId: z.string(),
      source: z.enum(["native", "whisper", "manual"]),
    }) as any,
  });
};
