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

// Capability: <name>.create-item — viewer.
//
// Identity propagation: when another app calls this via ctx.call(...),
// ownerEmail is set from runWithRequestContext, never from the calling
// app id.
export default defineAction({
  description: "Create a new <name> item owned by the current user.",
  schema: z.object({
    id: z
      .string()
      .optional()
      .describe("Pre-generated id (optional, for optimistic UI)."),
    title: z.string().min(1).describe("Item title."),
    body: z.string().optional().describe("Item body."),
  }),
  run: async (args) => {
    const ownerEmail = getRequestUserEmail();
    if (!ownerEmail) {
      throw new Error("Unauthenticated — cannot create an item without a user");
    }
    const orgId = getRequestOrgId() ?? null;

    const id = args.id ?? nanoid();
    const nowIso = new Date().toISOString();
    const db = getDb();

    await db.insert(schema.<name>Items).values({
      id,
      title: args.title,
      body: args.body ?? "",
      createdAt: nowIso,
      updatedAt: nowIso,
      ownerEmail,
      orgId,
      visibility: "private",
    });

    await writeAppState("refresh-signal", { ts: Date.now() });

    return {
      id,
      title: args.title,
      body: args.body ?? "",
      createdAt: nowIso,
      updatedAt: nowIso,
      ownerEmail,
      urlPath: `/<name>/${id}`,
    };
  },
});
