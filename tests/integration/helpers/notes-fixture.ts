/**
 * Shared SQLite fixture for the Notes mini-app.
 *
 * Each test boots an in-memory SQLite database, replays the migration shape
 * declared by `templates/notes/server/plugins/db.ts`, and registers the
 * `note` shareable resource so `accessFilter` / `assertAccess` resolve
 * against the fixture's database.
 *
 * The fixture is exported through a `globalThis` registry so the action's
 * `vi.mock` for `server/db/index.js` and the framework's `getDb` callback
 * both resolve to the same Drizzle instance for the test's lifetime.
 */
import Database from "better-sqlite3";
import { drizzle } from "drizzle-orm/better-sqlite3";
import { registerShareableResource } from "@agent-native/core/sharing";
import * as schema from "../../../templates/notes/server/db/schema";

export interface NotesFixture {
  sqlite: Database.Database;
  db: ReturnType<typeof drizzle>;
  close: () => void;
}

const ACTIVE_DB_KEY = "__phase7NotesFixtureDb__";
type DrizzleInstance = ReturnType<typeof drizzle>;
const globalStore: { [K in typeof ACTIVE_DB_KEY]?: DrizzleInstance } =
  globalThis as never;

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

export function setupNotesFixture(): NotesFixture {
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
      getDb: () => getActiveNotesDb(),
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

export function getActiveNotesDb(): DrizzleInstance {
  const db = globalStore[ACTIVE_DB_KEY];
  if (!db) {
    throw new Error(
      "setupNotesFixture() must be called before getActiveNotesDb()",
    );
  }
  return db;
}

export { schema };
