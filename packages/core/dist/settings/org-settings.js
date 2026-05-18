/**
 * Org-scoped settings helpers.
 *
 * Wraps the global settings store with per-org key prefixing.
 * Keys are stored as `o:<orgId>:<key>` in the settings table.
 *
 * No global fallback — each org starts with a clean slate. This
 * prevents one org's data from leaking to another.
 */
import { getSetting, putSetting, deleteSetting, getAllSettings, } from "./store.js";
function orgKey(orgId, key) {
    return `o:${orgId}:${key}`;
}
const ORG_PREFIX_RE = /^o:([^:]+):(.+)$/;
/** Read an org-scoped setting. Returns null if not set for this org. */
export async function getOrgSetting(orgId, key) {
    return getSetting(orgKey(orgId, key));
}
/** Write an org-scoped setting. Always writes to the prefixed key. */
export async function putOrgSetting(orgId, key, value, options) {
    return putSetting(orgKey(orgId, key), value, options);
}
/** Delete an org-scoped setting. */
export async function deleteOrgSetting(orgId, key, options) {
    return deleteSetting(orgKey(orgId, key), options);
}
/**
 * List all settings keys for an org with an optional sub-prefix.
 * Returns a map of `<key>` (without the org prefix) to value.
 */
export async function listOrgSettings(orgId, subPrefix) {
    const all = await getAllSettings();
    const out = {};
    for (const [fullKey, value] of Object.entries(all)) {
        const m = ORG_PREFIX_RE.exec(fullKey);
        if (!m || m[1] !== orgId)
            continue;
        const key = m[2];
        if (subPrefix && !key.startsWith(subPrefix))
            continue;
        out[key] = value;
    }
    return out;
}
//# sourceMappingURL=org-settings.js.map