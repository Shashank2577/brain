import { getDbExec, isPostgres, intType } from "../db/client.js";
let _initPromise;
async function ensureTable() {
    if (!_initPromise) {
        _initPromise = (async () => {
            const client = getDbExec();
            await client.execute(`
        CREATE TABLE IF NOT EXISTS integration_thread_mappings (
          platform TEXT NOT NULL,
          external_thread_id TEXT NOT NULL,
          internal_thread_id TEXT NOT NULL,
          platform_context TEXT NOT NULL DEFAULT '{}',
          created_at ${intType()} NOT NULL,
          updated_at ${intType()} NOT NULL,
          PRIMARY KEY (platform, external_thread_id)
        )
      `);
        })();
    }
    return _initPromise;
}
/**
 * Look up the internal thread ID for an external platform thread.
 */
export async function getThreadMapping(platform, externalThreadId) {
    await ensureTable();
    const client = getDbExec();
    const { rows } = await client.execute({
        sql: `SELECT platform, external_thread_id, internal_thread_id, platform_context, created_at, updated_at FROM integration_thread_mappings WHERE platform = ? AND external_thread_id = ?`,
        args: [platform, externalThreadId],
    });
    if (rows.length === 0)
        return null;
    const row = rows[0];
    return {
        platform: row.platform,
        externalThreadId: row.external_thread_id,
        internalThreadId: row.internal_thread_id,
        platformContext: JSON.parse(row.platform_context),
        createdAt: row.created_at,
        updatedAt: row.updated_at,
    };
}
/**
 * Create or update a thread mapping.
 */
export async function saveThreadMapping(platform, externalThreadId, internalThreadId, platformContext = {}) {
    await ensureTable();
    const client = getDbExec();
    const now = Date.now();
    await client.execute({
        sql: isPostgres()
            ? `INSERT INTO integration_thread_mappings (platform, external_thread_id, internal_thread_id, platform_context, created_at, updated_at) VALUES (?, ?, ?, ?, ?, ?) ON CONFLICT (platform, external_thread_id) DO UPDATE SET internal_thread_id=EXCLUDED.internal_thread_id, platform_context=EXCLUDED.platform_context, updated_at=EXCLUDED.updated_at`
            : `INSERT OR REPLACE INTO integration_thread_mappings (platform, external_thread_id, internal_thread_id, platform_context, created_at, updated_at) VALUES (?, ?, ?, ?, ?, ?)`,
        args: [
            platform,
            externalThreadId,
            internalThreadId,
            JSON.stringify(platformContext),
            now,
            now,
        ],
    });
}
/**
 * Delete a thread mapping.
 */
export async function deleteThreadMapping(platform, externalThreadId) {
    await ensureTable();
    const client = getDbExec();
    await client.execute({
        sql: `DELETE FROM integration_thread_mappings WHERE platform = ? AND external_thread_id = ?`,
        args: [platform, externalThreadId],
    });
}
/**
 * List all thread mappings for a platform.
 */
export async function listThreadMappings(platform) {
    await ensureTable();
    const client = getDbExec();
    const { rows } = await client.execute({
        sql: `SELECT platform, external_thread_id, internal_thread_id, platform_context, created_at, updated_at FROM integration_thread_mappings WHERE platform = ?`,
        args: [platform],
    });
    return rows.map((row) => ({
        platform: row.platform,
        externalThreadId: row.external_thread_id,
        internalThreadId: row.internal_thread_id,
        platformContext: JSON.parse(row.platform_context),
        createdAt: row.created_at,
        updatedAt: row.updated_at,
    }));
}
//# sourceMappingURL=thread-mapping-store.js.map