/**
 * Dialect-agnostic Drizzle schema helpers.
 *
 * Templates import `table`, `text`, `integer`, and `now` from here instead of
 * importing directly from `drizzle-orm/sqlite-core` or `drizzle-orm/pg-core`.
 * The correct dialect is chosen at runtime based on `DATABASE_URL`.
 *
 * Usage:
 *   import { table, text, integer, now } from "@agent-native/core/db/schema";
 *
 *   export const users = table("users", {
 *     id: text("id").primaryKey(),
 *     name: text("name").notNull(),
 *     active: integer("active", { mode: "boolean" }).notNull().default(true),
 *     createdAt: text("created_at").notNull().default(now()),
 *   });
 */
import { sqliteTable, text as sqliteText, integer as sqliteInteger, real as sqliteReal } from "drizzle-orm/sqlite-core";
/**
 * Define a table. Delegates to `pgTable` or `sqliteTable` based on dialect.
 */
export declare const table: typeof sqliteTable;
/**
 * Text column. Works identically in both dialects.
 * Supports `{ enum: [...] }` config in both.
 */
export declare const text: typeof sqliteText;
/**
 * Integer column.
 *
 * Handles `{ mode: "boolean" }` transparently — maps to Postgres `boolean`
 * type when running against Postgres, and SQLite `integer` with boolean
 * coercion when running against SQLite.
 */
export declare const integer: typeof sqliteInteger;
/**
 * Real/float column.
 *
 * Maps to `real` on SQLite and `double precision` on Postgres.
 * Use for decimal values like weight, macros, etc.
 */
export declare const real: typeof sqliteReal;
/**
 * Dialect-agnostic "current timestamp" SQL expression.
 * Use with `.default(now())` on text columns storing timestamps.
 *
 * - Postgres: `now()`
 * - SQLite:   `(datetime('now'))`
 */
export declare function now(): import("drizzle-orm").SQL<unknown>;
export { sql } from "drizzle-orm";
export { ownableColumns, createSharesTable, type Visibility, type ShareRole, type PrincipalType, } from "../sharing/schema.js";
//# sourceMappingURL=schema.d.ts.map