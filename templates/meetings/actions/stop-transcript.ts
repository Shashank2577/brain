/**
 * meetings.stop-transcript — flip the transcript to `ready` and the meeting
 * back to `scheduled` so the user can finalize.
 *
 * Usage:
 *   pnpm action stop-transcript --meetingId=<id>
 */
import { defineAction } from "@agent-native/core";
import { writeAppState } from "@agent-native/core/application-state";
import { assertAccess } from "@agent-native/core/sharing";
import { eq } from "drizzle-orm";
import { z } from "zod";
import { getDb, schema } from "../server/db/index.js";

export default defineAction({
  description:
    "Stop live transcription. Flips meeting.status back to scheduled so finalize is reachable.",
  schema: z.object({ meetingId: z.string() }),
  run: async (args) => {
    await assertAccess("meeting", args.meetingId, "editor");

    const db = getDb();
    const [transcript] = await db
      .select()
      .from(schema.meetingTranscripts)
      .where(eq(schema.meetingTranscripts.meetingId, args.meetingId));

    if (!transcript) {
      throw new Error(`No transcript for meeting ${args.meetingId}`);
    }

    const nowIso = new Date().toISOString();
    const status: "ready" | "failed" =
      transcript.status === "failed" ? "failed" : "ready";

    await db
      .update(schema.meetingTranscripts)
      .set({ status, updatedAt: nowIso })
      .where(eq(schema.meetingTranscripts.id, transcript.id));

    await db
      .update(schema.meetings)
      .set({ status: "scheduled", updatedAt: nowIso })
      .where(eq(schema.meetings.id, args.meetingId));

    await writeAppState("refresh-signal", { ts: Date.now() });

    return { transcriptId: transcript.id, status };
  },
});
