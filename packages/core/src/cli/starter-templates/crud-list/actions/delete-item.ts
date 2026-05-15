import { defineAction } from "@agent-native/core";
import { z } from "zod";
import { eq } from "drizzle-orm";
import { getDb, schema } from "../server/db/index.js";
import { assertAccess } from "@agent-native/core/sharing";
import { writeAppState } from "@agent-native/core/application-state";

// Capability: <name>.delete-item — admin.
export default defineAction({
  description: "Hard-delete an item and its share grants. Requires admin role.",
  schema: z.object({
    id: z.string().describe("Item id."),
  }),
  run: async (args) => {
    await assertAccess("<name>-item", args.id, "admin");
    const db = getDb();

    await db
      .delete(schema.<name>ItemShares)
      .where(eq(schema.<name>ItemShares.resourceId, args.id));
    await db
      .delete(schema.<name>Items)
      .where(eq(schema.<name>Items.id, args.id));

    await writeAppState("refresh-signal", { ts: Date.now() });

    return { id: args.id, deleted: true as const };
  },
});
