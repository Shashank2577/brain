import { agentNativePath } from "../api-path.js";
async function readErrorMessage(res, fallback) {
    try {
        const text = await res.text();
        if (!text)
            return fallback;
        try {
            const parsed = JSON.parse(text);
            if (parsed?.error)
                return String(parsed.error);
            if (parsed?.message)
                return String(parsed.message);
        }
        catch {
            return text.slice(0, 200);
        }
    }
    catch {
        // Ignore body read failures and use the fallback below.
    }
    return fallback;
}
export async function hideExtensionForCurrentUser(extensionId) {
    const res = await fetch(agentNativePath(`/_agent-native/extensions/${extensionId}/hide`), { method: "POST" });
    if (!res.ok) {
        throw new Error(await readErrorMessage(res, "Could not remove extension from your list"));
    }
    return { mode: "hidden" };
}
export async function deleteOrHideExtension(extension) {
    if (extension.canDelete === false) {
        return hideExtensionForCurrentUser(extension.id);
    }
    const res = await fetch(agentNativePath(`/_agent-native/extensions/${extension.id}`), { method: "DELETE" });
    if (res.ok)
        return { mode: "deleted" };
    if (res.status === 403) {
        return hideExtensionForCurrentUser(extension.id);
    }
    throw new Error(await readErrorMessage(res, "Delete failed"));
}
export function invalidateExtensionRemoval(queryClient, extensionId) {
    queryClient.removeQueries({ queryKey: ["extension", extensionId] });
    queryClient.invalidateQueries({ queryKey: ["extensions"] });
    queryClient.invalidateQueries({ queryKey: ["extension-slots", extensionId] });
    queryClient.invalidateQueries({ queryKey: ["slot-installs"] });
    queryClient.invalidateQueries({ queryKey: ["slot-available"] });
}
//# sourceMappingURL=delete-extension.js.map