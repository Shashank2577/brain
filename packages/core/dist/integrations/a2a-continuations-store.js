import { getDbExec, isPostgres, intType, retryOnDdlRace, } from "../db/client.js";
import { isDuplicateColumnError } from "../db/migrations.js";
let _initPromise;
const PROCESSING_STUCK_AFTER_MS = 5 * 60 * 1000;
const PROCESSING_NEXT_CHECK_STALE_AFTER_MS = 60 * 1000;
async function ensureTable() {
    if (!_initPromise) {
        _initPromise = (async () => {
            const client = getDbExec();
            await retryOnDdlRace(() => client.execute(`
        CREATE TABLE IF NOT EXISTS integration_a2a_continuations (
          id TEXT PRIMARY KEY,
          integration_task_id TEXT NOT NULL,
          platform TEXT NOT NULL,
          external_thread_id TEXT NOT NULL,
          incoming_payload TEXT NOT NULL,
          placeholder_ref TEXT,
          owner_email TEXT NOT NULL,
          org_id TEXT,
          agent_name TEXT NOT NULL,
          agent_url TEXT NOT NULL,
          dedupe_key TEXT,
          a2a_task_id TEXT NOT NULL,
          a2a_auth_token TEXT,
          status TEXT NOT NULL,
          attempts ${intType()} NOT NULL DEFAULT 0,
          next_check_at ${intType()} NOT NULL,
          error_message TEXT,
          created_at ${intType()} NOT NULL,
          updated_at ${intType()} NOT NULL,
          completed_at ${intType()}
        )
      `));
            await retryOnDdlRace(() => client.execute(`CREATE INDEX IF NOT EXISTS idx_a2a_continuations_status_next ON integration_a2a_continuations(status, next_check_at)`));
            await retryOnDdlRace(() => client.execute(`CREATE INDEX IF NOT EXISTS idx_a2a_continuations_integration_task ON integration_a2a_continuations(integration_task_id)`));
            await retryOnDdlRace(() => client.execute(`CREATE UNIQUE INDEX IF NOT EXISTS idx_a2a_continuations_remote_task ON integration_a2a_continuations(integration_task_id, agent_url, a2a_task_id)`));
            await addColumnIfMissing("a2a_auth_token", "TEXT");
            await addColumnIfMissing("dedupe_key", "TEXT");
            await retryOnDdlRace(() => client.execute(`CREATE INDEX IF NOT EXISTS idx_a2a_continuations_dedupe_key ON integration_a2a_continuations(integration_task_id, agent_url, dedupe_key)`));
        })();
    }
    return _initPromise;
}
async function addColumnIfMissing(name, definition) {
    try {
        await retryOnDdlRace(() => getDbExec().execute(`ALTER TABLE integration_a2a_continuations ADD COLUMN ${name} ${definition}`));
    }
    catch (err) {
        if (isDuplicateColumnError(err))
            return;
        throw err;
    }
}
function rowToContinuation(row) {
    return {
        id: row.id,
        integrationTaskId: row.integration_task_id,
        platform: row.platform,
        externalThreadId: row.external_thread_id,
        incoming: JSON.parse(row.incoming_payload),
        placeholderRef: row.placeholder_ref ?? null,
        ownerEmail: row.owner_email,
        orgId: row.org_id ?? null,
        agentName: row.agent_name,
        agentUrl: row.agent_url,
        dedupeKey: row.dedupe_key ?? null,
        a2aTaskId: row.a2a_task_id,
        a2aAuthToken: row.a2a_auth_token ?? null,
        status: row.status,
        attempts: Number(row.attempts ?? 0),
        nextCheckAt: Number(row.next_check_at ?? 0),
        errorMessage: row.error_message ?? null,
        createdAt: Number(row.created_at ?? 0),
        updatedAt: Number(row.updated_at ?? 0),
        completedAt: row.completed_at == null ? null : Number(row.completed_at),
    };
}
export async function insertA2AContinuation(input) {
    await ensureTable();
    const client = getDbExec();
    const now = Date.now();
    const id = `a2a-cont-${now}-${Math.random().toString(36).slice(2, 8)}`;
    const payload = JSON.stringify(input.incoming);
    try {
        await client.execute({
            sql: `INSERT INTO integration_a2a_continuations
        (id, integration_task_id, platform, external_thread_id, incoming_payload,
         placeholder_ref, owner_email, org_id, agent_name, agent_url, dedupe_key, a2a_task_id, a2a_auth_token,
         status, attempts, next_check_at, created_at, updated_at)
        VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
            args: [
                id,
                input.integrationTaskId,
                input.platform,
                input.externalThreadId,
                payload,
                input.placeholderRef ?? null,
                input.ownerEmail,
                input.orgId ?? null,
                input.agentName,
                input.agentUrl,
                input.dedupeKey ?? null,
                input.a2aTaskId,
                input.a2aAuthToken ?? null,
                "pending",
                0,
                now,
                now,
                now,
            ],
        });
        return (await getA2AContinuation(id));
    }
    catch (err) {
        if (!isDuplicateContinuationError(err))
            throw err;
        const existing = await findA2AContinuation(input.integrationTaskId, input.agentUrl, input.a2aTaskId);
        if (existing)
            return existing;
        throw err;
    }
}
export async function getA2AContinuationForIntegrationTask(integrationTaskId) {
    await ensureTable();
    const client = getDbExec();
    const { rows } = await client.execute({
        sql: `SELECT * FROM integration_a2a_continuations
          WHERE integration_task_id = ?
          ORDER BY created_at ASC
          LIMIT 1`,
        args: [integrationTaskId],
    });
    return rows[0] ? rowToContinuation(rows[0]) : null;
}
export async function getA2AContinuationsForIntegrationTaskAgent(integrationTaskId, agentUrl, dedupeKey) {
    await ensureTable();
    const client = getDbExec();
    const { rows } = await client.execute(dedupeKey
        ? {
            sql: `SELECT * FROM integration_a2a_continuations
                WHERE integration_task_id = ? AND agent_url = ? AND dedupe_key = ?
                ORDER BY created_at ASC`,
            args: [integrationTaskId, agentUrl, dedupeKey],
        }
        : {
            sql: `SELECT * FROM integration_a2a_continuations
                WHERE integration_task_id = ? AND agent_url = ?
                ORDER BY created_at ASC`,
            args: [integrationTaskId, agentUrl],
        });
    return rows.map((row) => rowToContinuation(row));
}
function isDuplicateContinuationError(err) {
    const e = err;
    if (!e)
        return false;
    if (e.code === "23505")
        return true;
    const msg = String(e.message ?? "").toLowerCase();
    return (msg.includes("unique") ||
        msg.includes("duplicate entry") ||
        msg.includes("duplicate key"));
}
async function findA2AContinuation(integrationTaskId, agentUrl, a2aTaskId) {
    await ensureTable();
    const client = getDbExec();
    const { rows } = await client.execute({
        sql: `SELECT * FROM integration_a2a_continuations
          WHERE integration_task_id = ? AND agent_url = ? AND a2a_task_id = ?
          LIMIT 1`,
        args: [integrationTaskId, agentUrl, a2aTaskId],
    });
    return rows[0] ? rowToContinuation(rows[0]) : null;
}
export async function getA2AContinuation(id) {
    await ensureTable();
    const client = getDbExec();
    const { rows } = await client.execute({
        sql: `SELECT * FROM integration_a2a_continuations WHERE id = ? LIMIT 1`,
        args: [id],
    });
    return rows[0] ? rowToContinuation(rows[0]) : null;
}
export async function claimA2AContinuation(id) {
    await ensureTable();
    const client = getDbExec();
    const now = Date.now();
    const processingCutoff = now - PROCESSING_STUCK_AFTER_MS;
    const staleNextCheckCutoff = now - PROCESSING_NEXT_CHECK_STALE_AFTER_MS;
    const result = await client.execute({
        sql: isPostgres()
            ? `UPDATE integration_a2a_continuations
           SET status = ?, attempts = attempts + 1, updated_at = ?
         WHERE id = ?
           AND (
             status = 'pending'
             OR (
               status = 'processing'
               AND (updated_at <= ? OR next_check_at <= ?)
             )
           )
         RETURNING *`
            : `UPDATE integration_a2a_continuations
           SET status = ?, attempts = attempts + 1, updated_at = ?
         WHERE id = ?
           AND (
             status = 'pending'
             OR (
               status = 'processing'
               AND (updated_at <= ? OR next_check_at <= ?)
             )
           )`,
        args: ["processing", now, id, processingCutoff, staleNextCheckCutoff],
    });
    const rows = result.rows ?? [];
    if (isPostgres()) {
        return rows[0]
            ? rowToContinuation(rows[0])
            : null;
    }
    const affected = result?.rowsAffected ?? result?.rowCount;
    if (affected === 0)
        return null;
    const fetched = await getA2AContinuation(id);
    if (!fetched || fetched.status !== "processing")
        return null;
    return fetched;
}
export async function claimDueA2AContinuations(limit = 5) {
    await ensureTable();
    const client = getDbExec();
    const now = Date.now();
    const processingCutoff = now - PROCESSING_STUCK_AFTER_MS;
    const staleNextCheckCutoff = now - PROCESSING_NEXT_CHECK_STALE_AFTER_MS;
    // If a processor dies while holding a delivery claim, retry the final send.
    // The stale cutoff preserves the in-flight delivery guard while keeping
    // final integration replies at-least-once.
    await client.execute({
        sql: `UPDATE integration_a2a_continuations
          SET status = ?, next_check_at = ?, updated_at = ?
          WHERE status = 'delivering' AND updated_at <= ?`,
        args: ["pending", now, now, now - 5 * 60 * 1000],
    });
    await client.execute({
        sql: `UPDATE integration_a2a_continuations
          SET status = ?, next_check_at = ?, updated_at = ?
          WHERE status = 'processing'
            AND (updated_at <= ? OR next_check_at <= ?)`,
        args: ["pending", now, now, processingCutoff, staleNextCheckCutoff],
    });
    const { rows } = await client.execute({
        sql: `SELECT id FROM integration_a2a_continuations
          WHERE status = 'pending' AND next_check_at <= ?
          ORDER BY next_check_at ASC
          LIMIT ?`,
        args: [now, limit],
    });
    const claimed = [];
    for (const row of rows) {
        const continuation = await claimA2AContinuation(row.id);
        if (continuation)
            claimed.push(continuation);
    }
    return claimed;
}
export async function claimA2AContinuationDelivery(id) {
    await ensureTable();
    const client = getDbExec();
    const now = Date.now();
    const result = await client.execute({
        sql: isPostgres()
            ? `UPDATE integration_a2a_continuations
           SET status = ?, updated_at = ?
         WHERE id = ? AND status = 'processing'
         RETURNING *`
            : `UPDATE integration_a2a_continuations
           SET status = ?, updated_at = ?
         WHERE id = ? AND status = 'processing'`,
        args: ["delivering", now, id],
    });
    const rows = result.rows ?? [];
    if (isPostgres()) {
        return rows[0]
            ? rowToContinuation(rows[0])
            : null;
    }
    const affected = result?.rowsAffected ?? result?.rowCount;
    if (affected === 0)
        return null;
    const fetched = await getA2AContinuation(id);
    if (!fetched || fetched.status !== "delivering")
        return null;
    return fetched;
}
export async function rescheduleA2AContinuation(id, delayMs) {
    await ensureTable();
    const client = getDbExec();
    const now = Date.now();
    await client.execute({
        sql: `UPDATE integration_a2a_continuations
          SET status = ?, next_check_at = ?, updated_at = ?
          WHERE id = ? AND status IN ('processing', 'delivering')`,
        args: ["pending", now + delayMs, now, id],
    });
}
export async function completeA2AContinuation(id) {
    await ensureTable();
    const client = getDbExec();
    const now = Date.now();
    await client.execute({
        sql: `UPDATE integration_a2a_continuations
          SET status = ?, updated_at = ?, completed_at = ?
          WHERE id = ? AND status IN ('processing', 'delivering', 'completed')`,
        args: ["completed", now, now, id],
    });
}
export async function failA2AContinuation(id, errorMessage) {
    await ensureTable();
    const client = getDbExec();
    const now = Date.now();
    await client.execute({
        sql: `UPDATE integration_a2a_continuations
          SET status = ?, updated_at = ?, error_message = ?
          WHERE id = ? AND status <> 'completed'`,
        args: ["failed", now, errorMessage.slice(0, 2000), id],
    });
}
//# sourceMappingURL=a2a-continuations-store.js.map