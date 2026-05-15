import {
  table,
  text,
  integer,
  now,
  ownableColumns,
  createSharesTable,
} from "@agent-native/core/db/schema";

// Notes — the canonical free-form text snippet store. The horizontal write
// target other apps (tasks, calendar, crm, mail) lean on when they need to
// persist a body of text owned by the calling user. Tagged with optional
// source pointers so `notes.list({ sourceApp, sourceType, sourceId })`
// can surface contact-scoped or event-scoped notes without a join table.
//
// All access goes through accessFilter(notes, noteShares) for reads and
// assertAccess("note", id, role) for writes — registered below.
export const notes = table("notes_notes", {
  id: text("id").primaryKey(),
  title: text("title").notNull().default("Untitled"),
  body: text("body").notNull().default(""),
  // Optional context pointers other apps can use to scope notes back to a
  // source record without forcing a separate join table. `null` for free notes.
  sourceApp: text("source_app"),
  sourceType: text("source_type"),
  sourceId: text("source_id"),
  pinned: integer("pinned").notNull().default(0),
  archivedAt: text("archived_at"),
  createdAt: text("created_at").notNull().default(now()),
  updatedAt: text("updated_at").notNull().default(now()),
  ...ownableColumns(),
});

export const noteShares = createSharesTable("notes_note_shares");
