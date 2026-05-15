import { defineAction } from "@agent-native/core";
import { z } from "zod";
import { eq } from "drizzle-orm";
import { getDb, schema } from "../server/db/index.js";
import { assertAccess } from "@agent-native/core/sharing";
import { writeAppState } from "@agent-native/core/application-state";

// Capability: notes.update-note — editor.
//
// Partial update of title, body, pinned, or source pointers. Gated by
// `assertAccess("note", id, "editor")` so a viewer-share or unrelated
// caller is rejected with ForbiddenError.
export default defineAction({
  description:
    "Update a note's title, body, pinned status, or source pointers. Requires editor access.",
  schema: z.object({
    id: z.string().describe("Note id."),
    title: z.string().min(1).optional(),
    body: z.string().optional(),
    pinned: z.boolean().optional(),
    sourceApp: z.string().nullable().optional(),
    sourceType: z.string().nullable().optional(),
    sourceId: z.string().nullable().optional(),
  }),
  run: async (args) => {
    const access = await assertAccess("note", args.id, "editor");
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
    if (
      args.pinned !== undefined &&
      Number(Boolean(args.pinned)) !== (existing.pinned ?? 0)
    ) {
      updates.pinned = args.pinned ? 1 : 0;
      changed = true;
    }
    if (
      args.sourceApp !== undefined &&
      args.sourceApp !== existing.sourceApp
    ) {
      updates.sourceApp = args.sourceApp;
      changed = true;
    }
    if (
      args.sourceType !== undefined &&
      args.sourceType !== existing.sourceType
    ) {
      updates.sourceType = args.sourceType;
      changed = true;
    }
    if (
      args.sourceId !== undefined &&
      args.sourceId !== existing.sourceId
    ) {
      updates.sourceId = args.sourceId;
      changed = true;
    }

    const db = getDb();
    if (changed) {
      updates.updatedAt = new Date().toISOString();
      await db
        .update(schema.notes)
        .set(updates)
        .where(eq(schema.notes.id, args.id));
    }

    const [n] = await db
      .select()
      .from(schema.notes)
      .where(eq(schema.notes.id, args.id));

    await writeAppState("refresh-signal", { ts: Date.now() });

    return {
      id: n.id,
      title: n.title,
      body: n.body,
      sourceApp: n.sourceApp,
      sourceType: n.sourceType,
      sourceId: n.sourceId,
      pinned: Boolean(n.pinned),
      archivedAt: n.archivedAt,
      createdAt: n.createdAt,
      updatedAt: n.updatedAt,
      ownerEmail: n.ownerEmail,
      visibility: n.visibility,
      accessRole: access.role,
    };
  },
});
