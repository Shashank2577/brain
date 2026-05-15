import { runMigrations } from "@agent-native/core/db";

/**
 * Tasks template migrations. Additive only — never DROP, never rename. The
 * workspace database is shared across deploy contexts and a destructive
 * statement would wipe live user rows.
 *
 * Bookkeeping table is `tasks_migrations` so it has its own version space (see
 * the runMigrations comment in `packages/core/src/db/migrations.ts`).
 */
export default runMigrations(
  [
    {
      version: 1,
      sql: `CREATE TABLE IF NOT EXISTS tasks_tasks (
    id TEXT PRIMARY KEY,
    text TEXT NOT NULL,
    linked_note_id TEXT,
    due_date TEXT,
    priority TEXT,
    completed_at TEXT,
    created_at TEXT NOT NULL,
    updated_at TEXT NOT NULL,
    owner_email TEXT NOT NULL DEFAULT 'local@localhost',
    org_id TEXT,
    visibility TEXT NOT NULL DEFAULT 'private'
  )`,
    },
    {
      version: 2,
      sql: {
        postgres: `CREATE TABLE IF NOT EXISTS tasks_shares (
  id TEXT PRIMARY KEY,
  resource_id TEXT NOT NULL,
  principal_type TEXT NOT NULL,
  principal_id TEXT NOT NULL,
  role TEXT NOT NULL DEFAULT 'viewer',
  created_by TEXT NOT NULL,
  created_at TEXT NOT NULL DEFAULT (now())
)`,
        sqlite: `CREATE TABLE IF NOT EXISTS tasks_shares (
  id TEXT PRIMARY KEY,
  resource_id TEXT NOT NULL,
  principal_type TEXT NOT NULL,
  principal_id TEXT NOT NULL,
  role TEXT NOT NULL DEFAULT 'viewer',
  created_by TEXT NOT NULL,
  created_at TEXT NOT NULL DEFAULT (datetime('now'))
)`,
      },
    },
  ],
  { table: "tasks_migrations" },
);
