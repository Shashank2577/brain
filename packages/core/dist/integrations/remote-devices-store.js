import { getDbExec, intType, isPostgres, retryOnDdlRace, } from "../db/client.js";
let _initPromise;
async function ensureTable() {
    if (!_initPromise) {
        _initPromise = (async () => {
            const client = getDbExec();
            await retryOnDdlRace(() => client.execute(`
          CREATE TABLE IF NOT EXISTS integration_remote_devices (
            id TEXT PRIMARY KEY,
            owner_email TEXT NOT NULL,
            org_id TEXT,
            label TEXT NOT NULL,
            platform TEXT,
            app_version TEXT,
            host_name TEXT,
            metadata_json TEXT,
            device_token_hash TEXT NOT NULL,
            last_seen_at ${intType()},
            status TEXT NOT NULL,
            revoked_at ${intType()},
            created_at ${intType()} NOT NULL,
            updated_at ${intType()} NOT NULL
          )
        `));
            await addColumnIfMissing("platform", "TEXT");
            await addColumnIfMissing("app_version", "TEXT");
            await addColumnIfMissing("host_name", "TEXT");
            await addColumnIfMissing("metadata_json", "TEXT");
            await addColumnIfMissing("revoked_at", intType());
            await retryOnDdlRace(() => client.execute(`CREATE UNIQUE INDEX IF NOT EXISTS idx_remote_devices_token_hash ON integration_remote_devices(device_token_hash)`));
            await retryOnDdlRace(() => client.execute(`CREATE INDEX IF NOT EXISTS idx_remote_devices_owner ON integration_remote_devices(owner_email, org_id)`));
        })();
    }
    return _initPromise;
}
async function addColumnIfMissing(name, definition) {
    const sql = isPostgres()
        ? `ALTER TABLE integration_remote_devices ADD COLUMN IF NOT EXISTS ${name} ${definition}`
        : `ALTER TABLE integration_remote_devices ADD COLUMN ${name} ${definition}`;
    try {
        await retryOnDdlRace(() => getDbExec().execute(sql));
    }
    catch (err) {
        if (isDuplicateColumnError(err))
            return;
        throw err;
    }
}
function isDuplicateColumnError(err) {
    const code = String(err?.code ?? "");
    const message = String(err?.message ?? err)
        .toLowerCase()
        .trim();
    return (code === "42701" ||
        message.includes("duplicate column") ||
        message.includes("already exists"));
}
function rowToDevice(row) {
    return {
        id: row.id,
        ownerEmail: row.owner_email,
        orgId: row.org_id ?? null,
        label: row.label,
        platform: row.platform ?? null,
        appVersion: row.app_version ?? null,
        hostName: row.host_name ?? null,
        metadata: parseJson(row.metadata_json, null),
        deviceTokenHash: row.device_token_hash,
        lastSeenAt: row.last_seen_at == null ? null : Number(row.last_seen_at),
        status: row.status,
        revokedAt: row.revoked_at == null ? null : Number(row.revoked_at),
        createdAt: Number(row.created_at ?? 0),
        updatedAt: Number(row.updated_at ?? 0),
    };
}
export function toPublicRemoteDevice(device) {
    return {
        id: device.id,
        ownerEmail: device.ownerEmail,
        orgId: device.orgId,
        label: device.label,
        platform: device.platform,
        appVersion: device.appVersion,
        hostName: device.hostName,
        metadata: device.metadata,
        lastSeenAt: device.lastSeenAt,
        status: device.status,
        revokedAt: device.revokedAt,
        createdAt: device.createdAt,
        updatedAt: device.updatedAt,
    };
}
export async function createRemoteDevice(input) {
    await ensureTable();
    const client = getDbExec();
    const now = Date.now();
    const id = `remote-device-${now}-${randomHex(8)}`;
    const token = `anr_${randomHex(32)}`;
    const tokenHash = await hashRemoteDeviceToken(token);
    await client.execute({
        sql: `INSERT INTO integration_remote_devices
      (id, owner_email, org_id, label, platform, app_version, host_name, metadata_json,
       device_token_hash, last_seen_at, status, revoked_at, created_at, updated_at)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
        args: [
            id,
            input.ownerEmail,
            input.orgId ?? null,
            input.label.trim() || "Remote device",
            sanitizeOptionalString(input.platform, 80),
            sanitizeOptionalString(input.appVersion, 120),
            sanitizeOptionalString(input.hostName, 200),
            input.metadata ? JSON.stringify(input.metadata) : null,
            tokenHash,
            now,
            "active",
            null,
            now,
            now,
        ],
    });
    const device = await getRemoteDevice(id);
    if (!device)
        throw new Error("remote device insert failed");
    return { device, token };
}
export async function getRemoteDevice(id) {
    await ensureTable();
    const { rows } = await getDbExec().execute({
        sql: `SELECT * FROM integration_remote_devices WHERE id = ? LIMIT 1`,
        args: [id],
    });
    return rows[0] ? rowToDevice(rows[0]) : null;
}
export async function getRemoteDeviceForOwner(input) {
    await ensureTable();
    const { rows } = await getDbExec().execute({
        sql: `SELECT * FROM integration_remote_devices
          WHERE id = ?
            AND owner_email = ?
            AND ((org_id IS NULL AND ? IS NULL) OR org_id = ?)
          LIMIT 1`,
        args: [
            input.id,
            input.ownerEmail,
            input.orgId ?? null,
            input.orgId ?? null,
        ],
    });
    return rows[0] ? rowToDevice(rows[0]) : null;
}
export async function listRemoteDevicesForOwner(input) {
    await ensureTable();
    const limit = Math.max(1, Math.min(input.limit ?? 50, 100));
    const statusClause = input.status ? " AND status = ?" : "";
    if (!Object.prototype.hasOwnProperty.call(input, "orgId")) {
        const args = [input.ownerEmail];
        if (input.status)
            args.push(input.status);
        args.push(limit);
        const { rows } = await getDbExec().execute({
            sql: `SELECT * FROM integration_remote_devices
            WHERE owner_email = ?${statusClause}
            ORDER BY COALESCE(last_seen_at, updated_at) DESC
            LIMIT ?`,
            args,
        });
        return rows.map((row) => rowToDevice(row));
    }
    const args = [
        input.ownerEmail,
        input.orgId ?? null,
        input.orgId ?? null,
    ];
    if (input.status)
        args.push(input.status);
    args.push(limit);
    const { rows } = await getDbExec().execute({
        sql: `SELECT * FROM integration_remote_devices
          WHERE owner_email = ?
            AND ((org_id IS NULL AND ? IS NULL) OR org_id = ?)${statusClause}
          ORDER BY COALESCE(last_seen_at, updated_at) DESC
          LIMIT ?`,
        args,
    });
    return rows.map((row) => rowToDevice(row));
}
export async function authenticateRemoteDeviceToken(rawToken) {
    if (!rawToken)
        return null;
    await ensureTable();
    const tokenHash = await hashRemoteDeviceToken(rawToken);
    const now = Date.now();
    const client = getDbExec();
    const { rows } = await client.execute({
        sql: `SELECT * FROM integration_remote_devices
          WHERE device_token_hash = ? AND status = 'active'
          LIMIT 1`,
        args: [tokenHash],
    });
    if (!rows[0])
        return null;
    const device = rowToDevice(rows[0]);
    await client.execute({
        sql: `UPDATE integration_remote_devices
          SET last_seen_at = ?, updated_at = ?
          WHERE id = ?`,
        args: [now, now, device.id],
    });
    return { ...device, lastSeenAt: now, updatedAt: now };
}
export async function updateRemoteDeviceDetails(input) {
    await ensureTable();
    const now = Date.now();
    const updates = [];
    const args = [];
    if (input.label !== undefined) {
        updates.push("label = ?");
        args.push(sanitizeOptionalString(input.label, 200) ?? "Remote device");
    }
    if (input.platform !== undefined) {
        updates.push("platform = ?");
        args.push(sanitizeOptionalString(input.platform, 80));
    }
    if (input.appVersion !== undefined) {
        updates.push("app_version = ?");
        args.push(sanitizeOptionalString(input.appVersion, 120));
    }
    if (input.hostName !== undefined) {
        updates.push("host_name = ?");
        args.push(sanitizeOptionalString(input.hostName, 200));
    }
    if (input.metadata !== undefined) {
        updates.push("metadata_json = ?");
        args.push(input.metadata ? JSON.stringify(input.metadata) : null);
    }
    if (updates.length === 0)
        return getRemoteDevice(input.id);
    updates.push("updated_at = ?");
    args.push(now, input.id);
    await getDbExec().execute({
        sql: `UPDATE integration_remote_devices
          SET ${updates.join(", ")}
          WHERE id = ? AND status = 'active'`,
        args,
    });
    return getRemoteDevice(input.id);
}
export async function revokeRemoteDeviceForOwner(input) {
    await ensureTable();
    const now = Date.now();
    await getDbExec().execute({
        sql: `UPDATE integration_remote_devices
          SET status = 'inactive',
              revoked_at = COALESCE(revoked_at, ?),
              updated_at = ?
          WHERE id = ?
            AND owner_email = ?
            AND ((org_id IS NULL AND ? IS NULL) OR org_id = ?)`,
        args: [
            now,
            now,
            input.id,
            input.ownerEmail,
            input.orgId ?? null,
            input.orgId ?? null,
        ],
    });
    return getRemoteDeviceForOwner(input);
}
export async function unregisterRemoteDevice(id) {
    await ensureTable();
    const now = Date.now();
    const result = await getDbExec().execute({
        sql: `UPDATE integration_remote_devices
          SET status = 'inactive',
              revoked_at = COALESCE(revoked_at, ?),
              updated_at = ?
          WHERE id = ? AND status = 'active'`,
        args: [now, now, id],
    });
    return (result.rowsAffected ?? result.rowCount ?? 0) > 0;
}
export async function hashRemoteDeviceToken(token) {
    const bytes = new TextEncoder().encode(token);
    const digest = await globalThis.crypto.subtle.digest("SHA-256", bytes);
    return bytesToHex(new Uint8Array(digest));
}
function sanitizeOptionalString(value, max) {
    if (typeof value !== "string")
        return null;
    const trimmed = value.trim();
    return trimmed ? trimmed.slice(0, max) : null;
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
    return bytesToHex(bytes);
}
function bytesToHex(bytes) {
    return Array.from(bytes)
        .map((byte) => byte.toString(16).padStart(2, "0"))
        .join("");
}
//# sourceMappingURL=remote-devices-store.js.map