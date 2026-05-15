import { defineAction } from "@agent-native/core";
import { assertAccess } from "@agent-native/core/sharing";
import { eq } from "drizzle-orm";
import { z } from "zod";
import { getDb, schema } from "../server/db/index.js";

/**
 * Patch any of `text`, `dueDate`, `priority`, or `linkedNoteId` on a task.
 * Passing `null` to `dueDate` / `priority` / `linkedNoteId` clears them.
 * Fields omitted from the input are left untouched.
 */
export default defineAction({
  description: "Update fields on an existing task.",
  schema: z.object({
    id: z.string().describe("Task id"),
    text: z.string().min(1).max(500).optional(),
    dueDate: z.string().datetime().nullable().optional(),
    priority: z.enum(["low", "normal", "high", "urgent"]).nullable().optional(),
    linkedNoteId: z.string().nullable().optional(),
  }),
  run: async (args) => {
    await assertAccess("task", args.id, "editor");

    const updates: Record<string, unknown> = {
      updatedAt: new Date().toISOString(),
    };
    if (args.text !== undefined) updates.text = args.text;
    if (args.dueDate !== undefined) updates.dueDate = args.dueDate;
    if (args.priority !== undefined) updates.priority = args.priority;
    if (args.linkedNoteId !== undefined) {
      updates.linkedNoteId = args.linkedNoteId;
    }

    const db = getDb();
    await db
      .update(schema.tasks)
      .set(updates)
      .where(eq(schema.tasks.id, args.id));

    return { id: args.id, updated: true as const };
  },
});
