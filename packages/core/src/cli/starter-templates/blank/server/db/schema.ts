import {
  table,
  text,
  integer,
  now,
  ownableColumns,
  createSharesTable,
} from "@agent-native/core/db/schema";

// <Name> — blank starter scaffold.
//
// One generic "items" table per app. Every domain row is scoped per
// user/org via ownableColumns(); reads go through
// accessFilter(<name>Items, <name>ItemShares) and writes through
// assertAccess("<name>-item", id, role).
export const <name>Items = table("<name>_items", {
  id: text("id").primaryKey(),
  title: text("title").notNull().default("Untitled"),
  body: text("body").notNull().default(""),
  createdAt: text("created_at").notNull().default(now()),
  updatedAt: text("updated_at").notNull().default(now()),
  ...ownableColumns(),
});

export const <name>ItemShares = createSharesTable("<name>_item_shares");
