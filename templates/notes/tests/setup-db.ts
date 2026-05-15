/**
 * Per-test SQLite + Drizzle setup for the notes template.
 *
 * Boots an in-memory SQLite database, runs the same schema the production
 * `runMigrations` plugin runs (additive only — copied verbatim from
 * `server/plugins/db.ts`), and registers the `note` shareable resource so
 * `accessFilter`, `resolveAccess`, and `assertAccess` resolve correctly.
 *
 * `_activeDb` is stashed on `globalThis` so all callers (the action's `vi.mock`
 * indirection, the sharing registry's `getDb` callback, and the in-test
 * assertions) read the same Drizzle instance — including across vitest
 * collection passes. Replacing the DB is cheap, so each `beforeEach` calls
 * `setupTestDb()` to install a fresh schema.
 */
import Database from "better-sqlite3";
import { drizzle } from "drizzle-orm/better-sqlite3";
import * as schema from "../server/db/schema.js";
import { registerShareableResource } from "@agent-native/core/sharing";

export interface TestDb {
  sqlite: Database.Database;
  db: ReturnType<typeof drizzle>;
  close: () => void;
}

const ACTIVE_DB_KEY = "__notesTestActiveDb__";
type DrizzleInstance = ReturnType<typeof drizzle>;
const globalStore: { [K in typeof ACTIVE_DB_KEY]?: DrizzleInstance } =
  globalThis as any;

let registered = false;

function applyMigrations(sqlite: Database.Database): void {
  sqlite.exec(`
    CREATE TABLE IF NOT EXISTS notes_notes (
      id TEXT PRIMARY KEY,
      title TEXT NOT NULL DEFAULT 'Untitled',
      body TEXT NOT NULL DEFAULT '',
      source_app TEXT,
      source_type TEXT,
      source_id TEXT,
      pinned INTEGER NOT NULL DEFAULT 0,
      archived_at TEXT,
      created_at TEXT NOT NULL DEFAULT (datetime('now')),
      updated_at TEXT NOT NULL DEFAULT (datetime('now')),
      owner_email TEXT NOT NULL DEFAULT 'local@localhost',
      org_id TEXT,
      visibility TEXT NOT NULL DEFAULT 'private'
    );
    CREATE TABLE IF NOT EXISTS notes_note_shares (
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

export function setupTestDb(): TestDb {
  const sqlite = new Database(":memory:");
  applyMigrations(sqlite);
  const db = drizzle(sqlite, { schema });
  globalStore[ACTIVE_DB_KEY] = db;

  if (!registered) {
    registerShareableResource({
      type: "note",
      resourceTable: schema.notes,
      sharesTable: schema.noteShares,
      displayName: "Note",
      titleColumn: "title",
      getDb: () => getActiveTestDb(),
    });
    registered = true;
  }

  return {
    sqlite,
    db,
    close: () => {
      // Detach the global reference before closing so any late-resolving
      // proxy doesn't hit a closed handle. The next setupTestDb() installs
      // a fresh DB regardless.
      if (globalStore[ACTIVE_DB_KEY] === db) {
        delete globalStore[ACTIVE_DB_KEY];
      }
      sqlite.close();
    },
  };
}

export function getActiveTestDb(): DrizzleInstance {
  const db = globalStore[ACTIVE_DB_KEY];
  if (!db) {
    throw new Error("setupTestDb() must be called before getActiveTestDb()");
  }
  return db;
}
