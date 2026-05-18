import { randomUUID } from "node:crypto";
import { and, eq, inArray, sql } from "drizzle-orm";
import { getDbExec, isPostgres } from "../../db/client.js";
import { createGetDb } from "../../db/create-get-db.js";
import { accessFilter, assertAccess } from "../../sharing/access.js";
import { getRequestUserEmail, getRequestOrgId, } from "../../server/request-context.js";
import { extensions, extensionShares } from "../schema.js";
import { extensionSlots, extensionSlotInstalls, EXTENSION_SLOTS_CREATE_SQL, EXTENSION_SLOTS_CREATE_SQL_PG, EXTENSION_SLOTS_BY_SLOT_INDEX_SQL, EXTENSION_SLOTS_BY_EXTENSION_INDEX_SQL, EXTENSION_SLOTS_UNIQUE_INDEX_SQL, EXTENSION_SLOT_INSTALLS_CREATE_SQL, EXTENSION_SLOT_INSTALLS_CREATE_SQL_PG, EXTENSION_SLOT_INSTALLS_BY_USER_SLOT_INDEX_SQL, EXTENSION_SLOT_INSTALLS_UNIQUE_INDEX_SQL, } from "./schema.js";
const getDb = createGetDb({
    extensions,
    extensionShares,
    extensionSlots,
    extensionSlotInstalls,
});
let _initPromise;
export async function ensureSlotTables() {
    if (!_initPromise) {
        _initPromise = (async () => {
            const client = getDbExec();
            const pg = isPostgres();
            await client.execute(pg ? EXTENSION_SLOTS_CREATE_SQL_PG : EXTENSION_SLOTS_CREATE_SQL);
            await client.execute(EXTENSION_SLOTS_BY_SLOT_INDEX_SQL);
            await client.execute(EXTENSION_SLOTS_BY_EXTENSION_INDEX_SQL);
            await client.execute(EXTENSION_SLOTS_UNIQUE_INDEX_SQL);
            await client.execute(pg
                ? EXTENSION_SLOT_INSTALLS_CREATE_SQL_PG
                : EXTENSION_SLOT_INSTALLS_CREATE_SQL);
            await client.execute(EXTENSION_SLOT_INSTALLS_BY_USER_SLOT_INDEX_SQL);
            await client.execute(EXTENSION_SLOT_INSTALLS_UNIQUE_INDEX_SQL);
        })();
    }
    return _initPromise;
}
/**
 * Declare that a extension can render in a slot. Caller must have editor access on
 * the extension (only people who can edit a extension can change its slot targets).
 */
export async function addExtensionSlotTarget(extensionId, slotId, config) {
    await ensureSlotTables();
    await assertAccess("extension", extensionId, "editor");
    const db = getDb();
    const id = randomUUID();
    const createdAt = new Date().toISOString();
    const row = {
        id,
        extensionId,
        slotId,
        config: config ?? null,
        createdAt,
    };
    try {
        await db.insert(extensionSlots).values(row);
    }
    catch (err) {
        // Unique index hit — already declared. Treat as idempotent: return existing.
        if (String(err?.message ?? err)
            .toLowerCase()
            .includes("unique")) {
            const existing = await db
                .select()
                .from(extensionSlots)
                .where(and(eq(extensionSlots.extensionId, extensionId), eq(extensionSlots.slotId, slotId)));
            if (existing[0])
                return existing[0];
        }
        throw err;
    }
    return row;
}
export async function removeExtensionSlotTarget(extensionId, slotId) {
    await ensureSlotTables();
    await assertAccess("extension", extensionId, "editor");
    const db = getDb();
    await db
        .delete(extensionSlots)
        .where(and(eq(extensionSlots.extensionId, extensionId), eq(extensionSlots.slotId, slotId)));
    return true;
}
export async function listSlotsForExtension(extensionId) {
    await ensureSlotTables();
    await assertAccess("extension", extensionId, "viewer");
    const db = getDb();
    const rows = await db
        .select()
        .from(extensionSlots)
        .where(eq(extensionSlots.extensionId, extensionId));
    return rows;
}
/**
 * List extensions that declare a slot — but only extensions the current user has access
 * to. Joins through the extensions access filter.
 */
export async function listExtensionsForSlot(slotId) {
    await ensureSlotTables();
    const db = getDb();
    // Pull extensions the user can see, then narrow to ones declaring this slot.
    const accessible = await db
        .select({
        id: extensions.id,
        name: extensions.name,
        description: extensions.description,
        icon: extensions.icon,
    })
        .from(extensions)
        .where(accessFilter(extensions, extensionShares));
    if (accessible.length === 0)
        return [];
    const ids = accessible.map((t) => t.id);
    const declarations = await db
        .select()
        .from(extensionSlots)
        .where(and(eq(extensionSlots.slotId, slotId), inArray(extensionSlots.extensionId, ids)));
    const byId = new Map(accessible.map((t) => [t.id, t]));
    return declarations.map((d) => {
        const t = byId.get(d.extensionId);
        return {
            extensionId: d.extensionId,
            name: t.name,
            description: t.description,
            icon: t.icon,
            config: d.config,
        };
    });
}
/**
 * Install a extension into a slot for the current user. Verifies the user has at
 * least viewer access to the extension. Idempotent — re-installing returns the
 * existing row.
 */
export async function installExtensionSlot(extensionId, slotId, opts) {
    await ensureSlotTables();
    await assertAccess("extension", extensionId, "viewer");
    const userEmail = requireUserEmail();
    const orgId = getRequestOrgId();
    const db = getDb();
    const existing = await db
        .select()
        .from(extensionSlotInstalls)
        .where(and(eq(extensionSlotInstalls.ownerEmail, userEmail), eq(extensionSlotInstalls.extensionId, extensionId), eq(extensionSlotInstalls.slotId, slotId)));
    if (existing[0])
        return existing[0];
    const id = randomUUID();
    const now = new Date().toISOString();
    let position = opts?.position;
    if (position === undefined) {
        const rows = await db
            .select({ pos: sql `MAX(${extensionSlotInstalls.position})` })
            .from(extensionSlotInstalls)
            .where(and(eq(extensionSlotInstalls.ownerEmail, userEmail), eq(extensionSlotInstalls.slotId, slotId)));
        const maxPos = Number(rows[0]?.pos ?? -1);
        position = Number.isFinite(maxPos) ? maxPos + 1 : 0;
    }
    const row = {
        id,
        extensionId,
        slotId,
        ownerEmail: userEmail,
        orgId: orgId ?? null,
        position,
        config: opts?.config ?? null,
        createdAt: now,
        updatedAt: now,
    };
    await db.insert(extensionSlotInstalls).values(row);
    return row;
}
export async function uninstallExtensionSlot(extensionId, slotId) {
    await ensureSlotTables();
    const userEmail = requireUserEmail();
    const db = getDb();
    await db
        .delete(extensionSlotInstalls)
        .where(and(eq(extensionSlotInstalls.ownerEmail, userEmail), eq(extensionSlotInstalls.extensionId, extensionId), eq(extensionSlotInstalls.slotId, slotId)));
    return true;
}
/**
 * List the current user's installs for a slot. Joins with `extensions` so the
 * caller gets extension name/description/icon/updatedAt without a second query.
 * Extensions the user has lost access to are silently skipped (lazy garbage
 * collection).
 */
export async function listSlotInstallsForUser(slotId) {
    await ensureSlotTables();
    const userEmail = requireUserEmail();
    const db = getDb();
    const installs = await db
        .select()
        .from(extensionSlotInstalls)
        .where(and(eq(extensionSlotInstalls.ownerEmail, userEmail), eq(extensionSlotInstalls.slotId, slotId)));
    if (installs.length === 0)
        return [];
    const accessible = await db
        .select({
        id: extensions.id,
        name: extensions.name,
        description: extensions.description,
        icon: extensions.icon,
        updatedAt: extensions.updatedAt,
    })
        .from(extensions)
        .where(accessFilter(extensions, extensionShares));
    const byId = new Map(accessible.map((t) => [t.id, t]));
    return installs
        .filter((i) => byId.has(i.extensionId))
        .sort((a, b) => a.position - b.position)
        .map((i) => {
        const t = byId.get(i.extensionId);
        return {
            installId: i.id,
            extensionId: i.extensionId,
            name: t.name,
            description: t.description,
            icon: t.icon,
            updatedAt: t.updatedAt,
            position: i.position,
            config: i.config,
        };
    });
}
/** Delete every slot/install row referencing a extension. Called from deleteExtension. */
export async function cascadeDeleteExtensionSlots(extensionId) {
    await ensureSlotTables();
    const db = getDb();
    await db
        .delete(extensionSlots)
        .where(eq(extensionSlots.extensionId, extensionId));
    await db
        .delete(extensionSlotInstalls)
        .where(eq(extensionSlotInstalls.extensionId, extensionId));
}
function requireUserEmail() {
    const email = getRequestUserEmail();
    if (!email) {
        throw new Error("Slot operations require an authenticated user.");
    }
    return email;
}
//# sourceMappingURL=store.js.map