import { getUserSetting, putUserSetting, deleteUserSetting, } from "../settings/user-settings.js";
import { getOrgSetting, putOrgSetting, deleteOrgSetting, } from "../settings/org-settings.js";
import { getBuiltinMcpCapability, normalizeBuiltinMcpCapabilityIds, } from "./builtin-capabilities.js";
const SETTINGS_KEY = "mcp-builtin-capabilities";
async function readSetting(scope, scopeId) {
    return scope === "user"
        ? getUserSetting(scopeId, SETTINGS_KEY)
        : getOrgSetting(scopeId, SETTINGS_KEY);
}
async function writeSetting(scope, scopeId, enabledIds) {
    if (enabledIds.length === 0) {
        if (scope === "user") {
            await deleteUserSetting(scopeId, SETTINGS_KEY);
        }
        else {
            await deleteOrgSetting(scopeId, SETTINGS_KEY);
        }
        return;
    }
    const value = {
        enabledIds,
    };
    if (scope === "user") {
        await putUserSetting(scopeId, SETTINGS_KEY, value);
    }
    else {
        await putOrgSetting(scopeId, SETTINGS_KEY, value);
    }
}
export function builtinMcpCapabilitiesSettingsKey() {
    return SETTINGS_KEY;
}
export async function listEnabledBuiltinMcpCapabilities(scope, scopeId) {
    const raw = await readSetting(scope, scopeId);
    if (!raw || !Array.isArray(raw.enabledIds))
        return [];
    return normalizeBuiltinMcpCapabilityIds(raw.enabledIds.map(String));
}
export async function setEnabledBuiltinMcpCapabilities(scope, scopeId, ids) {
    const enabledIds = normalizeBuiltinMcpCapabilityIds(ids);
    await writeSetting(scope, scopeId, enabledIds);
    return enabledIds;
}
export async function setBuiltinMcpCapabilityEnabled(scope, scopeId, id, enabled) {
    const capability = getBuiltinMcpCapability(id);
    if (!capability)
        return null;
    const existing = await listEnabledBuiltinMcpCapabilities(scope, scopeId);
    const next = enabled
        ? normalizeBuiltinMcpCapabilityIds([...existing, capability.id])
        : existing.filter((existingId) => existingId !== capability.id);
    await writeSetting(scope, scopeId, next);
    return next;
}
//# sourceMappingURL=builtin-store.js.map