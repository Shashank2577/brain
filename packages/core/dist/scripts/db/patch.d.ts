/**
 * Core script: db-patch
 *
 * Surgical search-and-replace on a text column in any SQL table. Instead of
 * re-sending the full column value (as `db-exec UPDATE` would require), the
 * agent sends one or more `{find, replace}` pairs. The script reads the row,
 * applies the edits in memory, and writes the result back in a single UPDATE.
 *
 * ## When to use which tool
 *
 *   Large text field, small slice to change       → db-patch (this)
 *     e.g. fix one paragraph in a 50KB document, tweak one key in a dashboard
 *     JSON blob, rename a label in a slide HTML string.
 *
 *   Short field, set outright                     → db-exec UPDATE
 *     e.g. `UPDATE forms SET status = 'published' WHERE id = '...'`.
 *
 *   Multiple columns / computed values            → db-exec UPDATE
 *     e.g. `UPDATE meals SET calories = calories + 50, ...`.
 *
 *   Domain-specific action exists                 → use that action
 *     e.g. `edit-document` or `update-slide` — they also push live Yjs
 *     updates to any open collaborative editor. db-patch is the generic
 *     fallback for tables without a bespoke action.
 *
 * ## Why it's faster
 *
 *   The agent only has to transmit the diff (the `find` + `replace`
 *   strings), not the full new value. For large text fields — multi-kilobyte
 *   markdown documents, slide HTML, dashboard/form JSON — this dramatically
 *   reduces tokens per edit and keeps concurrent edits composable.
 *
 * ## Security
 *
 *   In production mode, the same per-user / per-org temp view scoping that
 *   `db-exec` uses applies here: the SELECT and UPDATE both go through the
 *   scoped view, so you can never read or write rows outside the current
 *   user's data. The WHERE clause is validated against a keyword denylist
 *   (no ;, no chained statements, no DDL).
 *
 * ## Usage
 *
 *   pnpm action db-patch --table <t> --column <c> --where "<clause>" \
 *     --find "old" --replace "new"
 *
 *   pnpm action db-patch --table decks --column data --where "id='d1'" \
 *     --edits '[{"find":"Q3","replace":"Q4"},{"find":"$1M","replace":"$1.2M"}]'
 */
export default function dbPatch(args: string[]): Promise<void>;
//# sourceMappingURL=patch.d.ts.map