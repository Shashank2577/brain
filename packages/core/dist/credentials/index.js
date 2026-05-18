import { getSetting, putSetting, deleteSetting } from "../settings/store.js";
const SETTING_PREFIX = "credential:";
function userCredentialSettingKey(email, key) {
    return `u:${email.toLowerCase()}:${SETTING_PREFIX}${key}`;
}
function orgCredentialSettingKey(orgId, key) {
    return `o:${orgId}:${SETTING_PREFIX}${key}`;
}
async function readCredentialSetting(settingKey) {
    const setting = await getSetting(settingKey);
    return setting && typeof setting.value === "string"
        ? setting.value
        : undefined;
}
/**
 * Resolve a credential from one explicit legacy SQL credential scope.
 *
 * Prefer `resolveCredential()` for normal app-local credential lookup. This
 * helper exists for workspace connection refs, where a ref can explicitly say
 * "use the org-scoped key" and must not accidentally read a user override.
 */
export async function resolveCredentialForScope(key, ctx) {
    if (!ctx?.userEmail)
        return undefined;
    if (ctx.scope === "org") {
        if (!ctx.orgId)
            return undefined;
        return readCredentialSetting(orgCredentialSettingKey(ctx.orgId, key));
    }
    return readCredentialSetting(userCredentialSettingKey(ctx.userEmail, key));
}
/**
 * Resolve a credential, scoped to the caller's user (and falling back to
 * the active org's shared credential, if any).
 *
 * SECURITY: NEVER reads from process.env. Env vars are global to the
 * deployment and would leak across users in a multi-tenant app. The only
 * sources are per-user / per-org rows in the SQL `settings` table.
 *
 * Storage keys (priority order):
 *   1. u:<email>:credential:<KEY>   — per-user override
 *   2. o:<orgId>:credential:<KEY>   — per-org shared credential (if orgId given)
 */
export async function resolveCredential(key, ctx) {
    if (!ctx?.userEmail)
        return undefined;
    const userSetting = await resolveCredentialForScope(key, {
        ...ctx,
        scope: "user",
    });
    if (userSetting)
        return userSetting;
    if (ctx.orgId) {
        return resolveCredentialForScope(key, { ...ctx, scope: "org" });
    }
    return undefined;
}
/**
 * Check if a credential is available for the given context.
 */
export async function hasCredential(key, ctx) {
    return (await resolveCredential(key, ctx)) !== undefined;
}
/**
 * Save a credential. By default writes to the per-user store; pass
 * `scope: "org"` to write to the active org's shared credentials.
 */
export async function saveCredential(key, value, ctx) {
    if (!ctx?.userEmail) {
        throw new Error("saveCredential requires CredentialContext with userEmail");
    }
    if (ctx.scope === "org") {
        if (!ctx.orgId) {
            throw new Error("saveCredential scope='org' requires orgId");
        }
        await putSetting(orgCredentialSettingKey(ctx.orgId, key), { value });
        return;
    }
    await putSetting(userCredentialSettingKey(ctx.userEmail, key), {
        value,
    });
}
/**
 * Delete a credential from the per-user (default) or per-org store.
 */
export async function deleteCredential(key, ctx) {
    if (!ctx?.userEmail) {
        throw new Error("deleteCredential requires CredentialContext with userEmail");
    }
    if (ctx.scope === "org") {
        if (!ctx.orgId) {
            throw new Error("deleteCredential scope='org' requires orgId");
        }
        await deleteSetting(orgCredentialSettingKey(ctx.orgId, key));
        return;
    }
    await deleteSetting(userCredentialSettingKey(ctx.userEmail, key));
}
//# sourceMappingURL=index.js.map