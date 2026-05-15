import {
  table,
  text,
  ownableColumns,
  createSharesTable,
} from "@agent-native/core/db/schema";

/**
 * Tasks — lightweight todo rows.
 *
 * Namespace prefix `tasks_` keeps these tables isolated from any other template
 * sharing the workspace DB. `tasks_tasks` is the canonical row table;
 * `tasks_shares` is the companion shares table created by
 * `createSharesTable()`.
 */
export const tasks = table("tasks_tasks", {
  id: text("id").primaryKey(),
  text: text("text").notNull(),
  // Nullable FK to a note row in the notes template. We never enforce this at
  // the DB level — different templates own their own tables and the notes app
  // may not be installed in every workspace.
  linkedNoteId: text("linked_note_id"),
  // ISO-8601 date or datetime as text — portable across SQLite / Postgres /
  // Turso. NULL means "no due date".
  dueDate: text("due_date"),
  // Coarse priority bucket. NULL means "unset / normal".
  priority: text("priority", {
    enum: ["low", "normal", "high", "urgent"],
  }),
  // ISO timestamp when completed; NULL while active. Drives the
  // active/completed filter and records event timing without an audit table.
  completedAt: text("completed_at"),
  createdAt: text("created_at").notNull(),
  updatedAt: text("updated_at").notNull(),
  ...ownableColumns(),
});

export const taskShares = createSharesTable("tasks_shares");
