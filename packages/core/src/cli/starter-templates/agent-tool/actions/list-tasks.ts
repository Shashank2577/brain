import { defineAction } from "@agent-native/core";
import { z } from "zod";
import { and, desc, type SQL } from "drizzle-orm";
import { getDb, schema } from "../server/db/index.js";
import { accessFilter } from "@agent-native/core/sharing";

// Capability: <name>.list-tasks — viewer.
//
// Returns previously recorded tasks the caller can see, scoped to the
// current viewer via accessFilter.
export default defineAction({
  description:
    "List previously-run <name> tasks for the current user (newest first).",
  schema: z.object({
    limit: z.coerce.number().int().positive().max(200).optional().default(50),
  }),
  http: { method: "GET" },
  run: async (args) => {
    const db = getDb();
    const clauses: SQL[] = [
      accessFilter(schema.<name>Items, schema.<name>ItemShares),
    ];

    const rows = await db
      .select()
      .from(schema.<name>Items)
      .where(and(...clauses))
      .orderBy(desc(schema.<name>Items.createdAt))
      .limit(args.limit);

    return {
      tasks: rows.map((row) => ({
        id: row.id,
        input: row.title,
        metadata: row.body,
        createdAt: row.createdAt,
        ownerEmail: row.ownerEmail,
      })),
    };
  },
});
