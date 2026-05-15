import { runMigrations } from "@agent-native/core/db";
import { registerEvent } from "@agent-native/core/event-bus";
import { z } from "zod";
// Side-effect import — registers crm-contact / crm-deal / crm-activity as
// shareable resources with the framework before any HTTP request runs.
import "../db/index.js";

const migrations = runMigrations(
  [
    // ---------------------------------------------------------------------------
    // Contacts
    // ---------------------------------------------------------------------------
    {
      version: 1,
      sql: `CREATE TABLE IF NOT EXISTS crm_contacts (
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
    )`,
    },
    {
      version: 2,
      sql: `CREATE TABLE IF NOT EXISTS crm_contact_shares (
      id TEXT PRIMARY KEY,
      resource_id TEXT NOT NULL,
      principal_type TEXT NOT NULL,
      principal_id TEXT NOT NULL,
      role TEXT NOT NULL DEFAULT 'viewer',
      created_by TEXT NOT NULL,
      created_at TEXT NOT NULL DEFAULT (datetime('now'))
    )`,
    },
    // ---------------------------------------------------------------------------
    // Deals
    // ---------------------------------------------------------------------------
    {
      version: 3,
      sql: `CREATE TABLE IF NOT EXISTS crm_deals (
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
    )`,
    },
    {
      version: 4,
      sql: `CREATE TABLE IF NOT EXISTS crm_deal_shares (
      id TEXT PRIMARY KEY,
      resource_id TEXT NOT NULL,
      principal_type TEXT NOT NULL,
      principal_id TEXT NOT NULL,
      role TEXT NOT NULL DEFAULT 'viewer',
      created_by TEXT NOT NULL,
      created_at TEXT NOT NULL DEFAULT (datetime('now'))
    )`,
    },
    // ---------------------------------------------------------------------------
    // Activities — the audit log. ref* columns are intentionally NOT
    // foreign keys; they reference rows owned by other apps.
    // ---------------------------------------------------------------------------
    {
      version: 5,
      sql: `CREATE TABLE IF NOT EXISTS crm_activities (
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
    )`,
    },
    {
      version: 6,
      sql: `CREATE TABLE IF NOT EXISTS crm_activity_shares (
      id TEXT PRIMARY KEY,
      resource_id TEXT NOT NULL,
      principal_type TEXT NOT NULL,
      principal_id TEXT NOT NULL,
      role TEXT NOT NULL DEFAULT 'viewer',
      created_by TEXT NOT NULL,
      created_at TEXT NOT NULL DEFAULT (datetime('now'))
    )`,
    },
  ],
  { table: "_crm_migrations" },
);

export default async (nitroApp: any): Promise<void> => {
  await migrations(nitroApp);

  // ---------------------------------------------------------------------------
  // Register CRM events for the automations system.
  // ---------------------------------------------------------------------------
  registerEvent({
    name: "crm.contact.created",
    description: "A new CRM contact was created.",
    payloadSchema: z.object({
      contactId: z.string(),
      name: z.string(),
      email: z.string(),
    }) as any,
  });

  registerEvent({
    name: "crm.deal.stage.changed",
    description: "A deal's stage changed.",
    payloadSchema: z.object({
      dealId: z.string(),
      contactId: z.string(),
      from: z.string(),
      to: z.string(),
    }) as any,
  });

  registerEvent({
    name: "crm.outreach.logged",
    description: "An email outreach was sent and logged on a contact.",
    payloadSchema: z.object({
      activityId: z.string(),
      contactId: z.string(),
      messageId: z.string(),
    }) as any,
  });

  registerEvent({
    name: "crm.meeting.scheduled",
    description: "A meeting was scheduled with a contact.",
    payloadSchema: z.object({
      activityId: z.string(),
      contactId: z.string(),
      eventId: z.string(),
    }) as any,
  });
};
