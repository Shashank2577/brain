import { defineAction } from "@agent-native/core";
import { z } from "zod";
import { getDb, schema } from "../server/db/index.js";
import {
  getRequestUserEmail,
  getRequestOrgId,
} from "@agent-native/core/server/request-context";
import { writeAppState } from "@agent-native/core/application-state";

function nanoid(size = 12): string {
  const chars =
    "0123456789ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz";
  let id = "";
  const bytes = crypto.getRandomValues(new Uint8Array(size));
  for (const byte of bytes) id += chars[byte % chars.length];
  return id;
}

// Capability: notes.create-note — viewer.
//
// **OS invariant.** When tasks/calendar/crm calls this via
// `ctx.call("notes.create-note", ...)` the resulting row's `ownerEmail`
// MUST be the originating user's email, NEVER the calling app's id. We
// read identity from `getRequestUserEmail()` (the ALS scope set up by
// `runWithRequestContext` in the dispatch capability-registry RPC
// handler), so the propagation is automatic — the calling app cannot
// override it. Tested by
// `tests/integration/identity-propagation.spec.ts`.
export default defineAction({
  description:
    "Create a new note owned by the current user. Returns the created note.",
  schema: z.object({
    id: z
      .string()
      .optional()
      .describe("Pre-generated note id (for optimistic UI)."),
    title: z.string().min(1).describe("Note title."),
    body: z.string().optional().describe("Markdown body."),
    sourceApp: z
      .string()
      .optional()
      .describe("Originating app id (e.g. 'tasks', 'calendar', 'crm')."),
    sourceType: z
      .string()
      .optional()
      .describe("Source record type (e.g. 'task', 'event', 'contact')."),
    sourceId: z.string().optional().describe("Source record id."),
    pinned: z.boolean().optional().describe("Pin to the top of the list."),
  }),
  run: async (args) => {
    const ownerEmail = getRequestUserEmail();
    if (!ownerEmail) {
      throw new Error("Unauthenticated — cannot create a note without a user");
    }
    const orgId = getRequestOrgId() ?? null;

    const id = args.id ?? nanoid();
    const nowIso = new Date().toISOString();
    const db = getDb();

    await db.insert(schema.notes).values({
      id,
      title: args.title,
      body: args.body ?? "",
      sourceApp: args.sourceApp ?? null,
      sourceType: args.sourceType ?? null,
      sourceId: args.sourceId ?? null,
      pinned: args.pinned ? 1 : 0,
      archivedAt: null,
      createdAt: nowIso,
      updatedAt: nowIso,
      ownerEmail,
      orgId,
      visibility: "private",
    });

    // Trigger UI refresh on the polling sync channel.
    await writeAppState("refresh-signal", { ts: Date.now() });

    return {
      id,
      title: args.title,
      body: args.body ?? "",
      sourceApp: args.sourceApp ?? null,
      sourceType: args.sourceType ?? null,
      sourceId: args.sourceId ?? null,
      pinned: Boolean(args.pinned),
      createdAt: nowIso,
      updatedAt: nowIso,
      ownerEmail,
      urlPath: `/notes/${id}`,
    };
  },
});
