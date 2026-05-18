import { type Config } from "drizzle-kit";
export interface CreateDrizzleConfigOptions {
    /** Path to the Drizzle schema file. Defaults to `./server/db/schema.ts`. */
    schema?: string;
    /** Output directory for generated migrations. Defaults to `./server/db/migrations`. */
    out?: string;
    /**
     * Local SQLite file path used when `DATABASE_URL` is unset or points at SQLite.
     * Defaults to `./data/app.db`.
     */
    sqliteFile?: string;
}
/**
 * Create a dialect-detecting drizzle-kit config.
 *
 * Inspects `process.env.DATABASE_URL` and picks the right `dialect` +
 * `dbCredentials` for Postgres (Neon/Supabase), Turso/libsql, or local SQLite.
 * Falls back to `file:./data/app.db` when `DATABASE_URL` is unset so local dev
 * keeps working.
 *
 * Additionally refuses to run when invoked via `drizzle-kit push` against a
 * Neon DATABASE_URL — that invocation pattern dropped framework tables in
 * production on 2026-04-21 (see PR #252). Set `ALLOW_DRIZZLE_PUSH_ON_NEON=1`
 * to override (never do this in CI).
 *
 * Usage:
 * ```ts
 * import { createDrizzleConfig } from "@agent-native/core/db/drizzle-config";
 * export default createDrizzleConfig();
 * ```
 */
export declare function createDrizzleConfig(opts?: CreateDrizzleConfigOptions): Config;
//# sourceMappingURL=drizzle-config.d.ts.map