/**
 * @deprecated `create-workspace` is now an alias for `create`. In current
 * versions, `agent-native create <name>` defaults to scaffolding a workspace
 * with a multi-select template picker. Use `--standalone` for a single-app
 * standalone scaffold.
 *
 * This module is kept for backwards compatibility with older docs and
 * scripts that still invoke `agent-native create-workspace`.
 */
import { createApp } from "./create.js";
export async function createWorkspace(opts = {}) {
    const passthrough = {
        template: opts.template,
        noInstall: opts.noInstall,
    };
    await createApp(opts.name, passthrough);
}
//# sourceMappingURL=create-workspace.js.map