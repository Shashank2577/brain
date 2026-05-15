import { defineAction } from "@agent-native/core";
import { z } from "zod";
import { and, desc, type SQL } from "drizzle-orm";
import { getDb, schema } from "../server/db/index.js";
import { accessFilter } from "@agent-native/core/sharing";

// Capability: <name>.list-items — viewer.
export default defineAction({
  description:
    "List <name> items the current user can see (paginated, newest first).",
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
      .orderBy(desc(schema.<name>Items.updatedAt))
      .limit(args.limit);

    return {
      items: rows.map((row) => ({
        id: row.id,
        title: row.title,
        body: row.body,
        createdAt: row.createdAt,
        updatedAt: row.updatedAt,
        ownerEmail: row.ownerEmail,
      })),
    };
  },
});
