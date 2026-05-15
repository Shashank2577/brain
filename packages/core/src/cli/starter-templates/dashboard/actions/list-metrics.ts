import { defineAction } from "@agent-native/core";
import { z } from "zod";
import { and, type SQL } from "drizzle-orm";
import { getDb, schema } from "../server/db/index.js";
import { accessFilter } from "@agent-native/core/sharing";

// Capability: <name>.list-metrics — viewer.
//
// Read-only dashboard query. Surfaces a simple per-card metric. The
// dashboard starter ships sample seed data on first migration so a
// freshly scaffolded app actually shows something.
export default defineAction({
  description:
    "List metric cards for the <name> dashboard. Returns one card per metric with label, value, and trend.",
  schema: z.object({}),
  http: { method: "GET" },
  run: async () => {
    const db = getDb();
    const clauses: SQL[] = [
      accessFilter(schema.<name>Items, schema.<name>ItemShares),
    ];

    const rows = await db
      .select()
      .from(schema.<name>Items)
      .where(and(...clauses));

    return {
      metrics: rows.map((row) => ({
        id: row.id,
        label: row.title,
        value: row.body,
        updatedAt: row.updatedAt,
      })),
    };
  },
});
