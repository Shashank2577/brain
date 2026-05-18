/**
 * Core script: db-schema
 *
 * Inspects a SQLite or Postgres database and prints all tables, columns, types,
 * constraints, and foreign keys. Gives the agent full visibility
 * into the app's data model.
 *
 * Usage:
 *   pnpm action db-schema [--db path] [--format json]
 */
import path from "path";
import { getDatabaseUrl } from "../../db/client.js";
import { parseArgs } from "../utils.js";
import { createSqliteScriptClient, } from "./sqlite-client.js";
function isPostgresUrl(url) {
    return url.startsWith("postgres://") || url.startsWith("postgresql://");
}
function databaseLabel(url) {
    if (url.startsWith("file:"))
        return url.slice(5);
    try {
        const parsed = new URL(url);
        const auth = parsed.username ? `${parsed.username}:***@` : "";
        return `${parsed.protocol}//${auth}${parsed.host}${parsed.pathname}`;
    }
    catch {
        return url.replace(/:\/\/([^:@\s]+):([^@\s]+)@/, "://$1:***@");
    }
}
/**
 * Execute a PRAGMA query and return the rows as plain objects.
 */
async function pragma(client, pragmaQuery) {
    const result = await client.execute(pragmaQuery);
    return result.rows.map((row) => {
        const obj = {};
        for (let i = 0; i < result.columns.length; i++) {
            obj[result.columns[i]] = row[i];
        }
        return obj;
    });
}
// ---------------------------------------------------------------------------
// Postgres introspection
// ---------------------------------------------------------------------------
async function introspectPostgres(url, parsed) {
    const { default: pg } = await import("postgres");
    const sql = pg(url);
    try {
        // List tables
        const tables = await sql `
      SELECT table_name as name
      FROM information_schema.tables
      WHERE table_schema = 'public' AND table_type = 'BASE TABLE'
      ORDER BY table_name
    `;
        const tableInfos = [];
        for (const t of tables) {
            // Columns
            const cols = await sql `
        SELECT
          column_name as name,
          data_type as type,
          CASE WHEN is_nullable = 'NO' THEN 1 ELSE 0 END as notnull,
          column_default as dflt_value
        FROM information_schema.columns
        WHERE table_name = ${t.name}
        ORDER BY ordinal_position
      `;
            // Primary keys
            const pks = await sql `
        SELECT kcu.column_name
        FROM information_schema.table_constraints tc
        JOIN information_schema.key_column_usage kcu
          ON tc.constraint_name = kcu.constraint_name
          AND tc.table_schema = kcu.table_schema
        WHERE tc.table_name = ${t.name}
          AND tc.constraint_type = 'PRIMARY KEY'
      `;
            const pkSet = new Set(pks.map((p) => p.column_name));
            // Foreign keys
            const fks = await sql `
        SELECT
          kcu.column_name as "from",
          ccu.table_name as "table",
          ccu.column_name as "to"
        FROM information_schema.table_constraints tc
        JOIN information_schema.key_column_usage kcu
          ON tc.constraint_name = kcu.constraint_name
        JOIN information_schema.constraint_column_usage ccu
          ON tc.constraint_name = ccu.constraint_name
        WHERE tc.table_name = ${t.name}
          AND tc.constraint_type = 'FOREIGN KEY'
      `;
            // Indexes
            const idxRows = await sql `
        SELECT indexname as name, indexdef
        FROM pg_indexes
        WHERE tablename = ${t.name} AND schemaname = 'public'
      `;
            const indexes = idxRows.map((idx) => {
                const unique = /\bUNIQUE\b/i.test(idx.indexdef);
                // Extract column list from CREATE INDEX ... (col1, col2)
                const colMatch = idx.indexdef.match(/\(([^)]+)\)/);
                const columns = colMatch
                    ? colMatch[1].split(",").map((c) => c.trim())
                    : [];
                return { name: idx.name, unique, columns };
            });
            tableInfos.push({
                name: t.name,
                columns: cols.map((c) => ({
                    name: c.name,
                    type: c.type || "ANY",
                    notnull: c.notnull === 1,
                    pk: pkSet.has(c.name),
                    dflt_value: c.dflt_value,
                })),
                foreignKeys: fks.map((fk) => ({
                    from: fk.from,
                    table: fk.table,
                    to: fk.to,
                })),
                indexes,
            });
        }
        if (parsed.format === "json") {
            console.log(JSON.stringify({ database: databaseLabel(url), tables: tableInfos }, null, 2));
            return;
        }
        // Human-readable output
        console.log(`Database: ${databaseLabel(url)}`);
        console.log(`Tables: ${tableInfos.length}\n`);
        for (const table of tableInfos) {
            console.log(`Table: ${table.name} (${table.columns.length} columns)`);
            const fkMap = new Map();
            for (const fk of table.foreignKeys) {
                fkMap.set(fk.from, `${fk.table}(${fk.to})`);
            }
            const nameWidth = Math.max(...table.columns.map((c) => c.name.length));
            const typeWidth = Math.max(...table.columns.map((c) => c.type.length));
            for (const col of table.columns) {
                const parts = [];
                if (col.pk)
                    parts.push("PRIMARY KEY");
                if (col.notnull && !col.pk)
                    parts.push("NOT NULL");
                if (col.dflt_value !== null)
                    parts.push(`DEFAULT ${col.dflt_value}`);
                const fkRef = fkMap.get(col.name);
                if (fkRef)
                    parts.push(`→ ${fkRef}`);
                const constraint = parts.length > 0 ? `  ${parts.join(", ")}` : "";
                console.log(`  ${col.name.padEnd(nameWidth)}  ${col.type.padEnd(typeWidth)}${constraint}`);
            }
            if (table.indexes.length > 0) {
                console.log(`  Indexes:`);
                for (const idx of table.indexes) {
                    const unique = idx.unique ? "UNIQUE " : "";
                    console.log(`    ${unique}${idx.name} (${idx.columns.join(", ")})`);
                }
            }
            console.log();
        }
    }
    finally {
        await sql.end();
    }
}
// ---------------------------------------------------------------------------
// Main entry
// ---------------------------------------------------------------------------
export default async function dbSchema(args) {
    const parsed = parseArgs(args);
    if (parsed.help === "true") {
        console.log(`Usage: pnpm action db-schema [--db <path>] [--format json]

Options:
  --db <path>     Path to SQLite database (default: data/app.db)
  --format json   Output as JSON instead of human-readable text
  --help          Show this help message`);
        return;
    }
    // Resolve database URL: --db flag → DATABASE_URL env → default file path
    let url;
    if (parsed.db) {
        url = "file:" + path.resolve(parsed.db);
    }
    else if (getDatabaseUrl()) {
        url = getDatabaseUrl();
    }
    else {
        url = "file:" + path.resolve(process.cwd(), "data", "app.db");
    }
    // Postgres path
    if (isPostgresUrl(url)) {
        return introspectPostgres(url, parsed);
    }
    // SQLite / libsql path
    const client = await createSqliteScriptClient(url);
    try {
        const tablesResult = await client.execute(`SELECT name FROM sqlite_master WHERE type='table' AND name NOT LIKE 'sqlite_%' ORDER BY name`);
        const tables = tablesResult.rows.map((row) => ({
            name: row[0],
        }));
        const tableInfos = [];
        for (const t of tables) {
            const escaped = t.name.replace(/"/g, '""');
            const columns = await pragma(client, `PRAGMA table_info("${escaped}")`);
            const fks = await pragma(client, `PRAGMA foreign_key_list("${escaped}")`);
            const idxList = await pragma(client, `PRAGMA index_list("${escaped}")`);
            const indexes = [];
            for (const idx of idxList) {
                const idxName = idx.name;
                if (idxName.startsWith("sqlite_"))
                    continue;
                const idxInfo = await pragma(client, `PRAGMA index_info("${idxName.replace(/"/g, '""')}")`);
                indexes.push({
                    name: idxName,
                    unique: idx.unique === 1,
                    columns: idxInfo.map((c) => c.name),
                });
            }
            tableInfos.push({
                name: t.name,
                columns: columns.map((c) => ({
                    name: c.name,
                    type: c.type || "ANY",
                    notnull: c.notnull === 1,
                    pk: c.pk === 1,
                    dflt_value: c.dflt_value,
                })),
                foreignKeys: fks.map((fk) => ({
                    from: fk.from,
                    table: fk.table,
                    to: fk.to,
                })),
                indexes,
            });
        }
        if (parsed.format === "json") {
            const dbLabel = databaseLabel(url);
            console.log(JSON.stringify({ database: dbLabel, tables: tableInfos }, null, 2));
            return;
        }
        // Human-readable output
        const dbLabel = databaseLabel(url);
        console.log(`Database: ${dbLabel}`);
        console.log(`Tables: ${tableInfos.length}\n`);
        for (const table of tableInfos) {
            console.log(`Table: ${table.name} (${table.columns.length} columns)`);
            // Build FK lookup for annotation
            const fkMap = new Map();
            for (const fk of table.foreignKeys) {
                fkMap.set(fk.from, `${fk.table}(${fk.to})`);
            }
            // Find max widths for alignment
            const nameWidth = Math.max(...table.columns.map((c) => c.name.length));
            const typeWidth = Math.max(...table.columns.map((c) => c.type.length));
            for (const col of table.columns) {
                const parts = [];
                if (col.pk)
                    parts.push("PRIMARY KEY");
                if (col.notnull && !col.pk)
                    parts.push("NOT NULL");
                if (col.dflt_value !== null)
                    parts.push(`DEFAULT ${col.dflt_value}`);
                const fkRef = fkMap.get(col.name);
                if (fkRef)
                    parts.push(`→ ${fkRef}`);
                const constraint = parts.length > 0 ? `  ${parts.join(", ")}` : "";
                console.log(`  ${col.name.padEnd(nameWidth)}  ${col.type.padEnd(typeWidth)}${constraint}`);
            }
            if (table.indexes.length > 0) {
                console.log(`  Indexes:`);
                for (const idx of table.indexes) {
                    const unique = idx.unique ? "UNIQUE " : "";
                    console.log(`    ${unique}${idx.name} (${idx.columns.join(", ")})`);
                }
            }
            console.log();
        }
    }
    finally {
        client.close();
    }
}
//# sourceMappingURL=schema.js.map