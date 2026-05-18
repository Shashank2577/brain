/**
 * Registry of shareable resources.
 *
 * Each template registers its ownable resource(s) once on module load so the
 * framework-level share actions (`share-resource`, `list-resource-shares`,
 * etc.) can dispatch to the correct tables.
 *
 *   import { registerShareableResource } from "@agent-native/core/sharing";
 *   import * as schema from "./schema.js";
 *
 *   registerShareableResource({
 *     type: "document",
 *     resourceTable: schema.documents,
 *     sharesTable: schema.documentShares,
 *     displayName: "Document",
 *     titleColumn: "title",
 *   });
 */
// Stash the registry on globalThis so it survives SSR bundle duplication.
// Vite SSR's `noExternal: /^(?!node:)/` policy means @agent-native/core gets
// inlined into every server bundle that imports it — and each bundle gets its
// own module-level state. A plain `new Map()` here would create one Map per
// bundle, so the template's `registerShareableResource()` (called from the
// Nitro plugin graph) wouldn't be visible to the framework's auto-mounted
// share-resource action (loaded via `import("../sharing/actions/...js")` in a
// different module instance). Using globalThis collapses them back to one Map.
const REGISTRY_KEY = "__agentNativeShareableResources__";
const globalRegistry = globalThis;
function getRegistry() {
    let r = globalRegistry[REGISTRY_KEY];
    if (!r) {
        r = new Map();
        globalRegistry[REGISTRY_KEY] = r;
    }
    return r;
}
export function registerShareableResource(entry) {
    getRegistry().set(entry.type, entry);
}
export function getShareableResource(type) {
    return getRegistry().get(type);
}
export function requireShareableResource(type) {
    const reg = getRegistry();
    const entry = reg.get(type);
    if (!entry) {
        throw new Error(`Unknown shareable resource type: "${type}". Did you forget registerShareableResource()?`);
    }
    return entry;
}
export function listShareableResources() {
    return Array.from(getRegistry().values());
}
//# sourceMappingURL=registry.js.map