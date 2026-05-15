import { defineAction } from "@agent-native/core";
import { assertAccess } from "@agent-native/core/sharing";
import { eq } from "drizzle-orm";
import { z } from "zod";
import { getDb, schema } from "../server/db/index.js";

/**
 * Mark a task done. Idempotent — re-completing an already-completed task
 * preserves the original `completedAt` timestamp (this is what makes
 * `tasks.complete` safe to retry, e.g. when an automation fires twice).
 */
export default defineAction({
  description: "Mark a task as completed.",
  schema: z.object({
    id: z.string().describe("Task id"),
  }),
  run: async (args) => {
    const access = await assertAccess("task", args.id, "editor");
    const existing = access.resource;

    if (existing.completedAt) {
      return {
        id: existing.id,
        completed: true as const,
        completedAt: existing.completedAt,
      };
    }

    const now = new Date().toISOString();
    const db = getDb();
    await db
      .update(schema.tasks)
      .set({ completedAt: now, updatedAt: now })
      .where(eq(schema.tasks.id, args.id));

    return {
      id: args.id,
      completed: true as const,
      completedAt: now,
    };
  },
});
