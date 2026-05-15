import { defineAction } from "@agent-native/core";
import { z } from "zod";
import { resolveAccess } from "@agent-native/core/sharing";
import "../server/db/index.js";

// Capability: notes.get-note — viewer.
//
// Resolves access via `resolveAccess("note", id)`. Returns 404-shaped null
// when the note is not visible to the caller, including when the row
// exists but the caller has no share grant or org/public visibility.
export default defineAction({
  description:
    "Get a single note by id with full body. Returns null when the note is not visible to the caller.",
  schema: z.object({
    id: z.string().describe("Note id."),
  }),
  http: { method: "GET" },
  run: async (args) => {
    const access = await resolveAccess("note", args.id);
    if (!access) {
      throw new Error(`Note "${args.id}" not found`);
    }

    const n = access.resource;
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
      canEdit: access.role !== "viewer",
      canManage: access.role === "owner" || access.role === "admin",
      urlPath: `/notes/${n.id}`,
    };
  },
});
