export type Dialect = "sqlite" | "postgres" | "d1";
export interface DbExec {
    execute(sql: string | {
        sql: string;
        args: any[];
    }): Promise<{
        rows: any[];
        rowsAffected: number;
    }>;
}
export interface DbExecConfig {
    url?: string;
    authToken?: string;
    d1Binding?: any;
}
/**
 * Resolve the database URL for the current app.
 *
 * Checks for `<APP_NAME>_DATABASE_URL` first (e.g. `MAIL_DATABASE_URL`),
 * then falls back to `DATABASE_URL`. This allows multiple apps to run in the
 * same process group (e.g. `dev:all` or builder.io) with separate databases.
 *
 * Set `APP_NAME=mail` in the child process env and
 * `MAIL_DATABASE_URL=postgres://...` in the shared env.
 */
export declare function getDatabaseUrl(fallback?: string): string;
/** Same per-app resolution for DATABASE_AUTH_TOKEN (used by Turso/libsql). */
export declare function getDatabaseAuthToken(): string | undefined;
export declare function isLocalSqliteUrl(url: string): boolean;
export declare function prepareLocalSqliteUrl(url: string): Promise<string>;
export declare function sqliteFilenameFromUrl(url: string): string;
/**
 * Parse a JSON-serialized column value defensively. A malformed row — from a
 * hand-edit, dirty migration, or a misbehaving agent that wrote raw SQL —
 * must not break an entire list endpoint. Callers supply a fallback for the
 * malformed path; null/undefined values also fall back.
 */
export declare function safeJsonParse<T>(value: unknown, fallback: T): T;
/**
 * Retry an async operation when it fails with SQLITE_BUSY.
 * Used during WAL initialization and migrations where a stale WAL from a
 * previous crash or HMR restart can briefly lock the database.
 */
export declare function retrySqliteBusy<T>(fn: () => Promise<T>, opts?: {
    maxAttempts?: number;
    baseDelayMs?: number;
    rethrow?: boolean;
}): Promise<T>;
/**
 * Retry a DDL statement (CREATE TABLE, CREATE INDEX) once when it fails due
 * to a Postgres pg_catalog race.
 *
 * Postgres's `IF NOT EXISTS` check is NOT atomic with the `pg_type` /
 * `pg_class` catalog insert. When multiple processes boot concurrently and
 * issue the same CREATE, both can pass the existence check and one fails
 * with code 23505 on `pg_type_typname_nsp_index` or similar. The table does
 * end up created by the winner, so rerunning the same `IF NOT EXISTS`
 * statement is a safe no-op.
 */
export declare function retryOnDdlRace<T>(fn: () => Promise<T>): Promise<T>;
/**
 * True when `e` is a UNIQUE / PRIMARY KEY constraint violation from any
 * supported driver (Postgres 23505, SQLite SQLITE_CONSTRAINT_PRIMARYKEY /
 * _UNIQUE, D1). Used by stores that accept caller-provided ids and want to
 * surface a clean "already exists" error instead of the raw SQL text.
 */
export declare function isUniqueViolation(e: any): boolean;
export declare function getDialect(): Dialect;
export declare function isPostgres(): boolean;
/**
 * Returns true when the database is a local-only SQLite file (or unset, which
 * defaults to a local SQLite file). Returns false for Postgres, remote libsql
 * (Turso), and D1 — any backend that could be shared across developers.
 *
 * Used to gate local@localhost mode: that mode uses a single shared virtual
 * user with no per-machine scoping, so on any shared database two developers
 * would read and write each other's settings, oauth tokens, and app state.
 */
export declare function isLocalDatabase(): boolean;
/** Returns BIGINT for Postgres (64-bit), INTEGER for SQLite (already 64-bit). */
export declare function intType(): string;
export declare function isConnectionError(err: any): boolean;
export declare function retryOnConnectionError<T>(fn: () => Promise<T>, maxAttempts?: number): Promise<T>;
export declare function createDbExec(config?: DbExecConfig): Promise<DbExec>;
/**
 * Get the singleton database client. Returns a `DbExec` whose first
 * `execute()` call lazily initializes the underlying driver.
 */
export declare function getDbExec(): DbExec;
/** Close the database connection (for scripts that need cleanup). */
export declare function closeDbExec(): Promise<void>;
//# sourceMappingURL=client.d.ts.map