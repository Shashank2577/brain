/**
 * Per-test SQLite + Drizzle setup for the <name> template.
 *
 * Boots an in-memory SQLite database, runs the same schema the production
 * `runMigrations` plugin runs (additive only — copied verbatim from
 * `server/plugins/db.ts`), and registers the `<name>-item` shareable resource
 * so `accessFilter`, `resolveAccess`, and `assertAccess` resolve correctly.
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

const ACTIVE_DB_KEY = "__<name>TestActiveDb__";
type DrizzleInstance = ReturnType<typeof drizzle>;
const globalStore: { [K in typeof ACTIVE_DB_KEY]?: DrizzleInstance } =
  globalThis as any;

let registered = false;

function applyMigrations(sqlite: Database.Database): void {
  sqlite.exec(`
    CREATE TABLE IF NOT EXISTS <name>_items (
      id TEXT PRIMARY KEY,
      title TEXT NOT NULL DEFAULT 'Untitled',
      body TEXT NOT NULL DEFAULT '',
      created_at TEXT NOT NULL DEFAULT (datetime('now')),
      updated_at TEXT NOT NULL DEFAULT (datetime('now')),
      owner_email TEXT NOT NULL DEFAULT 'local@localhost',
      org_id TEXT,
      visibility TEXT NOT NULL DEFAULT 'private'
    );
    CREATE TABLE IF NOT EXISTS <name>_item_shares (
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
      type: "<name>-item",
      resourceTable: schema.<name>Items,
      sharesTable: schema.<name>ItemShares,
      displayName: "<Name> Item",
      titleColumn: "title",
      getDb: () => getActiveTestDb(),
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

export function getActiveTestDb(): DrizzleInstance {
  const db = globalStore[ACTIVE_DB_KEY];
  if (!db) {
    throw new Error("setupTestDb() must be called before getActiveTestDb()");
  }
  return db;
}
