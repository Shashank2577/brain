import { defineAction } from "@agent-native/core";
import { z } from "zod";
import { and, isNull, sql } from "drizzle-orm";
import { getDb, schema } from "../server/db/index.js";
import { accessFilter } from "@agent-native/core/sharing";

// Capability: notes.search-notes — viewer.
//
// Case-insensitive substring search across `title` and `body`. Returns
// snippets centered on the first match so the agent's Cmd+K lookup can
// preview the matching context.
export default defineAction({
  description:
    "Case-insensitive substring search across note titles and bodies. Returns snippets.",
  schema: z.object({
    q: z.string().min(1).describe("Search query."),
    limit: z.coerce.number().int().positive().max(50).optional().default(20),
  }),
  http: { method: "GET" },
  run: async (args) => {
    const db = getDb();
    const pattern = `%${escapeLike(args.q)}%`;

    const rows = await db
      .select({
        id: schema.notes.id,
        title: schema.notes.title,
        body: schema.notes.body,
        updatedAt: schema.notes.updatedAt,
      })
      .from(schema.notes)
      .where(
        and(
          accessFilter(schema.notes, schema.noteShares),
          isNull(schema.notes.archivedAt),
          sql`(LOWER(${schema.notes.title}) LIKE LOWER(${pattern}) ESCAPE '\\' OR LOWER(${schema.notes.body}) LIKE LOWER(${pattern}) ESCAPE '\\')`,
        ),
      )
      .orderBy(sql`${schema.notes.updatedAt} DESC`)
      .limit(args.limit);

    const lowerQ = args.q.toLowerCase();
    return {
      results: rows.map((r) => ({
        id: r.id,
        title: r.title,
        // Pick the field that actually contains the match so the snippet
        // shows useful context — fall back to body, then title.
        snippet: pickSnippet(r.title, r.body, args.q, lowerQ),
        updatedAt: r.updatedAt,
      })),
    };
  },
});

function pickSnippet(
  title: string,
  body: string,
  query: string,
  lowerQ: string,
): string {
  if (body && body.toLowerCase().includes(lowerQ)) {
    return makeSnippet(body, query);
  }
  if (title && title.toLowerCase().includes(lowerQ)) {
    return makeSnippet(title, query);
  }
  return makeSnippet(body || title, query);
}

function escapeLike(s: string): string {
  return s.replace(/([\\%_])/g, "\\$1");
}

function makeSnippet(content: string, query: string, radius = 80): string {
  const compact = content.replace(/\s+/g, " ").trim();
  if (!compact) return "";
  const index = compact.toLowerCase().indexOf(query.toLowerCase());
  if (index < 0) {
    return compact.length <= radius * 2
      ? compact
      : `${compact.slice(0, radius * 2).trimEnd()}...`;
  }
  const start = Math.max(0, index - radius);
  const end = Math.min(compact.length, index + query.length + radius);
  return `${start > 0 ? "..." : ""}${compact.slice(start, end).trim()}${
    end < compact.length ? "..." : ""
  }`;
}
