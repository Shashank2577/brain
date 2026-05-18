/**
 * Generic cross-app MCP tools — a stable verb set every external agent gets
 * regardless of which template it is talking to.
 *
 * These are merged into the MCP action registry by
 * `createMCPServerForRequest` (see `build-server.ts`). **Precedence: template
 * actions win.** If a template defines an action named `list_apps` /
 * `open_app` / `ask_app` / `create_workspace_app` / `list_templates`, the
 * template's `ActionEntry` overwrites the builtin of the same name. This is
 * the same template-over-framework precedence `autoDiscoverActions` uses.
 *
 * | Tool                  | Side effects | Returns                                  |
 * | --------------------- | ------------ | ---------------------------------------- |
 * | `list_apps`           | none         | `{ apps: [{ id, url, running }] }`       |
 * | `open_app`            | none         | `{ url }` (+ deep-link `link`)           |
 * | `ask_app`             | agent loop   | `{ app, routedVia, response }`           |
 * | `create_workspace_app`| scaffolds    | `{ name, url, port, deepLink }` (+ link) |
 *
 * `open_app` / `create_workspace_app` return an **absolute** URL on the
 * *target* app's origin when it differs from this app (so a workspace link
 * lands in the right app), and a relative path for the same app / standalone.
 * `ask_app` routes to a *different* workspace app over A2A when possible and
 * reports `routedVia: "a2a"`; otherwise it answers locally
 * (`routedVia: "local"`) and never falsely claims cross-app delegation.
 * | `list_templates`      | none         | `{ templates: [...] }` (allow-list only) |
 *
 * Node-only at call time (workspace resolution + scaffolding use `fs`), but
 * the module has no top-level Node imports so it bundles fine alongside
 * `mountMCP` — the Node bits are dynamically imported inside `run()`.
 */
import type { ActionEntry } from "../agent/production-agent.js";
import type { MCPConfig } from "./build-server.js";
/**
 * Build the generic cross-app builtin tool registry. Called by
 * `createMCPServerForRequest`; the result is merged UNDER the config's
 * actions so template actions of the same name win.
 */
export declare function getBuiltinCrossAppTools(config: MCPConfig, requestMeta?: {
    origin?: string;
}): Record<string, ActionEntry>;
//# sourceMappingURL=builtin-tools.d.ts.map