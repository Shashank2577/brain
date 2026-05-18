import Database from "better-sqlite3";
export type DbConfig = {
    driver: "sqlite";
    filename: string;
} | {
    driver: "d1";
    binding: any;
} | {
    driver: "postgres";
    connectionString: string;
};
/**
 * Create a Drizzle ORM database instance.
 * Supports SQLite via better-sqlite3 and Postgres via postgres-js.
 * Postgres driver is loaded dynamically to avoid bundling in edge runtimes.
 */
export declare function createDb(config: DbConfig): Promise<(import("drizzle-orm/postgres-js").PostgresJsDatabase<Record<string, never>> & {
    $client: import("postgres").Sql<{}>;
}) | (import("drizzle-orm/better-sqlite3").BetterSQLite3Database<Record<string, never>> & {
    $client: Database.Database;
})>;
export type DrizzleDb = Awaited<ReturnType<typeof createDb>>;
export { createGetDb } from "./create-get-db.js";
export { runMigrations } from "./migrations.js";
export { getDbExec, createDbExec, getDialect, isPostgres, intType, closeDbExec, type DbExec, type DbExecConfig, type Dialect, } from "./client.js";
export { table, text, integer, now } from "./schema.js";
//# sourceMappingURL=index.d.ts.map