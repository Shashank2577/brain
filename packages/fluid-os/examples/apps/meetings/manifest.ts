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

function parseActionItemLines(text: string): { who: string; what: string }[] {
  const items: { who: string; what: string }[] = [];
  for (const raw of text.split("\n")) {
    const line = raw.replace(/^[\s\-*•]+/, "").trim();
    if (!line) continue;
    const m = line.match(/^(\w[\w\s]*?):\s+(.+)$/);
    if (m) {
      items.push({ who: m[1].trim(), what: m[2].replace(/[.!?]$/, "").trim() });
    }
  }
  return items;
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
  agentGuidance:
    "Always upload-recording first to get an id. Then call process-recording, which fans out to transcribe → content.create-document → tasks.create (one task per action item) → calendar.list-events for linking. The transcribe/summary/action-item steps all go through ctx.agent — do not inline an LLM call.",
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
      description: "Transcribe a recording. Delegates the actual transcription to the agent via ctx.agent.",
      input: z.object({ recordingId: z.string() }),
      output: z.object({ id: z.string(), text: z.string(), speakers: z.array(z.string()) }),
      tags: ["write", "ai"],
      handler: async (input, ctx) => {
        const rec = recordings.get(input.recordingId);
        if (!rec || rec.ownerId !== ctx.user.id) throw new Error("recording not found");
        const text = await ctx.agent(
          [
            "Transcribe the meeting recording referenced below into plain text with one line per speaker turn.",
            "Format: \"<Speaker Name>: <utterance>\". Keep ~8-12 turns.",
            `Recording source: ${rec.source.kind} :: ${rec.source.ref}`,
            `Duration: ${rec.durationSec}s`,
          ].join("\n"),
        );
        const speakers = Array.from(
          new Set(text.split("\n").map((l) => l.split(":")[0]?.trim()).filter((s) => s && s.length > 0 && s.length < 40)),
        );
        const t: Transcript = { id: id("trn"), recordingId: rec.id, text, speakers, createdAt: Date.now() };
        transcripts.set(t.id, t);
        return { id: t.id, text: t.text, speakers: t.speakers };
      },
    },
    "extract-action-items": {
      description: "Pull commitments out of a transcript via ctx.agent.",
      input: z.object({ transcriptId: z.string() }),
      output: z.array(z.object({ who: z.string(), what: z.string() })),
      tags: ["read", "ai"],
      handler: async (input, ctx) => {
        const t = transcripts.get(input.transcriptId);
        if (!t) throw new Error("transcript not found");
        const raw = await ctx.agent(
          [
            "Extract concrete commitments from this transcript.",
            'Reply with one item per line in the exact form "Name: what they will do" (no other commentary).',
            "",
            t.text,
          ].join("\n"),
        );
        return parseActionItemLines(raw);
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

        const summary = await ctx.agent(
          [
            "Summarize this meeting transcript in 2 short sentences. Plain prose, no bullets.",
            "",
            transcript.text,
          ].join("\n"),
        );
        const actionItems = (await ctx.call("meetings.extract-action-items", {
          transcriptId: transcript.id,
        })) as { who: string; what: string }[];

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
