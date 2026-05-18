import { getDbExec, intType, isPostgres, retryOnDdlRace, } from "../db/client.js";
let _initPromise;
const REMOTE_COMMAND_KINDS = [
    "create-run",
    "list-runs",
    "get-run",
    "append-followup",
    "approve",
    "deny",
    "stop",
    "status",
];
const TERMINAL_STATUSES = new Set(["completed", "failed"]);
async function ensureTable() {
    if (!_initPromise) {
        _initPromise = (async () => {
            const client = getDbExec();
            await retryOnDdlRace(() => client.execute(`
          CREATE TABLE IF NOT EXISTS integration_remote_commands (
            id TEXT PRIMARY KEY,
            device_id TEXT NOT NULL,
            owner_email TEXT NOT NULL,
            org_id TEXT,
            kind TEXT NOT NULL,
            params_json TEXT NOT NULL,
            status TEXT NOT NULL,
            result_json TEXT,
            platform TEXT,
            external_thread_id TEXT,
            attempts ${intType()} NOT NULL DEFAULT 0,
            next_check_at ${intType()} NOT NULL,
            claimed_at ${intType()},
            completed_at ${intType()},
            error_message TEXT,
            created_at ${intType()} NOT NULL,
            updated_at ${intType()} NOT NULL
          )
        `));
            await retryOnDdlRace(() => client.execute(`CREATE INDEX IF NOT EXISTS idx_remote_commands_device_status_next ON integration_remote_commands(device_id, status, next_check_at)`));
            await retryOnDdlRace(() => client.execute(`CREATE INDEX IF NOT EXISTS idx_remote_commands_owner ON integration_remote_commands(owner_email, org_id)`));
        })();
    }
    return _initPromise;
}
function rowToCommand(row) {
    return {
        id: row.id,
        deviceId: row.device_id,
        ownerEmail: row.owner_email,
        orgId: row.org_id ?? null,
        kind: row.kind,
        params: parseJson(row.params_json, {}),
        status: row.status,
        result: parseJson(row.result_json, null),
        platform: row.platform ?? null,
        externalThreadId: row.external_thread_id ?? null,
        attempts: Number(row.attempts ?? 0),
        nextCheckAt: Number(row.next_check_at ?? 0),
        claimedAt: row.claimed_at == null ? null : Number(row.claimed_at),
        completedAt: row.completed_at == null ? null : Number(row.completed_at),
        errorMessage: row.error_message ?? null,
        createdAt: Number(row.created_at ?? 0),
        updatedAt: Number(row.updated_at ?? 0),
    };
}
export function isRemoteCommandKind(value) {
    return (typeof value === "string" &&
        REMOTE_COMMAND_KINDS.includes(value));
}
export async function enqueueRemoteCommand(input) {
    await ensureTable();
    const client = getDbExec();
    const now = Date.now();
    const id = `remote-command-${now}-${randomHex(8)}`;
    await client.execute({
        sql: `INSERT INTO integration_remote_commands
      (id, device_id, owner_email, org_id, kind, params_json, status, result_json,
       platform, external_thread_id, attempts, next_check_at, created_at, updated_at)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
        args: [
            id,
            input.deviceId,
            input.ownerEmail,
            input.orgId ?? null,
            input.kind,
            JSON.stringify(input.params ?? {}),
            "pending",
            null,
            input.platform ?? null,
            input.externalThreadId ?? null,
            0,
            input.nextCheckAt ?? now,
            now,
            now,
        ],
    });
    const command = await getRemoteCommand(id);
    if (!command)
        throw new Error("remote command insert failed");
    return command;
}
export async function getRemoteCommand(id) {
    await ensureTable();
    const { rows } = await getDbExec().execute({
        sql: `SELECT * FROM integration_remote_commands WHERE id = ? LIMIT 1`,
        args: [id],
    });
    return rows[0] ? rowToCommand(rows[0]) : null;
}
export async function listRemoteCommandsForOwner(input) {
    await ensureTable();
    const limit = Math.max(1, Math.min(input.limit ?? 100, 250));
    if (!Object.prototype.hasOwnProperty.call(input, "orgId")) {
        const { rows } = await getDbExec().execute({
            sql: `SELECT * FROM integration_remote_commands
            WHERE owner_email = ?
            ORDER BY updated_at DESC
            LIMIT ?`,
            args: [input.ownerEmail, limit],
        });
        return rows.map((row) => rowToCommand(row));
    }
    const { rows } = await getDbExec().execute({
        sql: `SELECT * FROM integration_remote_commands
          WHERE owner_email = ?
            AND ((org_id IS NULL AND ? IS NULL) OR org_id = ?)
          ORDER BY updated_at DESC
          LIMIT ?`,
        args: [input.ownerEmail, input.orgId ?? null, input.orgId ?? null, limit],
    });
    return rows.map((row) => rowToCommand(row));
}
export async function claimNextRemoteCommand(deviceId) {
    await ensureTable();
    const client = getDbExec();
    const now = Date.now();
    const { rows } = await client.execute({
        sql: `SELECT id FROM integration_remote_commands
          WHERE device_id = ?
            AND status = 'pending'
            AND next_check_at <= ?
          ORDER BY created_at ASC
          LIMIT 1`,
        args: [deviceId, now],
    });
    const id = rows[0]?.id;
    if (!id)
        return null;
    const result = await client.execute({
        sql: isPostgres()
            ? `UPDATE integration_remote_commands
          SET status = ?, attempts = attempts + 1, claimed_at = ?, updated_at = ?
          WHERE id = ? AND device_id = ? AND status = 'pending'
          RETURNING *`
            : `UPDATE integration_remote_commands
          SET status = ?, attempts = attempts + 1, claimed_at = ?, updated_at = ?
          WHERE id = ? AND device_id = ? AND status = 'pending'`,
        args: ["claimed", now, now, id, deviceId],
    });
    if (isPostgres()) {
        const row = result.rows?.[0];
        return row ? rowToCommand(row) : null;
    }
    const affected = result.rowsAffected ?? result.rowCount;
    if (affected === 0)
        return null;
    const command = await getRemoteCommand(id);
    if (!command || command.status !== "claimed")
        return null;
    return command;
}
export async function updateRemoteCommandResult(input) {
    await ensureTable();
    const client = getDbExec();
    const now = Date.now();
    const completedAt = TERMINAL_STATUSES.has(input.status) ? now : null;
    const resultJson = input.result === undefined ? undefined : JSON.stringify(input.result);
    await client.execute({
        sql: `UPDATE integration_remote_commands
          SET status = ?,
              result_json = COALESCE(?, result_json),
              error_message = ?,
              completed_at = COALESCE(?, completed_at),
              updated_at = ?
          WHERE id = ? AND device_id = ?`,
        args: [
            input.status,
            resultJson ?? null,
            input.errorMessage ? input.errorMessage.slice(0, 2000) : null,
            completedAt,
            now,
            input.commandId,
            input.deviceId,
        ],
    });
    const command = await getRemoteCommand(input.commandId);
    if (!command || command.deviceId !== input.deviceId)
        return null;
    return command;
}
export async function retryStaleRemoteCommands(options) {
    await ensureTable();
    const client = getDbExec();
    const now = Date.now();
    const claimedCutoff = now - (options?.claimedStaleAfterMs ?? 75_000);
    const runningCutoff = now - (options?.runningStaleAfterMs ?? 5 * 60_000);
    const maxAttempts = options?.maxAttempts ?? 3;
    const limit = options?.limit ?? 50;
    const { rows } = await client.execute({
        sql: `SELECT id, status, attempts FROM integration_remote_commands
          WHERE (status = 'claimed' AND updated_at <= ?)
             OR (status = 'running' AND updated_at <= ?)
          ORDER BY updated_at ASC
          LIMIT ?`,
        args: [claimedCutoff, runningCutoff, limit],
    });
    let retried = 0;
    let failed = 0;
    for (const row of rows) {
        const id = row.id;
        const status = row.status;
        const attempts = Number(row.attempts ?? 0);
        if (attempts >= maxAttempts) {
            const result = await client.execute({
                sql: `UPDATE integration_remote_commands
              SET status = 'failed',
                  error_message = COALESCE(error_message, ?),
                  completed_at = ?,
                  updated_at = ?
              WHERE id = ? AND status = ?`,
                args: [
                    `Retry job: exceeded ${maxAttempts} attempts`,
                    now,
                    now,
                    id,
                    status,
                ],
            });
            if ((result.rowsAffected ?? result.rowCount) > 0)
                failed++;
            continue;
        }
        const result = await client.execute({
            sql: `UPDATE integration_remote_commands
            SET status = 'pending',
                next_check_at = ?,
                updated_at = ?
            WHERE id = ? AND status = ?`,
            args: [now, now, id, status],
        });
        if ((result.rowsAffected ?? result.rowCount) > 0)
            retried++;
    }
    return { retried, failed };
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
function randomHex(byteLength) {
    const bytes = new Uint8Array(byteLength);
    globalThis.crypto.getRandomValues(bytes);
    return Array.from(bytes)
        .map((byte) => byte.toString(16).padStart(2, "0"))
        .join("");
}
//# sourceMappingURL=remote-commands-store.js.map