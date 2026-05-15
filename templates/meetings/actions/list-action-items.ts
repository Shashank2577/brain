/**
 * meetings.list-action-items — followups across all meetings the caller
 * can see, with the linked task's completion state joined in.
 *
 * Useful for "what do I owe people from last week's meetings" surfaces.
 *
 * Usage:
 *   pnpm action list-action-items
 *   pnpm action list-action-items --assigneeEmail=alice@example.com
 *   pnpm action list-action-items --meetingId=<id>
 */
import { defineAction } from "@agent-native/core";
import { accessFilter } from "@agent-native/core/sharing";
import { and, eq, sql } from "drizzle-orm";
import { z } from "zod";
import { getDb, schema } from "../server/db/index.js";
import { dispatchCrossApp } from "../server/lib/dispatch.js";

export default defineAction({
  description:
    "List followup action items from meetings the caller can see, with linked task completion status.",
  schema: z.object({
    assigneeEmail: z.string().optional(),
    meetingId: z.string().optional(),
    includeCompleted: z.coerce.boolean().default(false),
  }),
  http: { method: "GET" },
  run: async (args) => {
    const db = getDb();

    const whereParent = [accessFilter(schema.meetings, schema.meetingShares)];
    if (args.meetingId) {
      whereParent.push(eq(schema.meetings.id, args.meetingId));
    }

    const meetings = await db
      .select()
      .from(schema.meetings)
      .where(and(...whereParent));

    if (!meetings.length) return [];

    const titleById = new Map(meetings.map((m) => [m.id, m.title] as const));
    const meetingIds = meetings.map((m) => m.id);

    // Filter followups to only the meetings the caller can see.
    const followups = await db
      .select()
      .from(schema.meetingFollowups)
      .where(
        sql`${schema.meetingFollowups.meetingId} IN (${sql.join(
          meetingIds.map((id) => sql`${id}`),
          sql`, `,
        )})`,
      );

    let filtered = followups;
    if (args.assigneeEmail) {
      const target = args.assigneeEmail.toLowerCase();
      filtered = filtered.filter(
        (f) => (f.assigneeEmail || "").toLowerCase() === target,
      );
    }

    // Look up task completion state best-effort. Caller may not have the
    // tasks app installed; if the lookup fails we surface `taskCompleted:
    // false` so the UI still renders.
    const taskCompletion = new Map<string, boolean>();
    const taskIds = filtered.map((f) => f.taskId).filter(Boolean) as string[];
    if (taskIds.length) {
      try {
        const tasks = (await dispatchCrossApp("tasks.list", {
          filter: "all",
        })) as Array<{ id: string; completed?: boolean }> | null;
        if (Array.isArray(tasks)) {
          for (const t of tasks) {
            taskCompletion.set(t.id, Boolean(t.completed));
          }
        }
      } catch (err) {
        console.warn(`[meetings.list-action-items] tasks.list failed: ${err}`);
      }
    }

    const rows = filtered.map((f) => ({
      id: f.id,
      meetingId: f.meetingId,
      meetingTitle: titleById.get(f.meetingId) ?? "",
      text: f.text,
      assigneeEmail: f.assigneeEmail,
      dueDate: f.dueDate,
      taskId: f.taskId,
      taskCompleted: f.taskId
        ? (taskCompletion.get(f.taskId) ?? false)
        : false,
    }));

    return args.includeCompleted
      ? rows
      : rows.filter((r) => !r.taskCompleted);
  },
});

