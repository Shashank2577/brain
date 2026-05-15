import { defineAction } from "@agent-native/core";
import { assertAccess } from "@agent-native/core/sharing";
import { eq } from "drizzle-orm";
import { z } from "zod";
import { getDb, schema } from "../server/db/index.js";

/**
 * Hard-delete a task. Does NOT delete the linked note — that's the user's
 * explicit cleanup (deleting one app's row shouldn't silently wipe another
 * app's data).
 */
export default defineAction({
  description:
    "Delete a task permanently. The linked note (if any) is NOT deleted.",
  schema: z.object({
    id: z.string().describe("Task id"),
  }),
  run: async (args) => {
    await assertAccess("task", args.id, "admin");

    const db = getDb();
    await db.delete(schema.tasks).where(eq(schema.tasks.id, args.id));

    return { id: args.id, deleted: true as const };
  },
});
