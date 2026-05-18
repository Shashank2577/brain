/**
 * Per-user and per-org data scoping for db-query / db-exec.
 *
 * In production mode, creates temporary views that shadow real tables so
 * that raw SQL only sees the current user's (and org's) data.
 *
 * Convention:
 *   - Template tables use an `owner_email` column for user scoping.
 *   - Template tables use an `org_id` column for org scoping.
 *   - Core tables have their own scoping patterns (key prefix, session_id, etc.).
 *   - When both columns are present, owner_email is always required; org_id
 *     narrows to the current org while preserving legacy/personal NULL rows.
 *
 * Temp views take precedence over real tables in both SQLite and Postgres,
 * so the user's SQL runs unmodified against the filtered views.
 */
export interface ScopingContext {
    /** SQL statements to run before the user's query (create temp views). */
    setup: string[];
    /** SQL statements to run after the user's query (drop temp views). */
    teardown: string[];
    /** Whether scoping is active. */
    active: boolean;
    /** The current user email (for INSERT injection in db-exec). */
    userEmail: string | null;
    /** The current org ID (for INSERT injection in db-exec). */
    orgId: string | null;
    /** Tables that have owner_email columns (for INSERT injection). */
    ownerEmailTables: Set<string>;
    /** Tables that have org_id columns (for INSERT injection). */
    orgIdTables: Set<string>;
    /** Table predicates applied by the scoping temp views. */
    tablePredicates: Map<string, string>;
}
/**
 * Build scoping context for a Postgres connection.
 * Returns setup/teardown SQL to run before/after the user's query.
 */
export declare function buildScopingPostgres(pgSql: any): Promise<ScopingContext>;
/**
 * Build scoping context for a SQLite/libsql connection.
 * Returns setup/teardown SQL to run before/after the user's query.
 */
export declare function buildScopingSqlite(client: any): Promise<ScopingContext>;
//# sourceMappingURL=scoping.d.ts.map