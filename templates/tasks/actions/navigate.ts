import { defineAction } from "@agent-native/core";
import { writeAppState } from "@agent-native/core/application-state";
import { z } from "zod";

export default defineAction({
  description: "Navigate the tasks UI. Pass --filter or --taskId.",
  schema: z.object({
    path: z
      .string()
      .optional()
      .describe('URL path to navigate to (e.g. "/" for the list)'),
    filter: z
      .enum(["active", "completed", "all"])
      .optional()
      .describe("Filter tab to switch to"),
    taskId: z.string().optional().describe("Open a specific task by id"),
  }),
  http: false,
  run: async (args) => {
    let path = args.path;
    if (!path && args.taskId) path = `/${args.taskId}`;
    if (!path) path = "/";

    const payload: Record<string, unknown> = { path, ts: Date.now() };
    if (args.filter) payload.filter = args.filter;

    await writeAppState("navigate", payload);
    return `Navigating to ${path}`;
  },
});
