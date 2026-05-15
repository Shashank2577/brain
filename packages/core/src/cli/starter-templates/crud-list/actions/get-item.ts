import { defineAction } from "@agent-native/core";
import { z } from "zod";
import { resolveAccess } from "@agent-native/core/sharing";
import "../server/db/index.js";

// Capability: <name>.get-item — viewer.
export default defineAction({
  description:
    "Get a single <name> item by id with full body. Throws when not visible.",
  schema: z.object({
    id: z.string().describe("Item id."),
  }),
  http: { method: "GET" },
  run: async (args) => {
    const access = await resolveAccess("<name>-item", args.id);
    if (!access) {
      throw new Error(`Item "${args.id}" not found`);
    }
    const item = access.resource;
    return {
      id: item.id,
      title: item.title,
      body: item.body,
      createdAt: item.createdAt,
      updatedAt: item.updatedAt,
      ownerEmail: item.ownerEmail,
      visibility: item.visibility,
      accessRole: access.role,
      canEdit: access.role !== "viewer",
      urlPath: `/<name>/${item.id}`,
    };
  },
});
