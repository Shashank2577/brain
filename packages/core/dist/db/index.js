import { drizzle } from "drizzle-orm/better-sqlite3";
import Database from "better-sqlite3";
/**
 * Create a Drizzle ORM database instance.
 * Supports SQLite via better-sqlite3 and Postgres via postgres-js.
 * Postgres driver is loaded dynamically to avoid bundling in edge runtimes.
 */
export async function createDb(config) {
    if (config.driver === "postgres") {
        const { drizzle: drizzlePg } = await import("drizzle-orm/postgres-js");
        const { default: pg } = await import("postgres");
        const { pgPoolOptions } = await import("./client.js");
        return drizzlePg(pg(config.connectionString, pgPoolOptions(config.connectionString)));
    }
    if (config.driver === "sqlite") {
        const sqlite = new Database(config.filename);
        sqlite.pragma("journal_mode = WAL");
        return drizzle(sqlite);
    }
    throw new Error(`Unsupported driver: ${config.driver}`);
}
export { createGetDb } from "./create-get-db.js";
export { runMigrations } from "./migrations.js";
export { getDbExec, createDbExec, getDialect, isPostgres, intType, closeDbExec, } from "./client.js";
export { table, text, integer, now } from "./schema.js";
//# sourceMappingURL=index.js.map