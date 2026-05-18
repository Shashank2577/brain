import { getDbExec, isPostgres, intType, retryOnDdlRace, } from "../db/client.js";
let _initPromise;
async function ensureTable() {
    if (!_initPromise) {
        _initPromise = (async () => {
            const client = getDbExec();
            await retryOnDdlRace(() => client.execute(`
          CREATE TABLE IF NOT EXISTS integration_configs (
            platform TEXT NOT NULL,
            config_key TEXT NOT NULL,
            config_data TEXT NOT NULL,
            owner TEXT,
            updated_at ${intType()} NOT NULL,
            PRIMARY KEY (platform, config_key)
          )
        `));
        })().catch((err) => {
            // Don't cache the rejection — let the next caller retry a fresh init.
            _initPromise = undefined;
            throw err;
        });
    }
    return _initPromise;
}
/**
 * Get the config for a platform integration.
 */
export async function getIntegrationConfig(platform, configKey = "default") {
    await ensureTable();
    const client = getDbExec();
    const { rows } = await client.execute({
        sql: `SELECT platform, config_key, config_data, owner, updated_at FROM integration_configs WHERE platform = ? AND config_key = ?`,
        args: [platform, configKey],
    });
    if (rows.length === 0)
        return null;
    const row = rows[0];
    return {
        platform: row.platform,
        configKey: row.config_key,
        configData: JSON.parse(row.config_data),
        owner: row.owner ?? null,
        updatedAt: row.updated_at,
    };
}
/**
 * Save or update a platform integration config.
 */
export async function saveIntegrationConfig(platform, configData, configKey = "default", owner) {
    await ensureTable();
    const client = getDbExec();
    await client.execute({
        sql: isPostgres()
            ? `INSERT INTO integration_configs (platform, config_key, config_data, owner, updated_at) VALUES (?, ?, ?, ?, ?) ON CONFLICT (platform, config_key) DO UPDATE SET config_data=EXCLUDED.config_data, owner=EXCLUDED.owner, updated_at=EXCLUDED.updated_at`
            : `INSERT OR REPLACE INTO integration_configs (platform, config_key, config_data, owner, updated_at) VALUES (?, ?, ?, ?, ?)`,
        args: [
            platform,
            configKey,
            JSON.stringify(configData),
            owner ?? null,
            Date.now(),
        ],
    });
}
/**
 * Delete a platform integration config.
 */
export async function deleteIntegrationConfig(platform, configKey = "default") {
    await ensureTable();
    const client = getDbExec();
    await client.execute({
        sql: `DELETE FROM integration_configs WHERE platform = ? AND config_key = ?`,
        args: [platform, configKey],
    });
}
/**
 * List all configs for a platform.
 */
export async function listIntegrationConfigs(platform) {
    await ensureTable();
    const client = getDbExec();
    const { rows } = platform
        ? await client.execute({
            sql: `SELECT platform, config_key, config_data, owner, updated_at FROM integration_configs WHERE platform = ?`,
            args: [platform],
        })
        : await client.execute(`SELECT platform, config_key, config_data, owner, updated_at FROM integration_configs`);
    return rows.map((row) => ({
        platform: row.platform,
        configKey: row.config_key,
        configData: JSON.parse(row.config_data),
        owner: row.owner ?? null,
        updatedAt: row.updated_at,
    }));
}
//# sourceMappingURL=config-store.js.map