/**
 * Auto-discover actions from a template's actions/ directory.
 *
 * Scans for .ts/.js files and builds an action registry suitable for
 * `createAgentChatPlugin({ actions })`.
 *
 * Supports two action conventions:
 *
 * 1. **Full interface** — exports `tool: ActionTool` and `run(args): Promise<string>`.
 *    These are used directly.
 *
 * 2. **CLI-style** — exports only `default async function(args: string[])`.
 *    These are wrapped: args are converted from `Record<string, string>` to
 *    `["--key", "value", ...]`, console output is captured, and a tool
 *    definition is synthesized from the action name.
 *
 * 3. **defineAction** — exports `default` from `defineAction()`. Has `tool` and `run`.
 *
 * Usage in agent-chat plugins:
 * ```ts
 * import { autoDiscoverActions } from "@agent-native/core/server";
 *
 * export default createAgentChatPlugin({
 *   actions: () => autoDiscoverActions(import.meta.url),
 * });
 * ```
 */
import type { ActionEntry } from "../agent/production-agent.js";
/**
 * Register a map of actions contributed by a published package.
 *
 * Called from a package's server entrypoint via import side effects:
 * ```ts
 * // packages/dispatch/src/server/index.ts
 * import { registerPackageActions } from "@agent-native/core/server";
 * import { actions } from "../actions/index.js";
 * registerPackageActions(actions);
 * ```
 *
 * Idempotent — re-registering the same name from the same import is a no-op
 * so HMR / repeated dynamic imports don't double-warn.
 */
export declare function registerPackageActions(actions: Record<string, ActionEntry>): void;
/**
 * Normalize a pre-bundled static action registry (name → raw module) into
 * the `Record<string, ActionEntry>` shape the agent-chat plugin expects.
 *
 * Used by `autoDiscoverActions` when `.generated/actions-registry.ts` is
 * present so that Nitro-bundled serverless functions (Netlify, Vercel,
 * AWS-Lambda) can serve `/_agent-native/actions/*` routes without relying
 * on a filesystem scan that doesn't work in bundled output.
 */
export declare function loadActionsFromStaticRegistry(modules: Record<string, unknown>): Record<string, ActionEntry>;
/**
 * Auto-discover actions from a directory.
 *
 * Merges in any actions from the enterprise workspace core (if present in
 * the ancestor chain). Template actions take precedence over workspace-core
 * actions on name collision, so an app can override an enterprise-wide
 * action by dropping a same-named file under its own `actions/`.
 *
 * Note: this helper uses a filesystem scan, which works in dev and in
 * non-bundled Node deployments. In bundled serverless functions (Nitro's
 * netlify / vercel / aws-lambda presets) the `actions/` directory is not
 * on disk at runtime; templates should pass the static registry generated
 * by the Vite plugin to `createAgentChatPlugin({ actions })` instead, so
 * the bundler sees static imports and pulls every action into the bundle.
 *
 * @param from - The caller's `import.meta.url` or an absolute path to the
 *   actions directory.
 * @returns A record mapping action names to ActionEntry objects, suitable for
 *   passing to `createAgentChatPlugin({ actions })`.
 */
export declare function autoDiscoverActions(from: string): Promise<Record<string, ActionEntry>>;
export declare function mergeCoreSharingActions(registry: Record<string, ActionEntry>): Promise<void>;
/** @deprecated Use `autoDiscoverActions` instead */
export declare const autoDiscoverScripts: typeof autoDiscoverActions;
//# sourceMappingURL=action-discovery.d.ts.map