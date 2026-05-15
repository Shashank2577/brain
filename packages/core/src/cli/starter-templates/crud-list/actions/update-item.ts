import { defineAction } from "@agent-native/core";
import { z } from "zod";
import { eq } from "drizzle-orm";
import { getDb, schema } from "../server/db/index.js";
import { assertAccess } from "@agent-native/core/sharing";
import { writeAppState } from "@agent-native/core/application-state";

// Capability: <name>.update-item — editor.
export default defineAction({
  description: "Update an item's title or body. Requires editor access.",
  schema: z.object({
    id: z.string().describe("Item id."),
    title: z.string().min(1).optional(),
    body: z.string().optional(),
  }),
  run: async (args) => {
    const access = await assertAccess("<name>-item", args.id, "editor");
    const existing = access.resource;

    const updates: Record<string, unknown> = {};
    let changed = false;
    if (args.title !== undefined && args.title !== existing.title) {
      updates.title = args.title;
      changed = true;
    }
    if (args.body !== undefined && args.body !== existing.body) {
      updates.body = args.body;
      changed = true;
    }

    const db = getDb();
    if (changed) {
      updates.updatedAt = new Date().toISOString();
      await db
        .update(schema.<name>Items)
        .set(updates)
        .where(eq(schema.<name>Items.id, args.id));
    }

    const [item] = await db
      .select()
      .from(schema.<name>Items)
      .where(eq(schema.<name>Items.id, args.id));

    await writeAppState("refresh-signal", { ts: Date.now() });

    return {
      id: item.id,
      title: item.title,
      body: item.body,
      createdAt: item.createdAt,
      updatedAt: item.updatedAt,
      ownerEmail: item.ownerEmail,
      visibility: item.visibility,
      accessRole: access.role,
    };
  },
});
