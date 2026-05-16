/**
 * Shared SQLite fixture for the CRM mini-app.
 *
 * Boots an in-memory SQLite database with the production crm_* tables and
 * registers the shareable resources so `accessFilter` / `assertAccess`
 * resolve against the fixture's DB instance.
 */
import Database from "better-sqlite3";
import { drizzle } from "drizzle-orm/better-sqlite3";
import { registerShareableResource } from "@agent-native/core/sharing";
import * as schema from "../../../templates/crm/server/db/schema";

export interface CrmFixture {
  sqlite: Database.Database;
  db: ReturnType<typeof drizzle>;
  close: () => void;
}

const ACTIVE_DB_KEY = "__phase7CrmFixtureDb__";
type DrizzleInstance = ReturnType<typeof drizzle>;
const globalStore: { [K in typeof ACTIVE_DB_KEY]?: DrizzleInstance } =
  globalThis as never;

let registered = false;

function applyMigrations(sqlite: Database.Database): void {
  sqlite.exec(`
    CREATE TABLE IF NOT EXISTS crm_contacts (
      id TEXT PRIMARY KEY,
      name TEXT NOT NULL,
      email TEXT NOT NULL,
      company TEXT,
      phone TEXT,
      notes TEXT,
      created_at TEXT NOT NULL DEFAULT (datetime('now')),
      updated_at TEXT NOT NULL DEFAULT (datetime('now')),
      deleted_at TEXT,
      owner_email TEXT NOT NULL DEFAULT 'local@localhost',
      org_id TEXT,
      visibility TEXT NOT NULL DEFAULT 'private'
    );
    CREATE TABLE IF NOT EXISTS crm_contact_shares (
      id TEXT PRIMARY KEY,
      resource_id TEXT NOT NULL,
      principal_type TEXT NOT NULL,
      principal_id TEXT NOT NULL,
      role TEXT NOT NULL DEFAULT 'viewer',
      created_by TEXT NOT NULL,
      created_at TEXT NOT NULL DEFAULT (datetime('now'))
    );
    CREATE TABLE IF NOT EXISTS crm_deals (
      id TEXT PRIMARY KEY,
      contact_id TEXT NOT NULL,
      title TEXT NOT NULL,
      amount INTEGER NOT NULL DEFAULT 0,
      stage TEXT NOT NULL DEFAULT 'lead',
      close_date TEXT,
      created_at TEXT NOT NULL DEFAULT (datetime('now')),
      updated_at TEXT NOT NULL DEFAULT (datetime('now')),
      deleted_at TEXT,
      owner_email TEXT NOT NULL DEFAULT 'local@localhost',
      org_id TEXT,
      visibility TEXT NOT NULL DEFAULT 'private'
    );
    CREATE TABLE IF NOT EXISTS crm_deal_shares (
      id TEXT PRIMARY KEY,
      resource_id TEXT NOT NULL,
      principal_type TEXT NOT NULL,
      principal_id TEXT NOT NULL,
      role TEXT NOT NULL DEFAULT 'viewer',
      created_by TEXT NOT NULL,
      created_at TEXT NOT NULL DEFAULT (datetime('now'))
    );
    CREATE TABLE IF NOT EXISTS crm_activities (
      id TEXT PRIMARY KEY,
      contact_id TEXT NOT NULL,
      deal_id TEXT,
      kind TEXT NOT NULL,
      summary TEXT NOT NULL,
      ref_message_id TEXT,
      ref_event_id TEXT,
      ref_note_id TEXT,
      at TEXT NOT NULL,
      deleted_at TEXT,
      owner_email TEXT NOT NULL DEFAULT 'local@localhost',
      org_id TEXT,
      visibility TEXT NOT NULL DEFAULT 'private'
    );
    CREATE TABLE IF NOT EXISTS crm_activity_shares (
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

export function setupCrmFixture(): CrmFixture {
  const sqlite = new Database(":memory:");
  applyMigrations(sqlite);
  const db = drizzle(sqlite, { schema });
  globalStore[ACTIVE_DB_KEY] = db;

  if (!registered) {
    registerShareableResource({
      type: "contact",
      resourceTable: schema.contacts,
      sharesTable: schema.contactShares,
      displayName: "Contact",
      titleColumn: "name",
      getDb: () => getActiveCrmDb(),
    });
    registerShareableResource({
      type: "deal",
      resourceTable: schema.deals,
      sharesTable: schema.dealShares,
      displayName: "Deal",
      titleColumn: "title",
      getDb: () => getActiveCrmDb(),
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

export function getActiveCrmDb(): DrizzleInstance {
  const db = globalStore[ACTIVE_DB_KEY];
  if (!db) {
    throw new Error(
      "setupCrmFixture() must be called before getActiveCrmDb()",
    );
  }
  return db;
}

export { schema };
