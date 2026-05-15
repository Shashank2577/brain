import { defineAction } from "@agent-native/core";
import { z } from "zod";
import { getDb, schema } from "../server/db/index.js";
import {
  getRequestUserEmail,
  getRequestOrgId,
} from "@agent-native/core/server/request-context";

function nanoid(size = 12): string {
  const chars =
    "0123456789ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz";
  let id = "";
  const bytes = crypto.getRandomValues(new Uint8Array(size));
  for (const byte of bytes) id += chars[byte % chars.length];
  return id;
}

// Capability: <name>.run-task — viewer.
//
// Agent-tool service entry point. Records a task row for the calling
// user and returns a stub result. The ADR-001 "agentic service mini-app"
// pattern is: UI is minimal, the value lives in the capability surface.
// Other apps invoke this via `ctx.call("<name>.run-task", { ... })`.
export default defineAction({
  description:
    "Run an agent-tool task for the current user. Records the task and returns a stub result.",
  schema: z.object({
    input: z.string().min(1).describe("Task input string."),
    metadata: z.record(z.string(), z.unknown()).optional(),
  }),
  run: async (args) => {
    const ownerEmail = getRequestUserEmail();
    if (!ownerEmail) {
      throw new Error("Unauthenticated — cannot run a task without a user");
    }
    const orgId = getRequestOrgId() ?? null;
    const id = nanoid();
    const nowIso = new Date().toISOString();
    const db = getDb();

    await db.insert(schema.<name>Items).values({
      id,
      title: args.input,
      body: JSON.stringify(args.metadata ?? {}),
      createdAt: nowIso,
      updatedAt: nowIso,
      ownerEmail,
      orgId,
      visibility: "private",
    });

    return {
      id,
      input: args.input,
      status: "completed" as const,
      output: `<name> processed: ${args.input}`,
      ownerEmail,
      createdAt: nowIso,
    };
  },
});
