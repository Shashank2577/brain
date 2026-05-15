import { defineAction } from "@agent-native/core";
import { readAppState } from "@agent-native/core/application-state";
import { accessFilter, resolveAccess } from "@agent-native/core/sharing";
import { desc } from "drizzle-orm";
import { z } from "zod";
import { getDb, schema } from "../server/db/index.js";

/**
 * Snapshot of the current screen for the agent: which filter is active,
 * which task (if any) is selected, and a short list of the current rows so
 * the agent can act on "complete this one" / "due tomorrow" without naming
 * a specific id.
 */
export default defineAction({
  description: "See what the user is currently looking at on the tasks screen.",
  schema: z.object({}),
  http: false,
  run: async () => {
    const navigation = await readAppState("navigation");
    const screen: Record<string, unknown> = {};
    if (navigation) screen.navigation = navigation;

    const nav = navigation as
      | { selectedTaskId?: string; filter?: string }
      | undefined;

    if (nav?.selectedTaskId) {
      const access = await resolveAccess("task", nav.selectedTaskId);
      if (access) {
        const t = access.resource;
        screen.selectedTask = {
          id: t.id,
          text: t.text,
          completed: t.completedAt !== null,
          completedAt: t.completedAt ?? null,
          linkedNoteId: t.linkedNoteId ?? null,
          dueDate: t.dueDate ?? null,
          priority: t.priority ?? null,
        };
      }
    }

    const db = getDb();
    const rows = await db
      .select()
      .from(schema.tasks)
      .where(accessFilter(schema.tasks, schema.taskShares))
      .orderBy(desc(schema.tasks.createdAt))
      .limit(50);

    screen.tasks = {
      total: rows.length,
      active: rows.filter((r) => r.completedAt === null).length,
      completed: rows.filter((r) => r.completedAt !== null).length,
      items: rows.map((r) => ({
        id: r.id,
        text: r.text,
        completed: r.completedAt !== null,
        dueDate: r.dueDate ?? null,
        priority: r.priority ?? null,
        linkedNoteId: r.linkedNoteId ?? null,
      })),
    };

    return screen;
  },
});
