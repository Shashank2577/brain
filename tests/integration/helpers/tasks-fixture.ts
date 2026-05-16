/**
 * Shared SQLite fixture for the Tasks mini-app.
 *
 * Mirrors the notes fixture pattern: in-memory SQLite + production
 * migration shape + `registerShareableResource` registration so the
 * action's `accessFilter` / `assertAccess` calls resolve against the
 * fixture's DB instance.
 */
import Database from "better-sqlite3";
import { drizzle } from "drizzle-orm/better-sqlite3";
import { registerShareableResource } from "@agent-native/core/sharing";
import * as schema from "../../../templates/tasks/server/db/schema";

export interface TasksFixture {
  sqlite: Database.Database;
  db: ReturnType<typeof drizzle>;
  close: () => void;
}

const ACTIVE_DB_KEY = "__phase7TasksFixtureDb__";
type DrizzleInstance = ReturnType<typeof drizzle>;
const globalStore: { [K in typeof ACTIVE_DB_KEY]?: DrizzleInstance } =
  globalThis as never;

let registered = false;

function applyMigrations(sqlite: Database.Database): void {
  sqlite.exec(`
    CREATE TABLE IF NOT EXISTS tasks_tasks (
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
    );
    CREATE TABLE IF NOT EXISTS tasks_shares (
      id TEXT PRIMARY KEY,
      resource_id TEXT NOT NULL,
      principal_type TEXT NOT NULL,
      principal_id TEXT NOT NULL,
      role TEXT NOT NULL DEFAULT 'viewer',
      created_by TEXT NOT NULL,
      created_at TEXT NOT NULL DEFAULT (datetime('now'))
    );
  `);
}

export function setupTasksFixture(): TasksFixture {
  const sqlite = new Database(":memory:");
  applyMigrations(sqlite);
  const db = drizzle(sqlite, { schema });
  globalStore[ACTIVE_DB_KEY] = db;

  if (!registered) {
    registerShareableResource({
      type: "task",
      resourceTable: schema.tasks,
      sharesTable: schema.taskShares,
      displayName: "Task",
      titleColumn: "text",
      getDb: () => getActiveTasksDb(),
    });
    registered = true;
  }

  return {
    sqlite,
    db,
    close: () => {
      if (globalStore[ACTIVE_DB_KEY] === db) {
        delete globalStore[ACTIVE_DB_KEY];
      }
      sqlite.close();
    },
  };
}

export function getActiveTasksDb(): DrizzleInstance {
  const db = globalStore[ACTIVE_DB_KEY];
  if (!db) {
    throw new Error(
      "setupTasksFixture() must be called before getActiveTasksDb()",
    );
  }
  return db;
}

export { schema };
