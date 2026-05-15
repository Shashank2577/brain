import {
  table,
  text,
  integer,
  now,
  ownableColumns,
  createSharesTable,
} from "@agent-native/core/db/schema";

// -----------------------------------------------------------------------------
// Contacts — the core CRM entity. Each contact has a name + email and lives
// inside the per-user/org scoping rules from ownableColumns().
// -----------------------------------------------------------------------------

export const contacts = table("crm_contacts", {
  id: text("id").primaryKey(),
  name: text("name").notNull(),
  email: text("email").notNull(),
  company: text("company"),
  phone: text("phone"),
  // Free-text inline summary; long-form lives in the notes app via
  // crm.log-note -> notes.create which stamps refNoteId on the activity row.
  notes: text("notes"),
  createdAt: text("created_at").notNull().default(now()),
  updatedAt: text("updated_at").notNull().default(now()),
  // ISO timestamp when soft-deleted, NULL while live. Soft delete keeps the
  // activity log + downstream refs (mail/calendar/notes) reachable even after
  // the user removes the CRM contact. See cross-app-cleanup test.
  deletedAt: text("deleted_at"),
  ...ownableColumns(),
});

export const contactShares = createSharesTable("crm_contact_shares");

// -----------------------------------------------------------------------------
// Deals — pipeline stage + amount, attached to a contact.
// -----------------------------------------------------------------------------

export const deals = table("crm_deals", {
  id: text("id").primaryKey(),
  contactId: text("contact_id").notNull(),
  title: text("title").notNull(),
  // Amount in cents — keeps math integer for revenue rollups.
  amount: integer("amount").notNull().default(0),
  stage: text("stage", {
    enum: ["lead", "qualified", "proposal", "won", "lost"],
  })
    .notNull()
    .default("lead"),
  closeDate: text("close_date"),
  createdAt: text("created_at").notNull().default(now()),
  updatedAt: text("updated_at").notNull().default(now()),
  deletedAt: text("deleted_at"),
  ...ownableColumns(),
});

export const dealShares = createSharesTable("crm_deal_shares");

// -----------------------------------------------------------------------------
// Activities — the canonical audit log. Every cross-app capability writes
// exactly one row here and stamps the foreign reference id (messageId /
// eventId / noteId) onto the appropriate `ref*` column so the timeline stays
// authoritative.
//
// `ref*` columns are deliberately NOT declared as DB foreign keys — the
// underlying mail/calendar/notes apps own those rows and their lifecycle.
// Deleting a CRM contact must not cascade across apps. See
// cross-app-cleanup.spec.ts.
// -----------------------------------------------------------------------------

export const activities = table("crm_activities", {
  id: text("id").primaryKey(),
  contactId: text("contact_id").notNull(),
  // Optional — an activity may be attached to a contact only (no deal).
  dealId: text("deal_id"),
  kind: text("kind", { enum: ["email", "meeting", "note", "call"] }).notNull(),
  summary: text("summary").notNull(),
  refMessageId: text("ref_message_id"),
  refEventId: text("ref_event_id"),
  refNoteId: text("ref_note_id"),
  at: text("at").notNull(),
  deletedAt: text("deleted_at"),
  ...ownableColumns(),
});

export const activityShares = createSharesTable("crm_activity_shares");
