import { defineAction } from "@agent-native/core";
import { getWorkspaceAppIdValidationError } from "@agent-native/core/shared";
import { z } from "zod";
import { scaffoldWorkspaceAppFromTemplate } from "../server/lib/app-creation-store.js";

/**
 * Phase 6 — Scaffold a new mini-app from one of the bundled starter
 * templates (blank, crud-list, dashboard, agent-tool).
 *
 * Unlike `scaffold-workspace-app`, which clones a first-party template
 * like Mail or Calendar, this action runs `agent-native add-app` with
 * one of the four starter ids the CLI recognises. The CLI copies
 * `packages/core/src/cli/starter-templates/<id>/` into
 * `apps/<name>/` with `<name>`/`<Name>`/`<NAME>` placeholders
 * substituted from the user-supplied slug.
 *
 * Local-dev only — runs the CLI as a subprocess. Deployed workspaces
 * should use `start-workspace-app-creation` (Builder branch flow).
 */
export default defineAction({
  description:
    "Scaffold a new mini-app from a Phase 6 starter template (blank, crud-list, dashboard, agent-tool). Local-dev only. The new app is created under apps/<name>/ and picked up automatically by the workspace gateway and capability registry.",
  schema: z.object({
    template: z
      .enum(["blank", "crud-list", "dashboard", "agent-tool"])
      .describe("Starter template id."),
    name: z
      .string()
      .min(1)
      .max(64)
      .refine((name) => !getWorkspaceAppIdValidationError(name), {
        message:
          "Use a non-reserved app id with lowercase letters, numbers, and hyphens.",
      })
      .describe("New app slug (kebab-case)."),
    icon: z
      .string()
      .optional()
      .describe(
        "Tabler icon hint for the rail (e.g. 'Sparkles'). Stored in the new app's package.json so the rail can pick it up.",
      ),
  }),
  run: async (input) =>
    scaffoldWorkspaceAppFromTemplate({
      template: input.template,
      appId: input.name,
    }),
});
