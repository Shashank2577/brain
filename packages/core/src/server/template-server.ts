/**
 * Shared SSR catch-all wiring for agent-native templates.
 *
 * INVARIANT: Every template MUST have `server/routes/[...page].get.ts`
 * exporting `createTemplateServer(...)`. Without it, Nitro falls back to
 * its built-in renderer service, which loads `virtual:react-router/server-build`
 * as a Nitro service entry and expects `{ fetch }` exported from it. The
 * React Router virtual module exports a routes manifest, NOT a fetch handler,
 * so the dev request fails with:
 *
 *   NitroViteError: No fetch handler exported from virtual:react-router/server-build
 *
 * Putting the wiring behind this helper makes drift structurally impossible:
 * any new template that scaffolds the route in the canonical place is wired
 * correctly by construction. The `getBuild` callback MUST stay in the
 * template's own source so Vite's @react-router/dev plugin can resolve the
 * `virtual:` module — pulling the import into core would put it in
 * node_modules where Vite's SSR externalizer leaves it untouched.
 *
 * Canonical template usage:
 *
 *   // templates/<name>/server/routes/[...page].get.ts
 *   import { createTemplateServer } from "@agent-native/core/server/template-server";
 *   export default createTemplateServer({
 *     templateId: "<name>",
 *     getBuild: () => import("virtual:react-router/server-build"),
 *   });
 */
import { createH3SSRHandler } from "./ssr-handler.js";

export interface CreateTemplateServerOptions {
  /**
   * Stable identifier for this template (e.g. "notes", "calendar"). Used
   * for telemetry and so future wiring can light up per-template behavior
   * without changing every call site again.
   */
  templateId: string;
  /**
   * Lazy import of the React Router server build. MUST be a literal arrow
   * returning the virtual module import so Vite's plugin can resolve it
   * from the template's own source.
   */
  getBuild: () => Promise<unknown> | unknown;
}

/**
 * Build the catch-all SSR handler for a template. Returns an h3 event handler
 * suitable for `export default` from `server/routes/[...page].get.ts`.
 *
 * Deterministic: same input → same output. The handler always normalizes
 * the resolved server build to a callable React Router request handler,
 * so the page route never depends on the build module's shape.
 */
export function createTemplateServer(opts: CreateTemplateServerOptions) {
  // Touch templateId so it's reserved for future use (telemetry, per-template
  // overrides) without forcing every template to be edited again later.
  void opts.templateId;
  return createH3SSRHandler(opts.getBuild);
}
