import { defineAction } from "@agent-native/core";
import { assertAccess } from "@agent-native/core/sharing";
import { eq } from "drizzle-orm";
import { z } from "zod";
import { getDb, schema } from "../server/db/index.js";

/**
 * Clear a task's `completedAt` so it returns to the active list.
 */
export default defineAction({
  description: "Mark a previously-completed task as active again.",
  schema: z.object({
    id: z.string().describe("Task id"),
  }),
  run: async (args) => {
    await assertAccess("task", args.id, "editor");

    const now = new Date().toISOString();
    const db = getDb();
    await db
      .update(schema.tasks)
      .set({ completedAt: null, updatedAt: now })
      .where(eq(schema.tasks.id, args.id));

    return {
      id: args.id,
      completed: false as const,
    };
  },
});
