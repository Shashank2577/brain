export async function getExtensionShareChangeTargets(resourceType, resourceId) {
    if (resourceType !== "extension")
        return [];
    const { getExtensionChangeTargets } = await import("../../extensions/store.js");
    return getExtensionChangeTargets(resourceId);
}
export async function notifyExtensionShareChanged(resourceType, resourceId, beforeTargets) {
    if (resourceType !== "extension")
        return;
    const { notifyExtensionChangeForResource } = await import("../../extensions/store.js");
    await notifyExtensionChangeForResource(resourceId, beforeTargets);
}
//# sourceMappingURL=extension-change.js.map