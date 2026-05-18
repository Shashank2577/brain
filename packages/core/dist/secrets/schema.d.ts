/**
 * Drizzle schema for the framework secrets registry.
 *
 * The `app_secrets` table stores API keys and service credentials that
 * templates register via `registerRequiredSecret()`. Values are always
 * stored encrypted at rest — see `storage.ts` for the crypto layer.
 *
 * Rows are scoped either to a user (by email) or a workspace / organization
 * (by orgId). OAuth-kind secrets never create a row here — they surface via
 * `@agent-native/core/oauth-tokens` instead.
 */
export declare const appSecrets: import("drizzle-orm/sqlite-core").SQLiteTableWithColumns<{
    name: "app_secrets";
    schema: undefined;
    columns: {
        id: import("drizzle-orm/sqlite-core").SQLiteColumn<{
            name: "id";
            tableName: "app_secrets";
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
        scope: import("drizzle-orm/sqlite-core").SQLiteColumn<{
            name: "scope";
            tableName: "app_secrets";
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
        scopeId: import("drizzle-orm/sqlite-core").SQLiteColumn<{
            name: "scope_id";
            tableName: "app_secrets";
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
        key: import("drizzle-orm/sqlite-core").SQLiteColumn<{
            name: "key";
            tableName: "app_secrets";
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
        encryptedValue: import("drizzle-orm/sqlite-core").SQLiteColumn<{
            name: "encrypted_value";
            tableName: "app_secrets";
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
            tableName: "app_secrets";
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
        urlAllowlist: import("drizzle-orm/sqlite-core").SQLiteColumn<{
            name: "url_allowlist";
            tableName: "app_secrets";
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
            tableName: "app_secrets";
            dataType: "number";
            columnType: "SQLiteInteger";
            data: number;
            driverParam: number;
            notNull: true;
            hasDefault: false;
            isPrimaryKey: false;
            isAutoincrement: false;
            hasRuntimeDefault: false;
            enumValues: undefined;
            baseColumn: never;
            identity: undefined;
            generated: undefined;
        }, {}, {}>;
        updatedAt: import("drizzle-orm/sqlite-core").SQLiteColumn<{
            name: "updated_at";
            tableName: "app_secrets";
            dataType: "number";
            columnType: "SQLiteInteger";
            data: number;
            driverParam: number;
            notNull: true;
            hasDefault: false;
            isPrimaryKey: false;
            isAutoincrement: false;
            hasRuntimeDefault: false;
            enumValues: undefined;
            baseColumn: never;
            identity: undefined;
            generated: undefined;
        }, {}, {}>;
    };
    dialect: "sqlite";
}>;
/**
 * Raw SQL for creating the app_secrets table. Used by the on-demand
 * `ensureTable()` path in `storage.ts` and by any template-level migration
 * that wants to create the table up-front.
 */
export declare const APP_SECRETS_CREATE_SQL = "CREATE TABLE IF NOT EXISTS app_secrets (\n  id TEXT PRIMARY KEY,\n  scope TEXT NOT NULL,\n  scope_id TEXT NOT NULL,\n  key TEXT NOT NULL,\n  encrypted_value TEXT NOT NULL,\n  description TEXT,\n  url_allowlist TEXT,\n  created_at INTEGER NOT NULL,\n  updated_at INTEGER NOT NULL,\n  UNIQUE(scope, scope_id, key)\n)";
//# sourceMappingURL=schema.d.ts.map