/**
 * Drizzle schema for the extension-points slot system.
 *
 * Two tables:
 *
 * - `extension_slots`     — declarations: "extension X can render in slot Y".
 *                           Authored once per extension, regardless of installer.
 *                           Physical SQL name stays `tool_slots` (additive-only).
 * - `extension_slot_installs` — per-user installs: "user U wants extension X in
 *                               slot Y at position N". Always scoped by
 *                               owner_email. Physical SQL name stays
 *                               `tool_slot_installs`.
 *
 * Neither table spreads `ownableColumns()` — they're not first-class shareable
 * resources. Access to the underlying extension flows through the existing
 * `extensions` table sharing model; install rows are personal preferences
 * scoped to the installing user.
 */
export declare const extensionSlots: import("drizzle-orm/sqlite-core").SQLiteTableWithColumns<{
    name: "tool_slots";
    schema: undefined;
    columns: {
        id: import("drizzle-orm/sqlite-core").SQLiteColumn<{
            name: "id";
            tableName: "tool_slots";
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
            tableName: "tool_slots";
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
        slotId: import("drizzle-orm/sqlite-core").SQLiteColumn<{
            name: "slot_id";
            tableName: "tool_slots";
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
        config: import("drizzle-orm/sqlite-core").SQLiteColumn<{
            name: "config";
            tableName: "tool_slots";
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
            tableName: "tool_slots";
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
export declare const extensionSlotInstalls: import("drizzle-orm/sqlite-core").SQLiteTableWithColumns<{
    name: "tool_slot_installs";
    schema: undefined;
    columns: {
        id: import("drizzle-orm/sqlite-core").SQLiteColumn<{
            name: "id";
            tableName: "tool_slot_installs";
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
            tableName: "tool_slot_installs";
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
        slotId: import("drizzle-orm/sqlite-core").SQLiteColumn<{
            name: "slot_id";
            tableName: "tool_slot_installs";
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
            tableName: "tool_slot_installs";
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
        orgId: import("drizzle-orm/sqlite-core").SQLiteColumn<{
            name: "org_id";
            tableName: "tool_slot_installs";
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
        position: import("drizzle-orm/sqlite-core").SQLiteColumn<{
            name: "position";
            tableName: "tool_slot_installs";
            dataType: "number";
            columnType: "SQLiteInteger";
            data: number;
            driverParam: number;
            notNull: true;
            hasDefault: true;
            isPrimaryKey: false;
            isAutoincrement: false;
            hasRuntimeDefault: false;
            enumValues: undefined;
            baseColumn: never;
            identity: undefined;
            generated: undefined;
        }, {}, {}>;
        config: import("drizzle-orm/sqlite-core").SQLiteColumn<{
            name: "config";
            tableName: "tool_slot_installs";
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
            tableName: "tool_slot_installs";
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
            tableName: "tool_slot_installs";
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
export declare const EXTENSION_SLOTS_CREATE_SQL = "CREATE TABLE IF NOT EXISTS tool_slots (\n  id TEXT PRIMARY KEY,\n  tool_id TEXT NOT NULL,\n  slot_id TEXT NOT NULL,\n  config TEXT,\n  created_at TEXT NOT NULL DEFAULT (datetime('now'))\n)";
export declare const EXTENSION_SLOTS_CREATE_SQL_PG = "CREATE TABLE IF NOT EXISTS tool_slots (\n  id TEXT PRIMARY KEY,\n  tool_id TEXT NOT NULL,\n  slot_id TEXT NOT NULL,\n  config TEXT,\n  created_at TEXT NOT NULL DEFAULT now()\n)";
export declare const EXTENSION_SLOTS_BY_SLOT_INDEX_SQL = "CREATE INDEX IF NOT EXISTS tool_slots_by_slot_idx ON tool_slots (slot_id)";
export declare const EXTENSION_SLOTS_BY_EXTENSION_INDEX_SQL = "CREATE INDEX IF NOT EXISTS tool_slots_by_tool_idx ON tool_slots (tool_id)";
export declare const EXTENSION_SLOTS_UNIQUE_INDEX_SQL = "CREATE UNIQUE INDEX IF NOT EXISTS tool_slots_unique_idx ON tool_slots (tool_id, slot_id)";
export declare const EXTENSION_SLOT_INSTALLS_CREATE_SQL = "CREATE TABLE IF NOT EXISTS tool_slot_installs (\n  id TEXT PRIMARY KEY,\n  tool_id TEXT NOT NULL,\n  slot_id TEXT NOT NULL,\n  owner_email TEXT NOT NULL,\n  org_id TEXT,\n  position INTEGER NOT NULL DEFAULT 0,\n  config TEXT,\n  created_at TEXT NOT NULL DEFAULT (datetime('now')),\n  updated_at TEXT NOT NULL DEFAULT (datetime('now'))\n)";
export declare const EXTENSION_SLOT_INSTALLS_CREATE_SQL_PG = "CREATE TABLE IF NOT EXISTS tool_slot_installs (\n  id TEXT PRIMARY KEY,\n  tool_id TEXT NOT NULL,\n  slot_id TEXT NOT NULL,\n  owner_email TEXT NOT NULL,\n  org_id TEXT,\n  position INTEGER NOT NULL DEFAULT 0,\n  config TEXT,\n  created_at TEXT NOT NULL DEFAULT now(),\n  updated_at TEXT NOT NULL DEFAULT now()\n)";
export declare const EXTENSION_SLOT_INSTALLS_BY_USER_SLOT_INDEX_SQL = "CREATE INDEX IF NOT EXISTS tool_slot_installs_by_user_slot_idx ON tool_slot_installs (owner_email, slot_id)";
export declare const EXTENSION_SLOT_INSTALLS_UNIQUE_INDEX_SQL = "CREATE UNIQUE INDEX IF NOT EXISTS tool_slot_installs_unique_idx ON tool_slot_installs (owner_email, tool_id, slot_id)";
//# sourceMappingURL=schema.d.ts.map