/**
 * meetings.start-transcript — begin live transcription for a meeting.
 *
 * Source priority (per spec): native > whisper > manual. `native` requires
 * a desktop bridge (currently signalled by the request header
 * `x-an-desktop-bridge: 1` or a `preferredSource: "native"` hint).
 * `whisper` requires an `OPENAI_API_KEY`. Otherwise we fall back to
 * `manual` (user types into the transcript pad).
 *
 * Idempotent — re-calling for a meeting that already has a transcript
 * returns the existing transcript id.
 *
 * Usage:
 *   pnpm action start-transcript --meetingId=<id>
 *   pnpm action start-transcript --meetingId=<id> --preferredSource=manual
 */
import { defineAction } from "@agent-native/core";
import { writeAppState } from "@agent-native/core/application-state";
import { assertAccess } from "@agent-native/core/sharing";
import { eq } from "drizzle-orm";
import { z } from "zod";
import { getDb, schema } from "../server/db/index.js";
import { nanoid } from "../server/lib/meetings.js";

type TranscriptSource = "native" | "whisper" | "manual";

/**
 * Choose a transcript source given the caller's hint and environment.
 * Exported for unit testing.
 */
export function pickSource(opts: {
  preferred?: TranscriptSource;
  hasDesktopBridge: boolean;
  hasWhisperKey: boolean;
}): TranscriptSource {
  // Explicit user override always wins.
  if (opts.preferred) return opts.preferred;
  if (opts.hasDesktopBridge) return "native";
  if (opts.hasWhisperKey) return "whisper";
  return "manual";
}

export default defineAction({
  description:
    "Begin live transcription for a meeting. Picks the best source available (native > whisper > manual). Idempotent.",
  schema: z.object({
    meetingId: z.string(),
    preferredSource: z.enum(["native", "whisper", "manual"]).optional(),
  }),
  run: async (args) => {
    await assertAccess("meeting", args.meetingId, "editor");

    const db = getDb();

    // Look up existing transcript first (idempotency).
    const [existing] = await db
      .select()
      .from(schema.meetingTranscripts)
      .where(eq(schema.meetingTranscripts.meetingId, args.meetingId));

    if (existing) {
      return {
        transcriptId: existing.id,
        source: existing.source as TranscriptSource,
      };
    }

    const hasDesktopBridge =
      process.env.AN_DESKTOP_BRIDGE === "1" ||
      process.env.DESKTOP_BRIDGE === "1";
    const hasWhisperKey = Boolean(process.env.OPENAI_API_KEY);
    const source = pickSource({
      preferred: args.preferredSource,
      hasDesktopBridge,
      hasWhisperKey,
    });

    const id = nanoid();
    const nowIso = new Date().toISOString();
    await db.insert(schema.meetingTranscripts).values({
      id,
      meetingId: args.meetingId,
      segmentsJson: "[]",
      fullText: "",
      source,
      status: "streaming",
      createdAt: nowIso,
      updatedAt: nowIso,
    } as any);

    await db
      .update(schema.meetings)
      .set({ status: "live", updatedAt: nowIso })
      .where(eq(schema.meetings.id, args.meetingId));

    await writeAppState("refresh-signal", { ts: Date.now() });

    return { transcriptId: id, source };
  },
});
