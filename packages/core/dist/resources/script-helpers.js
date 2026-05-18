/**
 * Resource helpers for use in scripts.
 *
 * Scripts run inside an authenticated request context (set by the agent
 * runtime) or — in CLI-only contexts — read AGENT_USER_EMAIL. Both paths
 * require a real identity; there is no dev-mode fallback.
 */
import { SHARED_OWNER, WORKSPACE_OWNER, resourceGetByPath, resourcePut, resourceDeleteByPath, resourceList, resourceListAccessible, resourceEffectiveContext, ensurePersonalDefaults, } from "./store.js";
import { getRequestUserEmail } from "../server/request-context.js";
function getOwnerForScope(scope) {
    if (scope === "shared")
        return SHARED_OWNER;
    if (scope === "workspace")
        return WORKSPACE_OWNER;
    const userEmail = getRequestUserEmail();
    if (userEmail)
        return userEmail;
    const cliEmail = process.env.AGENT_USER_EMAIL;
    if (cliEmail)
        return cliEmail;
    throw new Error("Resource access requires an authenticated request context or AGENT_USER_EMAIL env var");
}
function resolveScope(options) {
    return options?.scope ?? (options?.shared ? "shared" : "personal");
}
export async function readResource(path, options) {
    const owner = getOwnerForScope(resolveScope(options));
    const resource = await resourceGetByPath(owner, path);
    return resource ? resource.content : null;
}
export async function writeResource(path, content, options) {
    const owner = getOwnerForScope(resolveScope(options));
    const writeOptions = {
        visibility: options?.visibility,
        createdBy: options?.createdBy,
        threadId: options?.threadId,
        runId: options?.runId,
        expiresAt: options?.expiresAt,
        metadata: options?.metadata,
    };
    const hasWriteOptions = Object.values(writeOptions).some((value) => value !== undefined);
    if (hasWriteOptions) {
        await resourcePut(owner, path, content, options?.mimeType, writeOptions);
        return;
    }
    await resourcePut(owner, path, content, options?.mimeType);
}
export async function deleteResource(path, options) {
    const owner = getOwnerForScope(resolveScope(options));
    return resourceDeleteByPath(owner, path);
}
export async function listResources(prefix, options) {
    const owner = getOwnerForScope(resolveScope(options));
    return options?.includeAgentScratch
        ? resourceList(owner, prefix, { includeAgentScratch: true })
        : resourceList(owner, prefix);
}
export async function listAllResources(prefix, options) {
    const userEmail = getOwnerForScope("personal");
    return options?.includeAgentScratch
        ? resourceListAccessible(userEmail, prefix, { includeAgentScratch: true })
        : resourceListAccessible(userEmail, prefix);
}
export async function getEffectiveResourceContext(path) {
    const userEmail = getOwnerForScope("personal");
    await ensurePersonalDefaults(userEmail);
    return resourceEffectiveContext(userEmail, path);
}
//# sourceMappingURL=script-helpers.js.map