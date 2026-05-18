export const EXTENSION_CHANGE_MARKER_KEY = "__extensions_change__";
export const EXTENSION_CHANGE_MARKER_ORG_PREFIX = "__org__:";
export function extensionChangeMarkerSession(target) {
    if (target.owner)
        return target.owner;
    if (target.orgId)
        return `${EXTENSION_CHANGE_MARKER_ORG_PREFIX}${target.orgId}`;
    return null;
}
export function extensionChangeMarkerValue(target) {
    return {
        source: "extensions",
        ...(target.owner ? { owner: target.owner } : {}),
        ...(target.orgId ? { orgId: target.orgId } : {}),
    };
}
export function parseExtensionChangeMarker(sessionId, value) {
    let parsed = value;
    if (typeof value === "string") {
        try {
            parsed = JSON.parse(value);
        }
        catch {
            parsed = null;
        }
    }
    if (parsed && typeof parsed === "object") {
        const record = parsed;
        const owner = typeof record.owner === "string" ? record.owner : undefined;
        const orgId = typeof record.orgId === "string" ? record.orgId : undefined;
        if (owner || orgId)
            return { owner, orgId };
    }
    if (typeof sessionId !== "string" || !sessionId)
        return null;
    if (sessionId.startsWith(EXTENSION_CHANGE_MARKER_ORG_PREFIX)) {
        const orgId = sessionId.slice(EXTENSION_CHANGE_MARKER_ORG_PREFIX.length);
        return orgId ? { orgId } : null;
    }
    return { owner: sessionId };
}
//# sourceMappingURL=change-marker.js.map