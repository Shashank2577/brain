/**
 * Drizzle schema for the framework extensions system.
 *
 * Extensions are mini Alpine.js apps that run inside sandboxed iframes. They
 * can call external APIs via a server-side proxy that resolves `${keys.NAME}`
 * secret references. Extensions use the standard sharing model (private by
 * default, shareable with org/others).
 *
 * The tables are auto-created at server boot via `ensureTable()` in store.ts,
 * following the same pattern as `app_secrets`.
 *
 * NOTE: physical SQL table/column names stay as `tools`, `tool_data`,
 * `tool_shares`, `tool_consents`, `tool_id`, etc. — additive-only schema
 * policy means we never rename DB-level identifiers. The JS/TS surface is
 * renamed to `extensions`/`extension*`; the DB-side names stay so existing
 * deployed rows remain readable.
 */
export declare const extensions: import("drizzle-orm/sqlite-core").SQLiteTableWithColumns<{
    name: "tools";
    schema: undefined;
    columns: {
        ownerEmail: import("drizzle-orm/sqlite-core").SQLiteColumn<{
            name: "owner_email";
            tableName: "tools";
            dataType: "string";
            columnType: "SQLiteText";
            data: string;
            driverParam: string;
            notNull: true;
            hasDefault: true;
            isPrimaryKey: false;
            isAutoincrement: false;
            hasRuntimeDefault: false;
            enumValues: [string, ...string[]];
            baseColumn: never;
            identity: undefined;
            generated: undefined;
        }, {}, {
            length: number;
        }>;
        orgId: import("drizzle-orm/sqlite-core").SQLiteColumn<{
            name: "org_id";
            tableName: "tools";
            dataType: "string";
            columnType: "SQLiteText";
            data: string;
            driverParam: string;
            notNull: false;
            hasDefault: false;
            isPrimaryKey: false;
            isAutoincrement: false;
            hasRuntimeDefault: false;
            enumValues: [string, ...string[]];
            baseColumn: never;
            identity: undefined;
            generated: undefined;
        }, {}, {
            length: number;
        }>;
        visibility: import("drizzle-orm/sqlite-core").SQLiteColumn<{
            name: "visibility";
            tableName: "tools";
            dataType: "string";
            columnType: "SQLiteText";
            data: "org" | "private" | "public";
            driverParam: string;
            notNull: true;
            hasDefault: true;
            isPrimaryKey: false;
            isAutoincrement: false;
            hasRuntimeDefault: false;
            enumValues: ["private", "org", "public"];
            baseColumn: never;
            identity: undefined;
            generated: undefined;
        }, {}, {
            length: number;
        }>;
        id: import("drizzle-orm/sqlite-core").SQLiteColumn<{
            name: "id";
            tableName: "tools";
            dataType: "string";
            columnType: "SQLiteText";
            data: string;
            driverParam: string;
            notNull: true;
            hasDefault: false;
            isPrimaryKey: true;
            isAutoincrement: false;
            hasRuntimeDefault: false;
            enumValues: [string, ...string[]];
            baseColumn: never;
            identity: undefined;
            generated: undefined;
        }, {}, {
            length: number;
        }>;
        name: import("drizzle-orm/sqlite-core").SQLiteColumn<{
            name: "name";
            tableName: "tools";
            dataType: "string";
            columnType: "SQLiteText";
            data: string;
            driverParam: string;
            notNull: true;
            hasDefault: false;
            isPrimaryKey: false;
            isAutoincrement: false;
            hasRuntimeDefault: false;
            enumValues: [string, ...string[]];
            baseColumn: never;
            identity: undefined;
            generated: undefined;
        }, {}, {
            length: number;
        }>;
        description: import("drizzle-orm/sqlite-core").SQLiteColumn<{
            name: "description";
            tableName: "tools";
            dataType: "string";
            columnType: "SQLiteText";
            data: string;
            driverParam: string;
            notNull: true;
            hasDefault: true;
            isPrimaryKey: false;
            isAutoincrement: false;
            hasRuntimeDefault: false;
            enumValues: [string, ...string[]];
            baseColumn: never;
            identity: undefined;
            generated: undefined;
        }, {}, {
            length: number;
        }>;
        content: import("drizzle-orm/sqlite-core").SQLiteColumn<{
            name: "content";
            tableName: "tools";
            dataType: "string";
            columnType: "SQLiteText";
            data: string;
            driverParam: string;
            notNull: true;
            hasDefault: true;
            isPrimaryKey: false;
            isAutoincrement: false;
            hasRuntimeDefault: false;
            enumValues: [string, ...string[]];
            baseColumn: never;
            identity: undefined;
            generated: undefined;
        }, {}, {
            length: number;
        }>;
        icon: import("drizzle-orm/sqlite-core").SQLiteColumn<{
            name: "icon";
            tableName: "tools";
            dataType: "string";
            columnType: "SQLiteText";
            data: string;
            driverParam: string;
            notNull: false;
            hasDefault: false;
            isPrimaryKey: false;
            isAutoincrement: false;
            hasRuntimeDefault: false;
            enumValues: [string, ...string[]];
            baseColumn: never;
            identity: undefined;
            generated: undefined;
        }, {}, {
            length: number;
        }>;
        createdAt: import("drizzle-orm/sqlite-core").SQLiteColumn<{
            name: "created_at";
            tableName: "tools";
            dataType: "string";
            columnType: "SQLiteText";
            data: string;
            driverParam: string;
            notNull: true;
            hasDefault: true;
            isPrimaryKey: false;
            isAutoincrement: false;
            hasRuntimeDefault: false;
            enumValues: [string, ...string[]];
            baseColumn: never;
            identity: undefined;
            generated: undefined;
        }, {}, {
            length: number;
        }>;
        updatedAt: import("drizzle-orm/sqlite-core").SQLiteColumn<{
            name: "updated_at";
            tableName: "tools";
            dataType: "string";
            columnType: "SQLiteText";
            data: string;
            driverParam: string;
            notNull: true;
            hasDefault: true;
            isPrimaryKey: false;
            isAutoincrement: false;
            hasRuntimeDefault: false;
            enumValues: [string, ...string[]];
            baseColumn: never;
            identity: undefined;
            generated: undefined;
        }, {}, {
            length: number;
        }>;
    };
    dialect: "sqlite";
}>;
export declare const extensionShares: import("drizzle-orm/sqlite-core").SQLiteTableWithColumns<{
    name: string;
    schema: undefined;
    columns: {
        id: import("drizzle-orm/sqlite-core").SQLiteColumn<{
            name: "id";
            tableName: string;
            dataType: "string";
            columnType: "SQLiteText";
            data: string;
            driverParam: string;
            notNull: true;
            hasDefault: false;
            isPrimaryKey: true;
            isAutoincrement: false;
            hasRuntimeDefault: false;
            enumValues: [string, ...string[]];
            baseColumn: never;
            identity: undefined;
            generated: undefined;
        }, {}, {
            length: number;
        }>;
        resourceId: import("drizzle-orm/sqlite-core").SQLiteColumn<{
            name: "resource_id";
            tableName: string;
            dataType: "string";
            columnType: "SQLiteText";
            data: string;
            driverParam: string;
            notNull: true;
            hasDefault: false;
            isPrimaryKey: false;
            isAutoincrement: false;
            hasRuntimeDefault: false;
            enumValues: [string, ...string[]];
            baseColumn: never;
            identity: undefined;
            generated: undefined;
        }, {}, {
            length: number;
        }>;
        principalType: import("drizzle-orm/sqlite-core").SQLiteColumn<{
            name: "principal_type";
            tableName: string;
            dataType: "string";
            columnType: "SQLiteText";
            data: "user" | "org";
            driverParam: string;
            notNull: true;
            hasDefault: false;
            isPrimaryKey: false;
            isAutoincrement: false;
            hasRuntimeDefault: false;
            enumValues: ["user", "org"];
            baseColumn: never;
            identity: undefined;
            generated: undefined;
        }, {}, {
            length: number;
        }>;
        principalId: import("drizzle-orm/sqlite-core").SQLiteColumn<{
            name: "principal_id";
            tableName: string;
            dataType: "string";
            columnType: "SQLiteText";
            data: string;
            driverParam: string;
            notNull: true;
            hasDefault: false;
            isPrimaryKey: false;
            isAutoincrement: false;
            hasRuntimeDefault: false;
            enumValues: [string, ...string[]];
            baseColumn: never;
            identity: undefined;
            generated: undefined;
        }, {}, {
            length: number;
        }>;
        role: import("drizzle-orm/sqlite-core").SQLiteColumn<{
            name: "role";
            tableName: string;
            dataType: "string";
            columnType: "SQLiteText";
            data: "admin" | "viewer" | "editor";
            driverParam: string;
            notNull: true;
            hasDefault: true;
            isPrimaryKey: false;
            isAutoincrement: false;
            hasRuntimeDefault: false;
            enumValues: ["viewer", "editor", "admin"];
            baseColumn: never;
            identity: undefined;
            generated: undefined;
        }, {}, {
            length: number;
        }>;
        createdBy: import("drizzle-orm/sqlite-core").SQLiteColumn<{
            name: "created_by";
            tableName: string;
            dataType: "string";
            columnType: "SQLiteText";
            data: string;
            driverParam: string;
            notNull: true;
            hasDefault: false;
            isPrimaryKey: false;
            isAutoincrement: false;
            hasRuntimeDefault: false;
            enumValues: [string, ...string[]];
            baseColumn: never;
            identity: undefined;
            generated: undefined;
        }, {}, {
            length: number;
        }>;
        createdAt: import("drizzle-orm/sqlite-core").SQLiteColumn<{
            name: "created_at";
            tableName: string;
            dataType: "string";
            columnType: "SQLiteText";
            data: string;
            driverParam: string;
            notNull: true;
            hasDefault: true;
            isPrimaryKey: false;
            isAutoincrement: false;
            hasRuntimeDefault: false;
            enumValues: [string, ...string[]];
            baseColumn: never;
            identity: undefined;
            generated: undefined;
        }, {}, {
            length: number;
        }>;
    };
    dialect: "sqlite";
}>;
export declare const extensionHides: import("drizzle-orm/sqlite-core").SQLiteTableWithColumns<{
    name: "tool_hidden_extensions";
    schema: undefined;
    columns: {
        id: import("drizzle-orm/sqlite-core").SQLiteColumn<{
            name: "id";
            tableName: "tool_hidden_extensions";
            dataType: "string";
            columnType: "SQLiteText";
            data: string;
            driverParam: string;
            notNull: true;
            hasDefault: false;
            isPrimaryKey: true;
            isAutoincrement: false;
            hasRuntimeDefault: false;
            enumValues: [string, ...string[]];
            baseColumn: never;
            identity: undefined;
            generated: undefined;
        }, {}, {
            length: number;
        }>;
        extensionId: import("drizzle-orm/sqlite-core").SQLiteColumn<{
            name: "tool_id";
            tableName: "tool_hidden_extensions";
            dataType: "string";
            columnType: "SQLiteText";
            data: string;
            driverParam: string;
            notNull: true;
            hasDefault: false;
            isPrimaryKey: false;
            isAutoincrement: false;
            hasRuntimeDefault: false;
            enumValues: [string, ...string[]];
            baseColumn: never;
            identity: undefined;
            generated: undefined;
        }, {}, {
            length: number;
        }>;
        ownerEmail: import("drizzle-orm/sqlite-core").SQLiteColumn<{
            name: "owner_email";
            tableName: "tool_hidden_extensions";
            dataType: "string";
            columnType: "SQLiteText";
            data: string;
            driverParam: string;
            notNull: true;
            hasDefault: false;
            isPrimaryKey: false;
            isAutoincrement: false;
            hasRuntimeDefault: false;
            enumValues: [string, ...string[]];
            baseColumn: never;
            identity: undefined;
            generated: undefined;
        }, {}, {
            length: number;
        }>;
        createdAt: import("drizzle-orm/sqlite-core").SQLiteColumn<{
            name: "created_at";
            tableName: "tool_hidden_extensions";
            dataType: "string";
            columnType: "SQLiteText";
            data: string;
            driverParam: string;
            notNull: true;
            hasDefault: true;
            isPrimaryKey: false;
            isAutoincrement: false;
            hasRuntimeDefault: false;
            enumValues: [string, ...string[]];
            baseColumn: never;
            identity: undefined;
            generated: undefined;
        }, {}, {
            length: number;
        }>;
    };
    dialect: "sqlite";
}>;
export declare const EXTENSIONS_CREATE_SQL = "CREATE TABLE IF NOT EXISTS tools (\n  id TEXT PRIMARY KEY,\n  name TEXT NOT NULL,\n  description TEXT NOT NULL DEFAULT '',\n  content TEXT NOT NULL DEFAULT '',\n  icon TEXT,\n  created_at TEXT NOT NULL DEFAULT (datetime('now')),\n  updated_at TEXT NOT NULL DEFAULT (datetime('now')),\n  owner_email TEXT NOT NULL DEFAULT 'local@localhost',\n  org_id TEXT,\n  visibility TEXT NOT NULL DEFAULT 'private'\n)";
export declare const EXTENSIONS_CREATE_SQL_PG = "CREATE TABLE IF NOT EXISTS tools (\n  id TEXT PRIMARY KEY,\n  name TEXT NOT NULL,\n  description TEXT NOT NULL DEFAULT '',\n  content TEXT NOT NULL DEFAULT '',\n  icon TEXT,\n  created_at TEXT NOT NULL DEFAULT now(),\n  updated_at TEXT NOT NULL DEFAULT now(),\n  owner_email TEXT NOT NULL DEFAULT 'local@localhost',\n  org_id TEXT,\n  visibility TEXT NOT NULL DEFAULT 'private'\n)";
export declare const EXTENSION_SHARES_CREATE_SQL = "CREATE TABLE IF NOT EXISTS tool_shares (\n  id TEXT PRIMARY KEY,\n  resource_id TEXT NOT NULL,\n  principal_type TEXT NOT NULL,\n  principal_id TEXT NOT NULL,\n  role TEXT NOT NULL DEFAULT 'viewer',\n  created_by TEXT NOT NULL,\n  created_at TEXT NOT NULL DEFAULT (datetime('now'))\n)";
export declare const EXTENSION_SHARES_CREATE_SQL_PG = "CREATE TABLE IF NOT EXISTS tool_shares (\n  id TEXT PRIMARY KEY,\n  resource_id TEXT NOT NULL,\n  principal_type TEXT NOT NULL,\n  principal_id TEXT NOT NULL,\n  role TEXT NOT NULL DEFAULT 'viewer',\n  created_by TEXT NOT NULL,\n  created_at TEXT NOT NULL DEFAULT now()\n)";
export declare const extensionData: import("drizzle-orm/sqlite-core").SQLiteTableWithColumns<{
    name: "tool_data";
    schema: undefined;
    columns: {
        id: import("drizzle-orm/sqlite-core").SQLiteColumn<{
            name: "id";
            tableName: "tool_data";
            dataType: "string";
            columnType: "SQLiteText";
            data: string;
            driverParam: string;
            notNull: true;
            hasDefault: false;
            isPrimaryKey: true;
            isAutoincrement: false;
            hasRuntimeDefault: false;
            enumValues: [string, ...string[]];
            baseColumn: never;
            identity: undefined;
            generated: undefined;
        }, {}, {
            length: number;
        }>;
        extensionId: import("drizzle-orm/sqlite-core").SQLiteColumn<{
            name: "tool_id";
            tableName: "tool_data";
            dataType: "string";
            columnType: "SQLiteText";
            data: string;
            driverParam: string;
            notNull: true;
            hasDefault: false;
            isPrimaryKey: false;
            isAutoincrement: false;
            hasRuntimeDefault: false;
            enumValues: [string, ...string[]];
            baseColumn: never;
            identity: undefined;
            generated: undefined;
        }, {}, {
            length: number;
        }>;
        collection: import("drizzle-orm/sqlite-core").SQLiteColumn<{
            name: "collection";
            tableName: "tool_data";
            dataType: "string";
            columnType: "SQLiteText";
            data: string;
            driverParam: string;
            notNull: true;
            hasDefault: false;
            isPrimaryKey: false;
            isAutoincrement: false;
            hasRuntimeDefault: false;
            enumValues: [string, ...string[]];
            baseColumn: never;
            identity: undefined;
            generated: undefined;
        }, {}, {
            length: number;
        }>;
        itemId: import("drizzle-orm/sqlite-core").SQLiteColumn<{
            name: "item_id";
            tableName: "tool_data";
            dataType: "string";
            columnType: "SQLiteText";
            data: string;
            driverParam: string;
            notNull: false;
            hasDefault: false;
            isPrimaryKey: false;
            isAutoincrement: false;
            hasRuntimeDefault: false;
            enumValues: [string, ...string[]];
            baseColumn: never;
            identity: undefined;
            generated: undefined;
        }, {}, {
            length: number;
        }>;
        data: import("drizzle-orm/sqlite-core").SQLiteColumn<{
            name: "data";
            tableName: "tool_data";
            dataType: "string";
            columnType: "SQLiteText";
            data: string;
            driverParam: string;
            notNull: true;
            hasDefault: false;
            isPrimaryKey: false;
            isAutoincrement: false;
            hasRuntimeDefault: false;
            enumValues: [string, ...string[]];
            baseColumn: never;
            identity: undefined;
            generated: undefined;
        }, {}, {
            length: number;
        }>;
        ownerEmail: import("drizzle-orm/sqlite-core").SQLiteColumn<{
            name: "owner_email";
            tableName: "tool_data";
            dataType: "string";
            columnType: "SQLiteText";
            data: string;
            driverParam: string;
            notNull: true;
            hasDefault: true;
            isPrimaryKey: false;
            isAutoincrement: false;
            hasRuntimeDefault: false;
            enumValues: [string, ...string[]];
            baseColumn: never;
            identity: undefined;
            generated: undefined;
        }, {}, {
            length: number;
        }>;
        scope: import("drizzle-orm/sqlite-core").SQLiteColumn<{
            name: "scope";
            tableName: "tool_data";
            dataType: "string";
            columnType: "SQLiteText";
            data: string;
            driverParam: string;
            notNull: true;
            hasDefault: true;
            isPrimaryKey: false;
            isAutoincrement: false;
            hasRuntimeDefault: false;
            enumValues: [string, ...string[]];
            baseColumn: never;
            identity: undefined;
            generated: undefined;
        }, {}, {
            length: number;
        }>;
        orgId: import("drizzle-orm/sqlite-core").SQLiteColumn<{
            name: "org_id";
            tableName: "tool_data";
            dataType: "string";
            columnType: "SQLiteText";
            data: string;
            driverParam: string;
            notNull: false;
            hasDefault: false;
            isPrimaryKey: false;
            isAutoincrement: false;
            hasRuntimeDefault: false;
            enumValues: [string, ...string[]];
            baseColumn: never;
            identity: undefined;
            generated: undefined;
        }, {}, {
            length: number;
        }>;
        scopeKey: import("drizzle-orm/sqlite-core").SQLiteColumn<{
            name: "scope_key";
            tableName: "tool_data";
            dataType: "string";
            columnType: "SQLiteText";
            data: string;
            driverParam: string;
            notNull: true;
            hasDefault: true;
            isPrimaryKey: false;
            isAutoincrement: false;
            hasRuntimeDefault: false;
            enumValues: [string, ...string[]];
            baseColumn: never;
            identity: undefined;
            generated: undefined;
        }, {}, {
            length: number;
        }>;
        createdAt: import("drizzle-orm/sqlite-core").SQLiteColumn<{
            name: "created_at";
            tableName: "tool_data";
            dataType: "string";
            columnType: "SQLiteText";
            data: string;
            driverParam: string;
            notNull: true;
            hasDefault: true;
            isPrimaryKey: false;
            isAutoincrement: false;
            hasRuntimeDefault: false;
            enumValues: [string, ...string[]];
            baseColumn: never;
            identity: undefined;
            generated: undefined;
        }, {}, {
            length: number;
        }>;
        updatedAt: import("drizzle-orm/sqlite-core").SQLiteColumn<{
            name: "updated_at";
            tableName: "tool_data";
            dataType: "string";
            columnType: "SQLiteText";
            data: string;
            driverParam: string;
            notNull: true;
            hasDefault: true;
            isPrimaryKey: false;
            isAutoincrement: false;
            hasRuntimeDefault: false;
            enumValues: [string, ...string[]];
            baseColumn: never;
            identity: undefined;
            generated: undefined;
        }, {}, {
            length: number;
        }>;
    };
    dialect: "sqlite";
}>;
export declare const EXTENSION_DATA_CREATE_SQL = "CREATE TABLE IF NOT EXISTS tool_data (\n  id TEXT PRIMARY KEY,\n  tool_id TEXT NOT NULL,\n  collection TEXT NOT NULL,\n  item_id TEXT,\n  data TEXT NOT NULL,\n  owner_email TEXT NOT NULL DEFAULT 'local@localhost',\n  scope TEXT NOT NULL DEFAULT 'user',\n  org_id TEXT,\n  scope_key TEXT NOT NULL DEFAULT 'local@localhost',\n  created_at TEXT NOT NULL DEFAULT (datetime('now')),\n  updated_at TEXT NOT NULL DEFAULT (datetime('now'))\n)";
export declare const EXTENSION_DATA_CREATE_SQL_PG = "CREATE TABLE IF NOT EXISTS tool_data (\n  id TEXT PRIMARY KEY,\n  tool_id TEXT NOT NULL,\n  collection TEXT NOT NULL,\n  item_id TEXT,\n  data TEXT NOT NULL,\n  owner_email TEXT NOT NULL DEFAULT 'local@localhost',\n  scope TEXT NOT NULL DEFAULT 'user',\n  org_id TEXT,\n  scope_key TEXT NOT NULL DEFAULT 'local@localhost',\n  created_at TEXT NOT NULL DEFAULT now(),\n  updated_at TEXT NOT NULL DEFAULT now()\n)";
export declare const EXTENSION_DATA_ITEM_INDEX_SQL = "CREATE UNIQUE INDEX IF NOT EXISTS tool_data_scoped_item_idx\n  ON tool_data (tool_id, collection, scope_key, item_id)";
export declare const EXTENSION_DATA_ITEM_INDEX_SQL_PG = "CREATE UNIQUE INDEX IF NOT EXISTS tool_data_scoped_item_idx\n  ON tool_data (tool_id, collection, scope_key, item_id)";
export declare const EXTENSION_DATA_DROP_OLD_INDEX_SQL = "DROP INDEX IF EXISTS tool_data_scope_item_idx";
export declare const EXTENSION_DATA_DROP_OLD_INDEX_SQL_PG = "DROP INDEX IF EXISTS tool_data_scope_item_idx";
export declare const EXTENSIONS_OWNER_INDEX_SQL = "CREATE INDEX IF NOT EXISTS tools_owner_idx ON tools (owner_email)";
export declare const EXTENSIONS_ORG_INDEX_SQL = "CREATE INDEX IF NOT EXISTS tools_org_idx ON tools (org_id)";
export declare const EXTENSIONS_UPDATED_INDEX_SQL = "CREATE INDEX IF NOT EXISTS tools_updated_at_idx ON tools (updated_at)";
export declare const EXTENSION_SHARES_RESOURCE_INDEX_SQL = "CREATE INDEX IF NOT EXISTS tool_shares_resource_idx ON tool_shares (resource_id)";
export declare const EXTENSION_HIDES_CREATE_SQL = "CREATE TABLE IF NOT EXISTS tool_hidden_extensions (\n  id TEXT PRIMARY KEY,\n  tool_id TEXT NOT NULL,\n  owner_email TEXT NOT NULL,\n  created_at TEXT NOT NULL DEFAULT (datetime('now'))\n)";
export declare const EXTENSION_HIDES_CREATE_SQL_PG = "CREATE TABLE IF NOT EXISTS tool_hidden_extensions (\n  id TEXT PRIMARY KEY,\n  tool_id TEXT NOT NULL,\n  owner_email TEXT NOT NULL,\n  created_at TEXT NOT NULL DEFAULT now()\n)";
export declare const EXTENSION_HIDES_UNIQUE_INDEX_SQL = "CREATE UNIQUE INDEX IF NOT EXISTS tool_hidden_extensions_user_tool_idx\n  ON tool_hidden_extensions (owner_email, tool_id)";
export declare const EXTENSION_HIDES_OWNER_INDEX_SQL = "CREATE INDEX IF NOT EXISTS tool_hidden_extensions_owner_idx\n  ON tool_hidden_extensions (owner_email)";
export declare const extensionConsents: import("drizzle-orm/sqlite-core").SQLiteTableWithColumns<{
    name: "tool_consents";
    schema: undefined;
    columns: {
        viewerEmail: import("drizzle-orm/sqlite-core").SQLiteColumn<{
            name: "viewer_email";
            tableName: "tool_consents";
            dataType: "string";
            columnType: "SQLiteText";
            data: string;
            driverParam: string;
            notNull: true;
            hasDefault: false;
            isPrimaryKey: false;
            isAutoincrement: false;
            hasRuntimeDefault: false;
            enumValues: [string, ...string[]];
            baseColumn: never;
            identity: undefined;
            generated: undefined;
        }, {}, {
            length: number;
        }>;
        extensionId: import("drizzle-orm/sqlite-core").SQLiteColumn<{
            name: "tool_id";
            tableName: "tool_consents";
            dataType: "string";
            columnType: "SQLiteText";
            data: string;
            driverParam: string;
            notNull: true;
            hasDefault: false;
            isPrimaryKey: false;
            isAutoincrement: false;
            hasRuntimeDefault: false;
            enumValues: [string, ...string[]];
            baseColumn: never;
            identity: undefined;
            generated: undefined;
        }, {}, {
            length: number;
        }>;
        contentHash: import("drizzle-orm/sqlite-core").SQLiteColumn<{
            name: "content_hash";
            tableName: "tool_consents";
            dataType: "string";
            columnType: "SQLiteText";
            data: string;
            driverParam: string;
            notNull: true;
            hasDefault: false;
            isPrimaryKey: false;
            isAutoincrement: false;
            hasRuntimeDefault: false;
            enumValues: [string, ...string[]];
            baseColumn: never;
            identity: undefined;
            generated: undefined;
        }, {}, {
            length: number;
        }>;
        grantedAt: import("drizzle-orm/sqlite-core").SQLiteColumn<{
            name: "granted_at";
            tableName: "tool_consents";
            dataType: "string";
            columnType: "SQLiteText";
            data: string;
            driverParam: string;
            notNull: true;
            hasDefault: true;
            isPrimaryKey: false;
            isAutoincrement: false;
            hasRuntimeDefault: false;
            enumValues: [string, ...string[]];
            baseColumn: never;
            identity: undefined;
            generated: undefined;
        }, {}, {
            length: number;
        }>;
    };
    dialect: "sqlite";
}>;
export declare const EXTENSION_CONSENTS_CREATE_SQL = "CREATE TABLE IF NOT EXISTS tool_consents (\n  viewer_email TEXT NOT NULL,\n  tool_id TEXT NOT NULL,\n  content_hash TEXT NOT NULL,\n  granted_at TEXT NOT NULL DEFAULT (datetime('now')),\n  PRIMARY KEY (viewer_email, tool_id, content_hash)\n)";
export declare const EXTENSION_CONSENTS_CREATE_SQL_PG = "CREATE TABLE IF NOT EXISTS tool_consents (\n  viewer_email TEXT NOT NULL,\n  tool_id TEXT NOT NULL,\n  content_hash TEXT NOT NULL,\n  granted_at TEXT NOT NULL DEFAULT now(),\n  PRIMARY KEY (viewer_email, tool_id, content_hash)\n)";
export declare const EXTENSION_CONSENTS_VIEWER_INDEX_SQL = "CREATE INDEX IF NOT EXISTS tool_consents_viewer_idx ON tool_consents (viewer_email, tool_id)";
//# sourceMappingURL=schema.d.ts.map