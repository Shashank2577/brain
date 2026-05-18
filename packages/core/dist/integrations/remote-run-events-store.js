import { getDbExec, intType, retryOnDdlRace } from "../db/client.js";
let _initPromise;
async function ensureTable() {
    if (!_initPromise) {
        _initPromise = (async () => {
            const client = getDbExec();
            await retryOnDdlRace(() => client.execute(`
          CREATE TABLE IF NOT EXISTS integration_remote_run_events (
            device_id TEXT NOT NULL,
            remote_run_id TEXT NOT NULL,
            seq ${intType()} NOT NULL,
            event_json TEXT NOT NULL,
            created_at ${intType()} NOT NULL
          )
        `));
            await retryOnDdlRace(() => client.execute(`CREATE UNIQUE INDEX IF NOT EXISTS idx_remote_run_events_unique ON integration_remote_run_events(device_id, remote_run_id, seq)`));
            await retryOnDdlRace(() => client.execute(`CREATE INDEX IF NOT EXISTS idx_remote_run_events_run ON integration_remote_run_events(device_id, remote_run_id, seq)`));
        })();
    }
    return _initPromise;
}
function rowToRunEvent(row) {
    return {
        deviceId: row.device_id,
        remoteRunId: row.remote_run_id,
        seq: Number(row.seq ?? 0),
        event: parseJson(row.event_json, null),
        createdAt: Number(row.created_at ?? 0),
    };
}
export async function insertRemoteRunEvents(input) {
    await ensureTable();
    const client = getDbExec();
    const now = Date.now();
    let inserted = 0;
    for (const event of input.events) {
        const result = await client.execute({
            sql: `INSERT INTO integration_remote_run_events
              (device_id, remote_run_id, seq, event_json, created_at)
            VALUES (?, ?, ?, ?, ?)
            ON CONFLICT(device_id, remote_run_id, seq) DO NOTHING`,
            args: [
                input.deviceId,
                input.remoteRunId,
                event.seq,
                JSON.stringify(event.event ?? null),
                now,
            ],
        });
        inserted += result.rowsAffected ?? result.rowCount ?? 0;
    }
    return { inserted };
}
export async function listRemoteRunEvents(input) {
    await ensureTable();
    const { rows } = await getDbExec().execute({
        sql: `SELECT * FROM integration_remote_run_events
          WHERE device_id = ?
            AND remote_run_id = ?
            AND seq > ?
          ORDER BY seq ASC
          LIMIT ?`,
        args: [
            input.deviceId,
            input.remoteRunId,
            input.afterSeq ?? -1,
            input.limit ?? 500,
        ],
    });
    return rows.map((row) => rowToRunEvent(row));
}
function parseJson(value, fallback) {
    if (value == null)
        return fallback;
    try {
        return JSON.parse(String(value));
    }
    catch {
        return fallback;
    }
}
//# sourceMappingURL=remote-run-events-store.js.map