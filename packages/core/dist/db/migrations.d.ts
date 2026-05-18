type NitroPluginDef = (nitroApp: any) => void | Promise<void>;
/**
 * True when an error from `ALTER TABLE ... ADD COLUMN` indicates the
 * column already existed. Recognizes both SQLite ("duplicate column
 * name") and Postgres ("column ... already exists" — exact text varies
 * by error code 42701, but the substring is stable). Exported so other
 * idempotent column-upgrade loops in the codebase don't reinvent this
 * regex with subtly different shapes.
 */
export declare function isDuplicateColumnError(err: unknown): boolean;
export interface RunMigrationsOptions {
    /**
     * Name of the migrations bookkeeping table. REQUIRED — there is intentionally
     * no default. Two templates that share a database (e.g. via the same Neon URL)
     * each have their own version space starting at v1, and a single shared
     * `_migrations` table will silently skip the second template's migrations if
     * the first has already advanced past those version numbers. This caused the
     * design template's migrations to be skipped entirely on a Neon DB that
     * slides had already populated up to v15 (PR #320 era).
     *
     * Use one bookkeeping table per template, e.g. `slides_migrations`. Core
     * feature plugins (e.g. the org module) follow the same convention with
     * their own prefix, e.g. `_org_migrations`.
     */
    table: string;
}
/**
 * A single migration entry.
 *
 * `sql` can be a string (runs on every dialect) or an object with dialect
 * keys for dialect-gated SQL. Useful when Postgres needs an ALTER that
 * SQLite can't parse.
 *
 *   { version: 14, sql: { postgres: "ALTER TABLE …" } }  // no-op on sqlite
 *   { version: 15, sql: { sqlite: "…", postgres: "…" } } // both dialects
 */
export type MigrationSql = string | {
    postgres?: string;
    sqlite?: string;
};
export interface MigrationEntry {
    version: number;
    sql: MigrationSql;
}
export declare function runMigrations(migrations: Array<MigrationEntry>, options: RunMigrationsOptions): NitroPluginDef;
export {};
//# sourceMappingURL=migrations.d.ts.map