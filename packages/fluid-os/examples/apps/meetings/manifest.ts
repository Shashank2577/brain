import { z } from "zod";
import { defineApp } from "../../../src/manifest/index.js";

interface Recording {
  id: string;
  source: { kind: "s3" | "upload"; ref: string };
  durationSec: number;
  ownerId: string;
  createdAt: number;
}

interface Transcript {
  id: string;
  recordingId: string;
  text: string;
  speakers: string[];
  createdAt: number;
}

interface MeetingNote {
  id: string;
  recordingId: string;
  documentId: string;
  taskIds: string[];
  calendarEventId?: string;
  ownerId: string;
  createdAt: number;
}

const recordings = new Map<string, Recording>();
const transcripts = new Map<string, Transcript>();
const meetingNotes = new Map<string, MeetingNote>();

function id(prefix: string) {
  return `${prefix}_${Date.now().toString(36)}_${Math.random().toString(36).slice(2, 6)}`;
}

const STUB_TRANSCRIPT = `Alice: Thanks for jumping on, Carol. Two things on my mind today.
Carol: Sounds good — fire away.
Alice: First, the launch plan. We're targeting Monday, but the migration guide isn't ready.
Carol: I'll own the migration guide and have a draft by Friday.
Alice: Second, the demo video — we promised it to design partners last week.
Carol: Bob is recording it tomorrow. He'll post it in #beta by EOD Wednesday.
Alice: Perfect. Let's sync again Thursday after the migration guide draft.
Carol: Booked.`;

function extractActionItems(text: string): { who: string; what: string }[] {
  const items: { who: string; what: string }[] = [];
  for (const line of text.split("\n")) {
    const m = line.match(/^(\w+):\s+(I'll|I will|Let me|I'm going to)\s+(.+)$/i);
    if (m) items.push({ who: m[1], what: m[3].replace(/[.!?]$/, "") });
  }
  return items;
}

function summarize(text: string): string {
  const lines = text.split("\n").filter(Boolean);
  return lines.slice(0, 3).join(" ").slice(0, 240) + (lines.length > 3 ? "…" : "");
}

export const meetingsApp = defineApp({
  id: "meetings",
  name: "Meetings",
  description:
    "Upload a meeting recording (file or S3 URL), get a transcript, summary, and action items. Action items become tasks, the summary becomes a content document, and the meeting is linked to the matching calendar event.",
  icon: "microphone",
  url: "http://localhost:4117",
  consumes: [
    "calendar.list-events",
    "content.create-document",
    "tasks.create",
    "mail.find-contact",
  ],
  routes: [{ path: "/", label: "All recordings" }],
  capabilities: {
    "upload-recording": {
      description:
        "Register a recording. `source` is either { kind: 's3', ref: 's3://bucket/key' } or { kind: 'upload', ref: '<upload-id>' }.",
      input: z.object({
        source: z.object({ kind: z.enum(["s3", "upload"]), ref: z.string() }),
        durationSec: z.number().int().positive(),
      }),
      output: z.object({ id: z.string(), source: z.object({ kind: z.enum(["s3", "upload"]), ref: z.string() }), durationSec: z.number() }),
      tags: ["write"],
      handler: async (input, ctx) => {
        const rec: Recording = { id: id("rec"), ...input, ownerId: ctx.user.id, createdAt: Date.now() };
        recordings.set(rec.id, rec);
        return { id: rec.id, source: rec.source, durationSec: rec.durationSec };
      },
    },
    transcribe: {
      description:
        "Transcribe a recording. STUB: returns a canned transcript. Wire this to your transcription service or delegate to the agent.",
      input: z.object({ recordingId: z.string() }),
      output: z.object({ id: z.string(), text: z.string(), speakers: z.array(z.string()) }),
      tags: ["write", "ai-stub"],
      handler: async (input, ctx) => {
        const rec = recordings.get(input.recordingId);
        if (!rec || rec.ownerId !== ctx.user.id) throw new Error("recording not found");
        const text = STUB_TRANSCRIPT;
        const speakers = Array.from(new Set(text.split("\n").map((l) => l.split(":")[0]).filter(Boolean)));
        const t: Transcript = { id: id("trn"), recordingId: rec.id, text, speakers, createdAt: Date.now() };
        transcripts.set(t.id, t);
        return { id: t.id, text: t.text, speakers: t.speakers };
      },
    },
    "extract-action-items": {
      description:
        "Pull commitments out of a transcript. STUB: simple regex over speaker lines; swap for the agent.",
      input: z.object({ transcriptId: z.string() }),
      output: z.array(z.object({ who: z.string(), what: z.string() })),
      tags: ["read", "ai-stub"],
      handler: async (input) => {
        const t = transcripts.get(input.transcriptId);
        if (!t) throw new Error("transcript not found");
        return extractActionItems(t.text);
      },
    },
    "process-recording": {
      description:
        "End-to-end: transcribe, summarize, write a notes document via content.create-document, create one task per action item via tasks.create, and (best-effort) link it to a matching calendar event. Returns ids of everything created.",
      input: z.object({ recordingId: z.string(), linkToCalendarWithinMinutes: z.number().int().positive().default(120) }),
      output: z.object({
        recordingId: z.string(),
        transcriptId: z.string(),
        documentId: z.string(),
        taskIds: z.array(z.string()),
        calendarEventId: z.string().optional(),
        summary: z.string(),
      }),
      tags: ["write", "cross-app"],
      handler: async (input, ctx) => {
        const rec = recordings.get(input.recordingId);
        if (!rec || rec.ownerId !== ctx.user.id) throw new Error("recording not found");

        const transcript = (await ctx.call("meetings.transcribe", { recordingId: rec.id })) as {
          id: string;
          text: string;
          speakers: string[];
        };

        const summary = summarize(transcript.text);
        const actionItems = extractActionItems(transcript.text);

        const docBody = [
          `Summary: ${summary}`,
          "",
          "Speakers: " + transcript.speakers.join(", "),
          "",
          "Transcript:",
          transcript.text,
          "",
          "Action items:",
          ...actionItems.map((a) => `- ${a.who}: ${a.what}`),
        ].join("\n");

        const doc = (await ctx.call("content.create-document", {
          title: `Meeting notes — ${new Date(rec.createdAt).toISOString().slice(0, 10)}`,
          body: docBody,
        })) as { id: string };

        const taskIds: string[] = [];
        for (const item of actionItems) {
          const task = (await ctx.call("tasks.create", {
            text: `${item.who}: ${item.what}`,
            alsoNote: false,
          })) as { id: string };
          taskIds.push(task.id);
        }

        let calendarEventId: string | undefined;
        try {
          const events = (await ctx.call("calendar.list-events", {})) as { id: string; startsAt: number }[];
          const window = input.linkToCalendarWithinMinutes * 60 * 1000;
          const near = events.find((e) => Math.abs(e.startsAt - rec.createdAt) <= window);
          if (near) calendarEventId = near.id;
        } catch {
          // calendar app is optional
        }

        const note: MeetingNote = {
          id: id("mnote"),
          recordingId: rec.id,
          documentId: doc.id,
          taskIds,
          calendarEventId,
          ownerId: ctx.user.id,
          createdAt: Date.now(),
        };
        meetingNotes.set(note.id, note);

        return {
          recordingId: rec.id,
          transcriptId: transcript.id,
          documentId: doc.id,
          taskIds,
          calendarEventId,
          summary,
        };
      },
    },
    "list-meeting-notes": {
      description: "List meeting notes created for the user.",
      input: z.object({}).optional(),
      output: z.array(
        z.object({
          id: z.string(),
          recordingId: z.string(),
          documentId: z.string(),
          taskIds: z.array(z.string()),
          calendarEventId: z.string().optional(),
          createdAt: z.number(),
        }),
      ),
      tags: ["read"],
      handler: async (_input, ctx) => {
        return Array.from(meetingNotes.values())
          .filter((m) => m.ownerId === ctx.user.id)
          .sort((a, b) => b.createdAt - a.createdAt)
          .map(({ ownerId: _o, ...rest }) => rest);
      },
    },
  },
});
