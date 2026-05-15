import { defineAction } from "@agent-native/core";
import { z } from "zod";
import { and, desc, eq, isNull, isNotNull, type SQL } from "drizzle-orm";
import { getDb, schema } from "../server/db/index.js";
import { accessFilter } from "@agent-native/core/sharing";

// Capability: notes.list-notes — viewer.
//
// Returns notes the current user can see (own + shared + org/public per
// visibility). Excludes archived by default. Filters are exact-match on the
// optional source pointer columns so callers like
// `crm.list-contacts` can pull contact-scoped notes inline via
// `notes.list-notes({ sourceApp: "crm", sourceType: "contact", sourceId })`.
export default defineAction({
  description:
    "List notes the current user can see. Excludes archived by default; pass archived:true to include them.",
  schema: z.object({
    sourceApp: z.string().optional(),
    sourceType: z.string().optional(),
    sourceId: z.string().optional(),
    pinned: z.boolean().optional(),
    archived: z.boolean().optional().default(false),
    limit: z.coerce.number().int().positive().max(200).optional().default(50),
  }),
  http: { method: "GET" },
  run: async (args) => {
    const db = getDb();
    const clauses: SQL[] = [accessFilter(schema.notes, schema.noteShares)];

    if (args.archived === true) {
      clauses.push(isNotNull(schema.notes.archivedAt));
    } else {
      clauses.push(isNull(schema.notes.archivedAt));
    }
    if (args.sourceApp) {
      clauses.push(eq(schema.notes.sourceApp, args.sourceApp));
    }
    if (args.sourceType) {
      clauses.push(eq(schema.notes.sourceType, args.sourceType));
    }
    if (args.sourceId) {
      clauses.push(eq(schema.notes.sourceId, args.sourceId));
    }
    if (args.pinned === true) {
      clauses.push(eq(schema.notes.pinned, 1));
    } else if (args.pinned === false) {
      clauses.push(eq(schema.notes.pinned, 0));
    }

    const rows = await db
      .select()
      .from(schema.notes)
      .where(and(...clauses))
      .orderBy(desc(schema.notes.pinned), desc(schema.notes.updatedAt))
      .limit(args.limit);

    return {
      notes: rows.map((n) => ({
        id: n.id,
        title: n.title,
        // List view returns a snippet of the body, not the full content.
        snippet: makeSnippet(n.body),
        sourceApp: n.sourceApp,
        sourceType: n.sourceType,
        sourceId: n.sourceId,
        pinned: Boolean(n.pinned),
        archivedAt: n.archivedAt,
        createdAt: n.createdAt,
        updatedAt: n.updatedAt,
        ownerEmail: n.ownerEmail,
      })),
    };
  },
});

function makeSnippet(body: string, maxLength = 180): string {
  const compact = body.replace(/\s+/g, " ").trim();
  if (compact.length <= maxLength) return compact;
  return `${compact.slice(0, maxLength).trimEnd()}...`;
}
