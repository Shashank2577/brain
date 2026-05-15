import { defineAction } from "@agent-native/core";
import { accessFilter } from "@agent-native/core/sharing";
import { desc } from "drizzle-orm";
import { z } from "zod";
import { getDb, schema } from "../server/db/index.js";

/**
 * List the caller's tasks. Uses `accessFilter` so the user only sees their
 * own tasks plus any explicitly shared with them (no cross-user leakage).
 */
export default defineAction({
  description: "List the caller's tasks, optionally filtered.",
  schema: z.object({
    filter: z
      .enum(["active", "completed", "all"])
      .default("active")
      .describe("active = not completed, completed = done, all = both"),
    limit: z
      .number()
      .int()
      .min(1)
      .max(500)
      .default(100)
      .describe("Maximum number of rows to return"),
  }),
  http: { method: "GET" },
  run: async (args) => {
    const db = getDb();
    const rows = await db
      .select()
      .from(schema.tasks)
      .where(accessFilter(schema.tasks, schema.taskShares))
      .orderBy(desc(schema.tasks.createdAt))
      .limit(args.limit);

    let filtered = rows;
    if (args.filter === "active") {
      filtered = rows.filter((r) => r.completedAt === null);
    } else if (args.filter === "completed") {
      filtered = rows.filter((r) => r.completedAt !== null);
    }

    return filtered.map((r) => ({
      id: r.id,
      text: r.text,
      completed: r.completedAt !== null,
      completedAt: r.completedAt ?? null,
      linkedNoteId: r.linkedNoteId ?? null,
      dueDate: r.dueDate ?? null,
      priority: r.priority ?? null,
      createdAt: r.createdAt,
      updatedAt: r.updatedAt,
    }));
  },
});
