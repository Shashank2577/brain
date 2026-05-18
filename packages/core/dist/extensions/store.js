import { randomUUID } from "node:crypto";
import { eq } from "drizzle-orm";
import { appStatePut } from "../application-state/store.js";
import { getDbExec, isPostgres, retryOnDdlRace } from "../db/client.js";
import { createGetDb } from "../db/create-get-db.js";
import { recordChange } from "../server/poll.js";
import { accessFilter, assertAccess, resolveAccess, ForbiddenError, } from "../sharing/access.js";
import { getRequestUserEmail, getRequestOrgId, } from "../server/request-context.js";
import { registerShareableResource } from "../sharing/registry.js";
import { extensions, extensionHides, extensionShares, EXTENSIONS_CREATE_SQL, EXTENSIONS_CREATE_SQL_PG, EXTENSION_SHARES_CREATE_SQL, EXTENSION_SHARES_CREATE_SQL_PG, EXTENSION_DATA_CREATE_SQL, EXTENSION_DATA_CREATE_SQL_PG, EXTENSION_DATA_ITEM_INDEX_SQL, EXTENSION_DATA_ITEM_INDEX_SQL_PG, EXTENSION_DATA_DROP_OLD_INDEX_SQL, EXTENSION_DATA_DROP_OLD_INDEX_SQL_PG, EXTENSIONS_OWNER_INDEX_SQL, EXTENSIONS_ORG_INDEX_SQL, EXTENSIONS_UPDATED_INDEX_SQL, EXTENSION_SHARES_RESOURCE_INDEX_SQL, EXTENSION_HIDES_CREATE_SQL, EXTENSION_HIDES_CREATE_SQL_PG, EXTENSION_HIDES_UNIQUE_INDEX_SQL, EXTENSION_HIDES_OWNER_INDEX_SQL, EXTENSION_CONSENTS_CREATE_SQL, EXTENSION_CONSENTS_CREATE_SQL_PG, EXTENSION_CONSENTS_VIEWER_INDEX_SQL, } from "./schema.js";
import { EXTENSION_CHANGE_MARKER_KEY, extensionChangeMarkerSession, extensionChangeMarkerValue, } from "./change-marker.js";
const getDb = createGetDb({ extensions, extensionShares, extensionHides });
let _initPromise;
export async function ensureExtensionsTables() {
    if (!_initPromise) {
        _initPromise = (async () => {
            const client = getDbExec();
            const pg = isPostgres();
            await retryOnDdlRace(() => client.execute(pg ? EXTENSIONS_CREATE_SQL_PG : EXTENSIONS_CREATE_SQL));
            await migrateMisnamedExtensionsTable(client, pg);
            await retryOnDdlRace(() => client.execute(pg ? EXTENSION_SHARES_CREATE_SQL_PG : EXTENSION_SHARES_CREATE_SQL));
            await retryOnDdlRace(() => client.execute(pg ? EXTENSION_DATA_CREATE_SQL_PG : EXTENSION_DATA_CREATE_SQL));
            await ensureExtensionDataItemId(client, pg);
            await ensureExtensionDataScope(client, pg);
            await client.execute(pg
                ? EXTENSION_DATA_DROP_OLD_INDEX_SQL_PG
                : EXTENSION_DATA_DROP_OLD_INDEX_SQL);
            await retryOnDdlRace(() => client.execute(pg ? EXTENSION_DATA_ITEM_INDEX_SQL_PG : EXTENSION_DATA_ITEM_INDEX_SQL));
            await retryOnDdlRace(() => client.execute(EXTENSIONS_OWNER_INDEX_SQL));
            await retryOnDdlRace(() => client.execute(EXTENSIONS_ORG_INDEX_SQL));
            await retryOnDdlRace(() => client.execute(EXTENSIONS_UPDATED_INDEX_SQL));
            await retryOnDdlRace(() => client.execute(EXTENSION_SHARES_RESOURCE_INDEX_SQL));
            await retryOnDdlRace(() => client.execute(pg ? EXTENSION_HIDES_CREATE_SQL_PG : EXTENSION_HIDES_CREATE_SQL));
            await retryOnDdlRace(() => client.execute(EXTENSION_HIDES_UNIQUE_INDEX_SQL));
            await retryOnDdlRace(() => client.execute(EXTENSION_HIDES_OWNER_INDEX_SQL));
            // tool_consents was introduced for an audit-C1 per-viewer consent
            // gate that we removed once we settled on intra-org trust as the
            // baseline. The table is kept (additive — never drop) so deploys
            // that already created it stay healthy; the runtime consent code
            // is gone. Idempotent CREATE IF NOT EXISTS for fresh schemas.
            await retryOnDdlRace(() => client.execute(pg ? EXTENSION_CONSENTS_CREATE_SQL_PG : EXTENSION_CONSENTS_CREATE_SQL));
            await retryOnDdlRace(() => client.execute(EXTENSION_CONSENTS_VIEWER_INDEX_SQL));
        })();
    }
    try {
        await _initPromise;
    }
    catch (err) {
        _initPromise = undefined;
        throw err;
    }
}
async function migrateMisnamedExtensionsTable(client, pg) {
    const sql = pg
        ? `INSERT INTO tools (id, name, description, content, icon, created_at, updated_at, owner_email, org_id, visibility)
       SELECT id, name, description, content, icon, created_at, updated_at, owner_email, org_id, visibility
       FROM extensions
       ON CONFLICT (id) DO NOTHING`
        : `INSERT OR IGNORE INTO tools (id, name, description, content, icon, created_at, updated_at, owner_email, org_id, visibility)
       SELECT id, name, description, content, icon, created_at, updated_at, owner_email, org_id, visibility
       FROM extensions`;
    try {
        await client.execute(sql);
    }
    catch (err) {
        const message = String(err?.message ?? err).toLowerCase();
        if (message.includes("no such table: extensions") ||
            message.includes('relation "extensions" does not exist') ||
            message.includes("relation extensions does not exist")) {
            return;
        }
        throw err;
    }
}
async function ensureExtensionDataItemId(client, pg) {
    if (pg) {
        await client.execute(`ALTER TABLE tool_data ADD COLUMN IF NOT EXISTS item_id TEXT`);
        return;
    }
    // Keep this additive: legacy rows with item_id=id are still read correctly
    // through COALESCE(item_id, id), so SQLite never needs a table rebuild here.
    try {
        await client.execute(`ALTER TABLE tool_data ADD COLUMN item_id TEXT`);
    }
    catch (err) {
        if (!String(err?.message ?? err)
            .toLowerCase()
            .includes("duplicate")) {
            throw err;
        }
    }
}
async function ensureExtensionDataScope(client, pg) {
    const addCol = (name, def) => {
        if (pg) {
            return client.execute(`ALTER TABLE tool_data ADD COLUMN IF NOT EXISTS ${name} ${def}`);
        }
        return client
            .execute(`ALTER TABLE tool_data ADD COLUMN ${name} ${def}`)
            .catch((err) => {
            if (!String(err?.message ?? err)
                .toLowerCase()
                .includes("duplicate"))
                throw err;
        });
    };
    await addCol("scope", "TEXT NOT NULL DEFAULT 'user'");
    await addCol("org_id", "TEXT");
    await addCol("scope_key", "TEXT NOT NULL DEFAULT 'local@localhost'");
    // One-time backfill migration: replaces the dev-mode DEFAULT scope_key
    // with each row's real owner_email. Not a per-request fallback.
    await client.execute(
    // guard:allow-localhost-fallback — one-time backfill migration replacing dev-mode default scope_key with the row's real owner_email
    `UPDATE tool_data SET scope_key = owner_email WHERE scope_key = 'local@localhost' AND owner_email != 'local@localhost'`);
}
export function registerExtensionsShareable() {
    registerShareableResource({
        type: "extension",
        resourceTable: extensions,
        sharesTable: extensionShares,
        displayName: "Extension",
        titleColumn: "name",
        getDb: () => getDb(),
        // Extension HTML executes inside an iframe and calls actions / SQL / the
        // secrets-injecting proxy as the *viewer*. A public extension would let a
        // random authenticated user run code with the viewer's credentials — and
        // a malicious shared extension could re-share itself wider. Lock both:
        // no public visibility, and individual user shares must already be (or
        // be invited to) the org.
        allowPublic: false,
        requireOrgMemberForUserShares: true,
    });
}
function targetKey(target) {
    if (target.owner)
        return `owner:${target.owner}`;
    if (target.orgId)
        return `org:${target.orgId}`;
    return null;
}
function addExtensionChangeTarget(targets, target) {
    const key = targetKey(target);
    if (key)
        targets.set(key, target);
}
async function extensionChangeTargetsForRow(row) {
    const targets = new Map();
    addExtensionChangeTarget(targets, { owner: row.ownerEmail });
    if (row.visibility === "org" && row.orgId) {
        addExtensionChangeTarget(targets, { orgId: row.orgId });
    }
    const db = getDb();
    const shares = (await db
        .select({
        principalType: extensionShares.principalType,
        principalId: extensionShares.principalId,
    })
        .from(extensionShares)
        .where(eq(extensionShares.resourceId, row.id)));
    for (const share of shares) {
        if (share.principalType === "user") {
            addExtensionChangeTarget(targets, { owner: share.principalId });
        }
        else if (share.principalType === "org") {
            addExtensionChangeTarget(targets, { orgId: share.principalId });
        }
    }
    return Array.from(targets.values());
}
async function extensionChangeTargetsForId(id) {
    const db = getDb();
    const rows = await db.select().from(extensions).where(eq(extensions.id, id));
    const row = rows[0];
    return row ? extensionChangeTargetsForRow(row) : [];
}
export async function getExtensionChangeTargets(id) {
    await ensureExtensionsTables();
    return extensionChangeTargetsForId(id);
}
function dedupeExtensionChangeTargets(targets) {
    const unique = new Map();
    for (const target of targets) {
        const key = targetKey(target);
        if (key)
            unique.set(key, target);
    }
    return Array.from(unique.values());
}
async function notifyExtensionChanged(targets) {
    const uniqueTargets = dedupeExtensionChangeTargets(targets);
    if (uniqueTargets.length === 0)
        return;
    for (const target of uniqueTargets) {
        recordChange({
            source: "extensions",
            type: "change",
            key: "*",
            ...(target.owner ? { owner: target.owner } : {}),
            ...(target.orgId ? { orgId: target.orgId } : {}),
        });
    }
    await Promise.all(uniqueTargets.map(async (target) => {
        const sessionId = extensionChangeMarkerSession(target);
        if (!sessionId)
            return;
        await appStatePut(sessionId, EXTENSION_CHANGE_MARKER_KEY, extensionChangeMarkerValue(target));
    }));
}
export async function notifyExtensionChangeForResource(id, beforeTargets = []) {
    await ensureExtensionsTables();
    await notifyExtensionChanged([
        ...beforeTargets,
        ...(await extensionChangeTargetsForId(id)),
    ]);
}
export async function listExtensions(options = {}) {
    await ensureExtensionsTables();
    const db = getDb();
    const rows = (await db
        .select()
        .from(extensions)
        .where(accessFilter(extensions, extensionShares)));
    if (options.includeHidden)
        return rows;
    const hiddenIds = await getHiddenExtensionIdsForCurrentUser();
    if (hiddenIds.size === 0)
        return rows;
    return rows.filter((row) => !hiddenIds.has(row.id));
}
export async function getExtension(id) {
    await ensureExtensionsTables();
    const access = await resolveAccess("extension", id);
    return access?.resource ?? null;
}
export async function createExtension(data) {
    await ensureExtensionsTables();
    const db = getDb();
    const userEmail = getRequestUserEmail();
    if (!userEmail)
        throw new Error("no authenticated user");
    const orgId = getRequestOrgId();
    const id = randomUUID();
    const now = new Date().toISOString();
    const row = {
        id,
        name: data.name,
        description: data.description ?? "",
        content: data.content ?? "",
        icon: data.icon ?? null,
        createdAt: now,
        updatedAt: now,
        ownerEmail: userEmail,
        orgId: orgId ?? null,
        visibility: "private",
    };
    await db.insert(extensions).values(row);
    await notifyExtensionChanged([{ owner: row.ownerEmail }]);
    return row;
}
export async function updateExtension(id, data) {
    await ensureExtensionsTables();
    await assertAccess("extension", id, "editor");
    if (data.visibility === "public") {
        // Defense in depth — `registerExtensionsShareable` sets
        // `allowPublic: false`, so `set-resource-visibility` already rejects
        // this. Block direct callers too (HTTP `PUT /extensions/:id`, internal
        // refactors) so the rule holds regardless of entry point.
        throw new ForbiddenError("Extensions cannot be made public — share with specific people or your organization instead.");
    }
    const db = getDb();
    const beforeTargets = await extensionChangeTargetsForId(id);
    const updates = {
        updatedAt: new Date().toISOString(),
    };
    if (data.name !== undefined)
        updates.name = data.name;
    if (data.description !== undefined)
        updates.description = data.description;
    if (data.icon !== undefined)
        updates.icon = data.icon;
    if (data.visibility !== undefined)
        updates.visibility = data.visibility;
    await db.update(extensions).set(updates).where(eq(extensions.id, id));
    const rows = await db.select().from(extensions).where(eq(extensions.id, id));
    const row = rows[0] ?? null;
    if (row) {
        await notifyExtensionChanged([
            ...beforeTargets,
            ...(await extensionChangeTargetsForRow(row)),
        ]);
    }
    return row;
}
export async function updateExtensionContent(id, opts) {
    await ensureExtensionsTables();
    await assertAccess("extension", id, "editor");
    const db = getDb();
    let newContent;
    if (opts.content !== undefined) {
        newContent = opts.content;
    }
    else if (opts.patches) {
        const rows = await db
            .select()
            .from(extensions)
            .where(eq(extensions.id, id));
        if (!rows[0])
            return null;
        newContent = rows[0].content;
        for (const patch of opts.patches) {
            newContent = newContent.replace(patch.find, patch.replace);
        }
    }
    else {
        return null;
    }
    const beforeTargets = await extensionChangeTargetsForId(id);
    await db
        .update(extensions)
        .set({ content: newContent, updatedAt: new Date().toISOString() })
        .where(eq(extensions.id, id));
    const rows = await db.select().from(extensions).where(eq(extensions.id, id));
    const row = rows[0] ?? null;
    if (row) {
        await notifyExtensionChanged([
            ...beforeTargets,
            ...(await extensionChangeTargetsForRow(row)),
        ]);
    }
    return row;
}
export async function deleteExtension(id) {
    await ensureExtensionsTables();
    await assertAccess("extension", id, "admin");
    const db = getDb();
    const rows = await db.select().from(extensions).where(eq(extensions.id, id));
    const row = rows[0];
    if (!row)
        return false;
    const targets = await extensionChangeTargetsForRow(row);
    await db.delete(extensionShares).where(eq(extensionShares.resourceId, id));
    await db.delete(extensionHides).where(eq(extensionHides.extensionId, id));
    await getDbExec().execute({
        sql: `DELETE FROM tool_data WHERE tool_id = ?`,
        args: [id],
    });
    const { cascadeDeleteExtensionSlots } = await import("./slots/store.js");
    await cascadeDeleteExtensionSlots(id);
    await db.delete(extensions).where(eq(extensions.id, id));
    await notifyExtensionChanged(targets);
    return true;
}
export async function getHiddenExtensionIdsForCurrentUser() {
    await ensureExtensionsTables();
    const userEmail = getRequestUserEmail();
    if (!userEmail)
        return new Set();
    const db = getDb();
    const rows = await db
        .select({ extensionId: extensionHides.extensionId })
        .from(extensionHides)
        .where(eq(extensionHides.ownerEmail, userEmail));
    return new Set(rows.map((row) => row.extensionId));
}
export async function hideExtension(id) {
    await ensureExtensionsTables();
    await assertAccess("extension", id, "viewer");
    const userEmail = getRequestUserEmail();
    if (!userEmail)
        throw new Error("no authenticated user");
    const now = new Date().toISOString();
    await getDbExec().execute({
        sql: `INSERT INTO tool_hidden_extensions (id, tool_id, owner_email, created_at)
      VALUES (?, ?, ?, ?)
      ON CONFLICT (owner_email, tool_id) DO NOTHING`,
        args: [randomUUID(), id, userEmail, now],
    });
    await notifyExtensionChanged([{ owner: userEmail }]);
    return true;
}
export async function unhideExtension(id) {
    await ensureExtensionsTables();
    const userEmail = getRequestUserEmail();
    if (!userEmail)
        throw new Error("no authenticated user");
    await getDbExec().execute({
        sql: `DELETE FROM tool_hidden_extensions WHERE tool_id = ? AND owner_email = ?`,
        args: [id, userEmail],
    });
    await notifyExtensionChanged([{ owner: userEmail }]);
    return true;
}
//# sourceMappingURL=store.js.map