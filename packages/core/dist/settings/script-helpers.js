/**
 * Settings helpers for use in scripts.
 *
 * Persistent key-value settings stored in the settings SQL table.
 */
import { getSetting, putSetting, deleteSetting } from "./store.js";
export async function readSetting(key) {
    return getSetting(key);
}
export async function writeSetting(key, value) {
    return putSetting(key, value);
}
export async function removeSetting(key) {
    return deleteSetting(key);
}
//# sourceMappingURL=script-helpers.js.map