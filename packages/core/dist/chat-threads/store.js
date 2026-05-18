import { getDbExec, intType } from "../db/client.js";
import { mergeThreadDataForClientSave, normalizeThreadRepository, } from "../agent/thread-data-builder.js";
import { emitChatThreadChange } from "./emitter.js";
let _initPromise;
/**
 * Per-thread async mutex. Read-modify-write on the `thread_data` JSON blob
 * is not atomic at the DB level — two concurrent callers (e.g. the UI
 * persisting queued messages while `onRunComplete` appends agent output)
 * would both read the same row, each mutate it independently, and the
 * second write clobbers the first. Serializing on thread id inside this
 * process eliminates the race for the usual single-process deployment
 * while leaving straight reads and other thread-data-unrelated updates
 * untouched.
 *
 * Cross-process races are handled by `updateThreadData`, which performs a
 * compare-and-swap on `updated_at`, rereads the latest row on conflict, and
 * remerges message history before retrying.
 */
const _threadDataLocks = new Map();
export function withThreadDataLock(threadId, fn) {
    const prev = _threadDataLocks.get(threadId) ?? Promise.resolve();
    const next = prev.then(fn, fn);
    _threadDataLocks.set(threadId, next);
    // Use `.then(cleanup, cleanup)` (not `.finally`) so the rejection is
    // observed on this chained promise — otherwise any failure inside `fn`
    // triggers `unhandledRejection` on the discarded `finally()` return.
    // The caller still sees the rejection via `next`.
    const cleanup = () => {
        if (_threadDataLocks.get(threadId) === next) {
            _threadDataLocks.delete(threadId);
        }
    };
    next.then(cleanup, cleanup);
    return next;
}
async function ensureTable() {
    if (!_initPromise) {
        _initPromise = (async () => {
            const client = getDbExec();
            await client.execute(`
        CREATE TABLE IF NOT EXISTS chat_threads (
          id TEXT PRIMARY KEY,
          owner_email TEXT NOT NULL,
          title TEXT NOT NULL DEFAULT '',
          preview TEXT NOT NULL DEFAULT '',
          thread_data TEXT NOT NULL DEFAULT '{}',
          message_count ${intType()} NOT NULL DEFAULT 0,
          created_at ${intType()} NOT NULL,
          updated_at ${intType()} NOT NULL,
          scope_type TEXT,
          scope_id TEXT,
          scope_label TEXT
        )
      `);
            // Additive migration for existing tables. Both SQLite and Postgres
            // accept `ALTER TABLE ADD COLUMN` and will raise when the column
            // already exists; the try/catch makes the call idempotent across
            // both dialects without requiring an information_schema probe.
            for (const col of ["scope_type", "scope_id", "scope_label"]) {
                try {
                    await client.execute(`ALTER TABLE chat_threads ADD COLUMN ${col} TEXT`);
                }
                catch {
                    // Column already exists.
                }
            }
        })();
    }
    return _initPromise;
}
function generateId() {
    return `thread-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;
}
function readScope(r) {
    const type = r.scope_type;
    const id = r.scope_id;
    if (!type || !id)
        return null;
    const label = r.scope_label;
    return label ? { type, id, label } : { type, id };
}
function normalizeForkSourceSnapshot(source) {
    if (!source || typeof source.threadData !== "string")
        return null;
    const threadData = source.threadData.trim();
    if (!threadData)
        return null;
    let parsed;
    try {
        parsed = normalizeThreadRepository(JSON.parse(threadData));
    }
    catch {
        return null;
    }
    const repoMessageCount = Array.isArray(parsed.messages)
        ? parsed.messages.length
        : 0;
    if (repoMessageCount <= 0)
        return null;
    return {
        threadData: JSON.stringify(parsed),
        title: typeof source.title === "string" ? source.title : "",
        preview: typeof source.preview === "string" ? source.preview : "",
        messageCount: repoMessageCount,
        ...(Object.prototype.hasOwnProperty.call(source, "scope")
            ? { scope: source.scope ?? null }
            : {}),
    };
}
function deriveMessageCount(threadData, fallback) {
    if (typeof threadData !== "string" || !threadData.trim())
        return fallback;
    try {
        const repo = normalizeThreadRepository(JSON.parse(threadData));
        if (Array.isArray(repo.messages))
            return repo.messages.length;
    }
    catch {
        // Keep the stored count if the JSON blob is malformed.
    }
    return fallback;
}
function rowToThread(r) {
    const threadData = r.thread_data ?? "{}";
    const storedCount = Number(r.message_count);
    return {
        id: r.id,
        ownerEmail: r.owner_email,
        title: r.title,
        preview: r.preview,
        threadData,
        messageCount: deriveMessageCount(threadData, storedCount),
        createdAt: Number(r.created_at),
        updatedAt: Number(r.updated_at),
        scope: readScope(r),
    };
}
function rowToSummary(r) {
    const threadData = r.thread_data;
    const storedCount = Number(r.message_count);
    const messageCount = deriveMessageCount(threadData, storedCount);
    if (messageCount <= 0)
        return null;
    return {
        id: r.id,
        title: r.title,
        preview: r.preview,
        messageCount,
        createdAt: Number(r.created_at),
        updatedAt: Number(r.updated_at),
        scope: readScope(r),
    };
}
export async function createThread(ownerEmail, opts) {
    await ensureTable();
    const client = getDbExec();
    const id = opts?.id ?? generateId();
    const now = Date.now();
    const title = opts?.title ?? "";
    const scope = opts?.scope ?? null;
    await client.execute({
        sql: `INSERT INTO chat_threads (id, owner_email, title, preview, thread_data, message_count, created_at, updated_at, scope_type, scope_id, scope_label) VALUES (?, ?, ?, '', '{}', 0, ?, ?, ?, ?, ?)`,
        args: [
            id,
            ownerEmail,
            title,
            now,
            now,
            scope?.type ?? null,
            scope?.id ?? null,
            scope?.label ?? null,
        ],
    });
    return {
        id,
        ownerEmail,
        title,
        preview: "",
        threadData: "{}",
        messageCount: 0,
        createdAt: now,
        updatedAt: now,
        scope,
    };
}
const THREAD_COLUMNS = `id, owner_email, title, preview, thread_data, message_count, created_at, updated_at, scope_type, scope_id, scope_label`;
const SUMMARY_COLUMNS = `id, title, preview, thread_data, message_count, created_at, updated_at, scope_type, scope_id, scope_label`;
export async function getThread(id) {
    await ensureTable();
    const client = getDbExec();
    const { rows } = await client.execute({
        sql: `SELECT ${THREAD_COLUMNS} FROM chat_threads WHERE id = ?`,
        args: [id],
    });
    if (rows.length === 0)
        return null;
    return rowToThread(rows[0]);
}
export async function forkThread(sourceId, ownerEmail, opts) {
    const snapshot = normalizeForkSourceSnapshot(opts?.source);
    let source = await getThread(sourceId);
    if (!source) {
        if (snapshot) {
            try {
                await createThread(ownerEmail, {
                    id: sourceId,
                    title: snapshot.title,
                    scope: snapshot.scope ?? null,
                });
            }
            catch {
                // The agent run may have created the row while the user clicked Fork.
            }
            const created = await getThread(sourceId);
            if (created?.ownerEmail === ownerEmail) {
                await updateThreadData(sourceId, snapshot.threadData, snapshot.title || created.title, snapshot.preview || created.preview, snapshot.messageCount);
                if (Object.prototype.hasOwnProperty.call(snapshot, "scope")) {
                    await setThreadScope(sourceId, snapshot.scope ?? null);
                }
                source = await getThread(sourceId);
            }
        }
    }
    else if (snapshot &&
        source.ownerEmail === ownerEmail &&
        snapshot.messageCount > source.messageCount) {
        // The source row exists but the in-memory snapshot is fresher — the agent
        // run flushed an older state to SQL, but the tab has additional unflushed
        // messages. Overlay the snapshot before cloning so the fork captures the
        // latest user-visible content. Guard with messageCount > stored to avoid
        // clobbering a fresher persisted row with a stale snapshot from another
        // tab.
        source = {
            ...source,
            threadData: snapshot.threadData,
            title: snapshot.title || source.title,
            preview: snapshot.preview || source.preview,
            messageCount: snapshot.messageCount,
        };
    }
    if (!source || source.ownerEmail !== ownerEmail)
        return null;
    const id = opts?.id ?? generateId();
    const now = Date.now();
    const title = source.title ? `${source.title} (fork)` : "";
    const client = getDbExec();
    await client.execute({
        sql: `INSERT INTO chat_threads (id, owner_email, title, preview, thread_data, message_count, created_at, updated_at, scope_type, scope_id, scope_label) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
        args: [
            id,
            ownerEmail,
            title,
            source.preview,
            source.threadData,
            source.messageCount,
            now,
            now,
            source.scope?.type ?? null,
            source.scope?.id ?? null,
            source.scope?.label ?? null,
        ],
    });
    return {
        id,
        ownerEmail,
        title,
        preview: source.preview,
        threadData: source.threadData,
        messageCount: source.messageCount,
        createdAt: now,
        updatedAt: now,
        scope: source.scope,
    };
}
export async function listThreads(ownerEmail, options = {}, legacyOffset) {
    await ensureTable();
    // Back-compat shim: previous signature was (owner, limit, offset).
    const opts = typeof options === "number"
        ? { limit: options, offset: legacyOffset ?? 0 }
        : options;
    const limit = opts.limit ?? 50;
    const offset = opts.offset ?? 0;
    const client = getDbExec();
    const filters = [
        `owner_email = ?`,
        `(message_count > 0 OR thread_data LIKE '%"messages"%')`,
    ];
    const args = [ownerEmail];
    if (opts.scope) {
        filters.push(`scope_type = ? AND scope_id = ?`);
        args.push(opts.scope.type, opts.scope.id);
    }
    else if (opts.unscopedOnly) {
        filters.push(`scope_type IS NULL`);
    }
    args.push(limit, offset);
    const { rows } = await client.execute({
        sql: `SELECT ${SUMMARY_COLUMNS} FROM chat_threads WHERE ${filters.join(" AND ")} ORDER BY updated_at DESC LIMIT ? OFFSET ?`,
        args,
    });
    return rows
        .map((r) => rowToSummary(r))
        .filter((r) => r !== null);
}
function escapeLike(s) {
    return s.replace(/([\\%_])/g, "\\$1");
}
export async function searchThreads(ownerEmail, query, limit = 50, options = {}) {
    await ensureTable();
    const client = getDbExec();
    const pattern = `%${escapeLike(query)}%`;
    const filters = [
        `owner_email = ?`,
        `(message_count > 0 OR thread_data LIKE '%"messages"%')`,
        `(title LIKE ? OR preview LIKE ? OR thread_data LIKE ?)`,
    ];
    const args = [ownerEmail, pattern, pattern, pattern];
    if (options.scope) {
        filters.push(`scope_type = ? AND scope_id = ?`);
        args.push(options.scope.type, options.scope.id);
    }
    args.push(limit);
    const { rows } = await client.execute({
        sql: `SELECT ${SUMMARY_COLUMNS} FROM chat_threads WHERE ${filters.join(" AND ")} ORDER BY updated_at DESC LIMIT ?`,
        args,
    });
    return rows
        .map((r) => rowToSummary(r))
        .filter((r) => r !== null);
}
/**
 * Detach or rebind a chat's scope. Used by the UI's "Detach from <resource>"
 * action and by templates that need to retag a chat after a rename. Pass
 * `null` to clear the scope (chat becomes general).
 */
export async function setThreadScope(id, scope) {
    await ensureTable();
    const client = getDbExec();
    await client.execute({
        sql: `UPDATE chat_threads SET scope_type = ?, scope_id = ?, scope_label = ?, updated_at = ? WHERE id = ?`,
        args: [
            scope?.type ?? null,
            scope?.id ?? null,
            scope?.label ?? null,
            Math.max(Date.now(), 1),
            id,
        ],
    });
    emitChatThreadChange(id);
}
function parseThreadData(value) {
    try {
        return JSON.parse(value || "{}");
    }
    catch {
        return {};
    }
}
export async function updateThreadData(id, threadData, title, preview, messageCount, options = {}) {
    await ensureTable();
    const client = getDbExec();
    const maxAttempts = options.maxAttempts ?? 5;
    let lastConflict = false;
    for (let attempt = 0; attempt < maxAttempts; attempt++) {
        const current = await getThread(id);
        if (!current)
            return;
        let nextThreadData = threadData;
        let nextMessageCount = messageCount;
        try {
            const merged = mergeThreadDataForClientSave(parseThreadData(current.threadData), parseThreadData(threadData), {
                preserveExistingQueuedMessages: options.preserveExistingQueuedMessages ?? true,
                preserveExistingTopLevelKeys: options.preserveExistingTopLevelKeys ?? true,
            });
            nextThreadData = JSON.stringify(merged);
            if (Array.isArray(merged.messages)) {
                nextMessageCount = merged.messages.length;
            }
        }
        catch {
            // Keep the caller's serialized value if either JSON blob is malformed.
        }
        const nextUpdatedAt = Math.max(Date.now(), current.updatedAt + 1);
        const result = await client.execute({
            sql: `UPDATE chat_threads SET thread_data = ?, title = ?, preview = ?, message_count = ?, updated_at = ? WHERE id = ? AND updated_at = ?`,
            args: [
                nextThreadData,
                title,
                preview,
                nextMessageCount,
                nextUpdatedAt,
                id,
                current.updatedAt,
            ],
        });
        if (result.rowsAffected > 0) {
            emitChatThreadChange(id);
            return;
        }
        lastConflict = true;
        await new Promise((resolve) => setTimeout(resolve, 10 * (attempt + 1)));
    }
    if (lastConflict) {
        throw new Error(`Failed to update chat thread ${id} after concurrent write conflicts.`);
    }
}
/**
 * Read the engine pinned to a thread (stored in thread_data JSON).
 * Returns null if no engine is pinned.
 */
export async function getThreadEngineMeta(threadId) {
    const thread = await getThread(threadId);
    if (!thread?.threadData)
        return null;
    try {
        const data = JSON.parse(thread.threadData);
        if (data.engineMeta?.engineName)
            return data.engineMeta;
    }
    catch { }
    return null;
}
/**
 * Pin an engine to a thread by storing engineMeta in thread_data JSON.
 * Does not change messages, title, or preview.
 */
export async function setThreadEngineMeta(threadId, meta) {
    return withThreadDataLock(threadId, async () => {
        const thread = await getThread(threadId);
        if (!thread)
            return;
        let data = {};
        try {
            data = JSON.parse(thread.threadData);
        }
        catch { }
        data.engineMeta = meta;
        await updateThreadData(threadId, JSON.stringify(data), thread.title, thread.preview, thread.messageCount);
    });
}
/**
 * Persist the user's queued (not-yet-sent) messages onto the thread.
 * Stored in thread_data JSON so it survives reloads without a schema
 * change. Safe to call often — the frontend debounces writes.
 */
export async function setThreadQueuedMessages(threadId, queuedMessages) {
    return withThreadDataLock(threadId, async () => {
        const thread = await getThread(threadId);
        if (!thread)
            return;
        let data = {};
        try {
            data = JSON.parse(thread.threadData);
        }
        catch { }
        if (queuedMessages.length === 0) {
            delete data.queuedMessages;
        }
        else {
            data.queuedMessages = queuedMessages;
        }
        await updateThreadData(threadId, JSON.stringify(data), thread.title, thread.preview, thread.messageCount, { preserveExistingQueuedMessages: false });
    });
}
export async function deleteThread(id) {
    await ensureTable();
    const client = getDbExec();
    const result = await client.execute({
        sql: `DELETE FROM chat_threads WHERE id = ?`,
        args: [id],
    });
    if (result.rowsAffected > 0) {
        emitChatThreadChange(id);
        return true;
    }
    return false;
}
//# sourceMappingURL=store.js.map