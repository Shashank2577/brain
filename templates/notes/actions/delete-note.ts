import { defineAction } from "@agent-native/core";
import { z } from "zod";
import { eq } from "drizzle-orm";
import { getDb, schema } from "../server/db/index.js";
import { assertAccess } from "@agent-native/core/sharing";
import { writeAppState } from "@agent-native/core/application-state";

// Capability: notes.delete-note — admin.
//
// Soft-delete by default (sets `archivedAt`). When `purge: true`, hard-deletes
// the row and any share grants. Both paths require admin role —
// `assertAccess("note", id, "admin")` — so a viewer or editor share cannot
// delete the note.
export default defineAction({
  description:
    "Soft-delete a note (sets archivedAt). Pass purge:true to hard-delete the row. Requires admin access.",
  schema: z.object({
    id: z.string().describe("Note id."),
    purge: z.boolean().optional().default(false),
  }),
  run: async (args) => {
    await assertAccess("note", args.id, "admin");
    const db = getDb();

    if (args.purge) {
      await db
        .delete(schema.noteShares)
        .where(eq(schema.noteShares.resourceId, args.id));
      await db.delete(schema.notes).where(eq(schema.notes.id, args.id));
    } else {
      const archivedAt = new Date().toISOString();
      await db
        .update(schema.notes)
        .set({ archivedAt, updatedAt: archivedAt })
        .where(eq(schema.notes.id, args.id));
    }

    await writeAppState("refresh-signal", { ts: Date.now() });

    return { id: args.id, deleted: true as const, purged: Boolean(args.purge) };
  },
});
