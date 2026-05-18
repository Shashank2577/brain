import { type NitroPluginDef } from "@agent-native/core/server";
import type { DispatchConfig } from "../config.js";
export declare function getDispatchConfig(): DispatchConfig;
/**
 * Wire dispatch into a Nitro server. Returns a Nitro plugin that stamps the
 * active config so the named-export plugins below pick it up at request time.
 *
 * Typical consumer wiring (one config-stamp plugin + four re-exported
 * plugins, each in its own `server/plugins/<name>.ts` file so Nitro
 * auto-loads them):
 *
 * ```ts
 * // server/plugins/setup-dispatch.ts
 * import { setupDispatch } from "@agent-native/dispatch/server";
 * export default setupDispatch({ auth: { googleOnly: true } });
 *
 * // server/plugins/auth.ts
 * export { dispatchAuthPlugin as default } from "@agent-native/dispatch/server";
 *
 * // server/plugins/integrations.ts
 * export { dispatchIntegrationsPlugin as default } from "@agent-native/dispatch/server";
 *
 * // server/plugins/agent-chat.ts
 * export { dispatchAgentChatPlugin as default } from "@agent-native/dispatch/server";
 *
 * // server/plugins/db.ts
 * export { dispatchDbPlugin as default } from "@agent-native/dispatch/server";
 *
 * // server/plugins/core-routes.ts
 * export { dispatchCoreRoutesPlugin as default } from "@agent-native/dispatch/server";
 * ```
 *
 * The plugins read from the same `getDispatchConfig()` singleton this
 * function stamps, so plugin module-load order does not matter — they
 * resolve config when their plugin function runs, not at import time.
 */
export declare function setupDispatch(config?: DispatchConfig): NitroPluginDef;
export { default as dispatchAuthPlugin } from "./plugins/auth.js";
export { default as dispatchIntegrationsPlugin } from "./plugins/integrations.js";
export { default as dispatchAgentChatPlugin } from "./plugins/agent-chat.js";
export { default as dispatchDbPlugin } from "./plugins/db.js";
export { default as dispatchCoreRoutesPlugin } from "./plugins/core-routes.js";
export type { DispatchConfig } from "../config.js";
//# sourceMappingURL=index.d.ts.map