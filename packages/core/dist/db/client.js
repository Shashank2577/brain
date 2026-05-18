/**
 * Central database client abstraction.
 *
 * Detects the database backend from the environment (D1, Postgres, or SQLite/libsql)
 * and returns a unified `DbExec` interface that all core stores use.
 *
 * Imports for postgres, better-sqlite3, and @libsql/client/web are lazy
 * (dynamic import) so this module can be loaded in any runtime (Node.js,
 * Cloudflare Workers, edge) without failing on missing native deps.
 */
import path from "path";
// ---------------------------------------------------------------------------
// Per-app DATABASE_URL resolution
// ---------------------------------------------------------------------------
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
export function getDatabaseUrl(fallback = "") {
    const appName = process.env.APP_NAME?.toUpperCase().replace(/-/g, "_");
    if (appName) {
        const prefixed = process.env[`${appName}_DATABASE_URL`];
        if (prefixed)
            return prefixed;
    }
    return process.env.DATABASE_URL || fallback;
}
/** Same per-app resolution for DATABASE_AUTH_TOKEN (used by Turso/libsql). */
export function getDatabaseAuthToken() {
    const appName = process.env.APP_NAME?.toUpperCase().replace(/-/g, "_");
    if (appName) {
        const prefixed = process.env[`${appName}_DATABASE_AUTH_TOKEN`];
        if (prefixed)
            return prefixed;
    }
    return process.env.DATABASE_AUTH_TOKEN;
}
export function isLocalSqliteUrl(url) {
    return url === "" || url.startsWith("file:") || !url.includes("://");
}
export async function prepareLocalSqliteUrl(url) {
    if (!url.startsWith("file:"))
        return url;
    // On serverless runtimes (Netlify, AWS Lambda) the working directory is
    // read-only. Detect this and redirect local SQLite to /tmp which IS writable
    // (ephemeral per invocation, but the server stays alive for the request).
    const isServerless = !!process.env.NETLIFY ||
        !!process.env.AWS_LAMBDA_FUNCTION_NAME ||
        !!process.env.LAMBDA_TASK_ROOT;
    try {
        const fs = await import("fs");
        if (isServerless && url === "file:./data/app.db") {
            fs.mkdirSync("/tmp/data", { recursive: true });
            return "file:///tmp/data/app.db";
        }
        fs.mkdirSync(path.join(process.cwd(), "data"), { recursive: true });
    }
    catch {
        // Edge runtime — no filesystem.
    }
    return url;
}
export function sqliteFilenameFromUrl(url) {
    if (url.startsWith("file://")) {
        return decodeURIComponent(new URL(url).pathname);
    }
    if (url.startsWith("file:")) {
        return url.slice("file:".length) || ":memory:";
    }
    return url || "./data/app.db";
}
// ---------------------------------------------------------------------------
// Safe JSON column parsing
// ---------------------------------------------------------------------------
/**
 * Parse a JSON-serialized column value defensively. A malformed row — from a
 * hand-edit, dirty migration, or a misbehaving agent that wrote raw SQL —
 * must not break an entire list endpoint. Callers supply a fallback for the
 * malformed path; null/undefined values also fall back.
 */
export function safeJsonParse(value, fallback) {
    if (value == null)
        return fallback;
    try {
        return JSON.parse(String(value));
    }
    catch {
        return fallback;
    }
}
// ---------------------------------------------------------------------------
// SQLite retry helper
// ---------------------------------------------------------------------------
/**
 * Retry an async operation when it fails with SQLITE_BUSY.
 * Used during WAL initialization and migrations where a stale WAL from a
 * previous crash or HMR restart can briefly lock the database.
 */
export async function retrySqliteBusy(fn, opts = {}) {
    const { maxAttempts = 5, baseDelayMs = 500, rethrow = false } = opts;
    let last;
    for (let attempt = 0; attempt < maxAttempts; attempt++) {
        try {
            return await fn();
        }
        catch (e) {
            last = e;
            const msg = String(e?.message || e);
            if (msg.includes("SQLITE_BUSY") && attempt < maxAttempts - 1) {
                await new Promise((r) => setTimeout(r, baseDelayMs * (attempt + 1)));
            }
            else {
                break;
            }
        }
    }
    if (rethrow)
        throw last;
    return undefined; // caller handles undefined (e.g. PRAGMA setup)
}
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
export async function retryOnDdlRace(fn) {
    try {
        return await fn();
    }
    catch (e) {
        if (!isPgCatalogRace(e))
            throw e;
        return await fn();
    }
}
function isPgCatalogRace(e) {
    if (e?.code === "42P07")
        return true;
    if (e?.code !== "23505")
        return false;
    const constraint = String(e?.constraint_name ?? e?.constraint ?? "");
    const detail = String(e?.detail ?? "");
    const msg = String(e?.message ?? "");
    return (constraint.startsWith("pg_type") ||
        constraint.startsWith("pg_class") ||
        detail.includes("pg_type") ||
        detail.includes("pg_class") ||
        /relation .* already exists/i.test(msg));
}
/**
 * True when `e` is a UNIQUE / PRIMARY KEY constraint violation from any
 * supported driver (Postgres 23505, SQLite SQLITE_CONSTRAINT_PRIMARYKEY /
 * _UNIQUE, D1). Used by stores that accept caller-provided ids and want to
 * surface a clean "already exists" error instead of the raw SQL text.
 */
export function isUniqueViolation(e) {
    if (e?.code === "23505")
        return true;
    const code = String(e?.code ?? "");
    if (code === "SQLITE_CONSTRAINT_PRIMARYKEY" ||
        code === "SQLITE_CONSTRAINT_UNIQUE") {
        return true;
    }
    const msg = String(e?.message ?? "").toLowerCase();
    return (msg.includes("unique constraint") ||
        msg.includes("primary key constraint") ||
        msg.includes("duplicate key"));
}
// ---------------------------------------------------------------------------
// Dialect detection
// ---------------------------------------------------------------------------
let _dialect;
export function getDialect() {
    if (_dialect !== undefined)
        return _dialect;
    // DATABASE_URL takes priority over D1 when set.
    const url = getDatabaseUrl();
    if (url.startsWith("postgres://") || url.startsWith("postgresql://")) {
        _dialect = "postgres";
        return _dialect;
    }
    if (url && !url.startsWith("file:")) {
        // Remote libsql (e.g. Turso)
        _dialect = "sqlite";
        return _dialect;
    }
    const d1 = globalThis.__cf_env?.DB;
    if (d1) {
        _dialect = "d1";
        return _dialect;
    }
    // Don't cache the fallthrough — on CF Workers, env bindings (__cf_env) aren't
    // available at import time. If we cache "sqlite" here, D1 will never be
    // detected once the bindings are set in the fetch handler.
    return "sqlite";
}
export function isPostgres() {
    return getDialect() === "postgres";
}
function dialectForConfig(config) {
    const url = config.url ?? "";
    if (url.startsWith("postgres://") || url.startsWith("postgresql://")) {
        return "postgres";
    }
    if (url && !url.startsWith("file:")) {
        return "sqlite";
    }
    if (config.d1Binding) {
        return "d1";
    }
    return "sqlite";
}
/**
 * Returns true when the database is a local-only SQLite file (or unset, which
 * defaults to a local SQLite file). Returns false for Postgres, remote libsql
 * (Turso), and D1 — any backend that could be shared across developers.
 *
 * Used to gate local@localhost mode: that mode uses a single shared virtual
 * user with no per-machine scoping, so on any shared database two developers
 * would read and write each other's settings, oauth tokens, and app state.
 */
export function isLocalDatabase() {
    if (getDialect() !== "sqlite")
        return false;
    const url = getDatabaseUrl();
    return url === "" || url.startsWith("file:");
}
/** Returns BIGINT for Postgres (64-bit), INTEGER for SQLite (already 64-bit). */
export function intType() {
    return isPostgres() ? "BIGINT" : "INTEGER";
}
// ---------------------------------------------------------------------------
// Parameter conversion: ? -> $1, $2, $3
// ---------------------------------------------------------------------------
function sqliteToPostgresParams(sql) {
    let i = 0;
    return sql.replace(/\?/g, () => `$${++i}`);
}
// ---------------------------------------------------------------------------
// Connection error retry (ECONNRESET, etc.)
// ---------------------------------------------------------------------------
/** Error codes that indicate a dead/stale connection we can safely retry. */
const CONNECTION_ERROR_CODES = new Set([
    "ECONNRESET",
    "ETIMEDOUT",
    "EPIPE",
    "ENOTFOUND",
    "CONNECTION_ENDED",
    "CONNECTION_DESTROYED",
    "CONNECTION_CLOSED",
]);
export function isConnectionError(err) {
    if (!err)
        return false;
    const code = err.code || err.cause?.code;
    if (code && CONNECTION_ERROR_CODES.has(code))
        return true;
    // Neon serverless WS driver: errors from the underlying undici WebSocket
    // closing mid-query come through as TypeError or ErrorEvent without a code.
    const name = err.name || err.cause?.name || "";
    if (name === "ErrorEvent")
        return true;
    const stack = String(err.stack || err.cause?.stack || "");
    if (/WebSocket\.#onSocketClose|failWebsocketConnection|onSocketClose/.test(stack)) {
        return true;
    }
    const msg = String(err.message || err.cause?.message || "");
    return /ECONNRESET|ETIMEDOUT|EPIPE|connection.*(closed|ended|terminated)|socket hang up|websocket/i.test(msg);
}
export async function retryOnConnectionError(fn, maxAttempts = 3) {
    let last;
    for (let attempt = 0; attempt < maxAttempts; attempt++) {
        try {
            return await fn();
        }
        catch (e) {
            last = e;
            if (!isConnectionError(e) || attempt === maxAttempts - 1)
                throw e;
            await new Promise((r) => setTimeout(r, 100 * (attempt + 1)));
        }
    }
    throw last;
}
// ---------------------------------------------------------------------------
// Singleton client — lazy-initialized on first execute() call
// ---------------------------------------------------------------------------
let _exec;
let _pgPool;
let _neonPool;
let _sqlite;
let _initPromise;
async function createDbExecInternal(config = {}, trackSingletonResources = false) {
    const dialect = dialectForConfig(config);
    // Cloudflare D1
    if (dialect === "d1") {
        const d1 = config.d1Binding;
        return {
            async execute(sql) {
                if (typeof sql === "string") {
                    const r = await d1.prepare(sql).all();
                    return {
                        rows: r.results || [],
                        rowsAffected: r.meta?.changes ?? 0,
                    };
                }
                const r = await d1
                    .prepare(sql.sql)
                    .bind(...sql.args)
                    .all();
                return { rows: r.results || [], rowsAffected: r.meta?.changes ?? 0 };
            },
        };
    }
    let url = config.url || "file:./data/app.db";
    // Postgres — uses postgres.js. Works on Node.js natively and on Cloudflare
    // Workers with the nodejs_compat compatibility flag (provides net/tls polyfills).
    // On Workers, connections can't be shared across requests, so we create a
    // fresh connection per query (max:1) to avoid the "I/O on behalf of a
    // different request" error.
    if (dialect === "postgres") {
        const { isNeonUrl } = await import("./create-get-db.js");
        // Neon over @neondatabase/serverless (WebSocket upgrade on port 443).
        // postgres-js uses a raw TCP socket on 5432 that frequently fails on
        // serverless runtimes (Netlify Functions, Vercel, CF Workers) when
        // Neon's pooler is cold — every request after an idle period times out
        // with CONNECT_TIMEOUT. The serverless Pool handles wake-up transparently
        // and keeps the same `pg`-compatible query(...) interface we need here.
        if (isNeonUrl(url)) {
            const { Pool } = await import("@neondatabase/serverless");
            const pool = new Pool({ connectionString: url });
            // Neon's serverless Pool extends EventEmitter and emits 'error'
            // when its WebSocket connection drops (idle timeout, Lambda
            // suspend, network blip). Without a listener, Node 24 surfaces
            // these as fatal `Unhandled error` / `Connection terminated
            // unexpectedly` uncaught exceptions, even though the next query
            // would have transparently re-connected. Log and swallow.
            pool.on("error", (err) => {
                console.warn("[db/neon] pool error (will reconnect on next query):", err instanceof Error ? err.message : err);
            });
            if (trackSingletonResources)
                _neonPool = pool;
            return {
                async execute(sql) {
                    const rawSql = typeof sql === "string" ? sql : sql.sql;
                    const args = typeof sql === "string" ? [] : sql.args || [];
                    const pgSql = sqliteToPostgresParams(rawSql);
                    const result = await retryOnConnectionError(() => pool.query(pgSql, args));
                    return {
                        rows: result.rows,
                        rowsAffected: result.rowCount ?? 0,
                    };
                },
            };
        }
        const { default: postgres } = await import("postgres");
        const isWorkers = "__cf_env" in globalThis ||
            (typeof navigator !== "undefined" &&
                navigator.userAgent === "Cloudflare-Workers");
        if (isWorkers) {
            // Workers: fresh connection per query — I/O can't be shared across requests
            return {
                async execute(sql) {
                    const conn = postgres(url, {
                        max: 1,
                        idle_timeout: 0,
                        onnotice: () => { },
                    });
                    try {
                        const rawSql = typeof sql === "string" ? sql : sql.sql;
                        const args = typeof sql === "string" ? [] : sql.args || [];
                        const pgSql = sqliteToPostgresParams(rawSql);
                        const result = await conn.unsafe(pgSql, args);
                        return {
                            rows: Array.from(result),
                            rowsAffected: result.count ?? 0,
                        };
                    }
                    finally {
                        await conn.end();
                    }
                },
            };
        }
        else {
            // Node.js: reuse connection pool.
            // idle_timeout:240 closes idle connections before Neon's ~5min server-side
            // timeout, avoiding ECONNRESET when the server hangs up on us.
            const pool = postgres(url, {
                onnotice: () => { },
                idle_timeout: 240,
                max_lifetime: 60 * 30,
                connect_timeout: 10,
                // Supabase's connection pooler (Transaction mode) requires prepare: false.
                // Only disable for Supabase URLs to avoid degrading other Postgres deployments.
                ...(url.includes("supabase") ? { prepare: false } : {}),
            });
            if (trackSingletonResources)
                _pgPool = pool;
            return {
                async execute(sql) {
                    const rawSql = typeof sql === "string" ? sql : sql.sql;
                    const args = typeof sql === "string" ? [] : sql.args || [];
                    const pgSql = sqliteToPostgresParams(rawSql);
                    const result = await retryOnConnectionError(() => pool.unsafe(pgSql, args));
                    return {
                        rows: Array.from(result),
                        rowsAffected: result.count ?? 0,
                    };
                },
            };
        }
    }
    // SQLite / libsql (default). Local file databases use better-sqlite3 so
    // serverless bundles do not need libsql's platform-specific native package.
    if (isLocalSqliteUrl(url)) {
        url = await prepareLocalSqliteUrl(url.startsWith("file:") ? url : `file:${url}`);
        const { default: Database } = await import("better-sqlite3");
        const sqlite = new Database(sqliteFilenameFromUrl(url));
        sqlite.pragma("busy_timeout = 10000");
        sqlite.pragma("journal_mode = WAL");
        if (trackSingletonResources)
            _sqlite = sqlite;
        return {
            async execute(sql) {
                const rawSql = typeof sql === "string" ? sql : sql.sql;
                const args = typeof sql === "string" ? [] : sql.args || [];
                const stmt = sqlite.prepare(rawSql);
                if (stmt.reader) {
                    return {
                        rows: stmt.all(...args),
                        rowsAffected: 0,
                    };
                }
                const result = stmt.run(...args);
                return {
                    rows: [],
                    rowsAffected: result.changes ?? 0,
                };
            },
        };
    }
    const { createClient } = await import("@libsql/client/web");
    const client = createClient({
        url,
        authToken: config.authToken,
    });
    return {
        async execute(sql) {
            if (typeof sql === "string") {
                const r = await client.execute(sql);
                return {
                    rows: r.rows,
                    rowsAffected: r.rowsAffected,
                };
            }
            const r = await client.execute({
                sql: sql.sql,
                args: sql.args,
            });
            return {
                rows: r.rows,
                rowsAffected: r.rowsAffected,
            };
        },
    };
}
export async function createDbExec(config = {}) {
    return createDbExecInternal(config, false);
}
async function initClient() {
    if (_exec)
        return;
    const dialect = getDialect();
    const url = getDatabaseUrl("file:./data/app.db");
    _exec = await createDbExecInternal({
        url,
        authToken: getDatabaseAuthToken(),
        d1Binding: dialect === "d1" ? globalThis.__cf_env?.DB : undefined,
    }, true);
}
/**
 * Get the singleton database client. Returns a `DbExec` whose first
 * `execute()` call lazily initializes the underlying driver.
 */
export function getDbExec() {
    if (_exec)
        return _exec;
    // Sanitize args: replace undefined with null (libsql rejects undefined)
    function sanitize(sql) {
        if (typeof sql === "object" && sql.args) {
            return { ...sql, args: sql.args.map((a) => a ?? null) };
        }
        return sql;
    }
    // Return a proxy that lazy-inits on first call
    const proxy = {
        async execute(sql) {
            if (!_initPromise)
                _initPromise = initClient();
            await _initPromise;
            // After init, swap to a sanitizing wrapper around the real client
            const wrapper = {
                execute: (s) => _exec.execute(sanitize(s)),
            };
            Object.assign(proxy, wrapper);
            return _exec.execute(sanitize(sql));
        },
    };
    return proxy;
}
/** Close the database connection (for scripts that need cleanup). */
export async function closeDbExec() {
    if (_pgPool) {
        await _pgPool.end();
        _pgPool = undefined;
    }
    if (_neonPool) {
        await _neonPool.end();
        _neonPool = undefined;
    }
    if (_sqlite) {
        _sqlite.close();
        _sqlite = undefined;
    }
    _exec = undefined;
    _initPromise = undefined;
}
//# sourceMappingURL=client.js.map