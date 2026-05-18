type NitroPluginDef = (nitroApp: any) => void | Promise<void>;
/**
 * Creates a Nitro plugin that mounts all resource CRUD routes.
 *
 * Routes:
 *   GET    /_agent-native/resources          — list resources
 *   POST   /_agent-native/resources          — create resource
 *   GET    /_agent-native/resources/tree     — get resource tree
 *   POST   /_agent-native/resources/upload   — upload file
 *   GET    /_agent-native/resources/:id      — get resource by ID
 *   PUT    /_agent-native/resources/:id      — update resource
 *   DELETE /_agent-native/resources/:id      — delete resource
 */
export declare function createResourcesPlugin(): NitroPluginDef;
/**
 * Default resources plugin — mount with no configuration needed.
 *
 * Usage in templates:
 * ```ts
 * // server/plugins/resources.ts
 * import { defaultResourcesPlugin } from "@agent-native/core/server";
 * export default defaultResourcesPlugin;
 * ```
 */
export declare const defaultResourcesPlugin: NitroPluginDef;
export {};
//# sourceMappingURL=resources-plugin.d.ts.map