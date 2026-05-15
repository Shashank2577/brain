/**
 * meetings.update — patch title / startsAt / endsAt / prepNotes.
 *
 * Used by the right-pane "Rename meeting" action and the left-pane prep
 * notes pad (debounced from the UI).
 *
 * Usage:
 *   pnpm action update --id=<id> --title="New title"
 *   pnpm action update --id=<id> --prepNotes="..."
 */
import { defineAction } from "@agent-native/core";
import { writeAppState } from "@agent-native/core/application-state";
import { assertAccess } from "@agent-native/core/sharing";
import { eq } from "drizzle-orm";
import { z } from "zod";
import { getDb, schema } from "../server/db/index.js";

export default defineAction({
  description: "Update a meeting's title, time range, or prep notes.",
  schema: z.object({
    id: z.string(),
    title: z.string().min(1).max(200).optional(),
    startsAt: z.string().optional(),
    endsAt: z.string().optional(),
    prepNotes: z.string().optional(),
  }),
  run: async (args) => {
    await assertAccess("meeting", args.id, "editor");

    const db = getDb();
    const nowIso = new Date().toISOString();
    const patch: Record<string, unknown> = { updatedAt: nowIso };
    if (args.title !== undefined) patch.title = args.title.trim();
    if (args.startsAt !== undefined) patch.startsAt = args.startsAt;
    if (args.endsAt !== undefined) patch.endsAt = args.endsAt;
    if (args.prepNotes !== undefined) patch.prepNotes = args.prepNotes;

    await db
      .update(schema.meetings)
      .set(patch as any)
      .where(eq(schema.meetings.id, args.id));

    await writeAppState("refresh-signal", { ts: Date.now() });

    return { id: args.id, updated: true as const };
  },
});
