/**
 * meetings.navigate — write a one-shot `navigate` app-state key so the UI
 * picks it up on its next poll cycle.
 */
import { defineAction } from "@agent-native/core";
import { writeAppState } from "@agent-native/core/application-state";
import { z } from "zod";

export default defineAction({
  description: "Navigate the Meetings UI to a specific view or meeting.",
  schema: z.object({
    view: z
      .enum(["list", "meeting"])
      .optional()
      .describe("Target view; 'meeting' requires --meetingId"),
    meetingId: z.string().optional(),
    panel: z.enum(["transcript", "summary"]).optional(),
  }),
  run: async (args) => {
    await writeAppState("navigate", {
      view: args.view ?? (args.meetingId ? "meeting" : "list"),
      meetingId: args.meetingId,
      panel: args.panel,
    });
    return { navigated: true as const };
  },
});
