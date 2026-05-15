import { defineAction } from "@agent-native/core";
import { z } from "zod";
import { listStarterTemplates } from "../server/lib/app-creation-store.js";

/**
 * Phase 6 — Surface the four starter-template options to the dispatch
 * "Create app" popover so the user can pick a starter before naming
 * the app. The list is hard-coded inside the dispatch package; this
 * action exists so the popover doesn't have to hard-code the same
 * catalog client-side.
 */
export default defineAction({
  description:
    "List the bundled Phase 6 starter templates (blank, crud-list, dashboard, agent-tool) the dispatch picker can scaffold.",
  schema: z.object({}),
  http: { method: "GET" },
  run: async () => {
    const templates = await listStarterTemplates();
    return { templates };
  },
});
