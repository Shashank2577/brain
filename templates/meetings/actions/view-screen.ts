/**
 * meetings.view-screen — snapshot of what the user is looking at.
 * Returns the `navigation` app-state plus the currently-selected meeting's
 * id (if any). Cheap; safe to call on every agent turn.
 */
import { defineAction } from "@agent-native/core";
import { readAppState } from "@agent-native/core/application-state";
import { z } from "zod";

export default defineAction({
  description:
    "Snapshot of the user's current Meetings screen (view + selected meeting id).",
  schema: z.object({}).optional(),
  http: { method: "GET" },
  run: async () => {
    const nav = (await readAppState("navigation")) as
      | { view?: string; meetingId?: string; panel?: string }
      | null
      | undefined;
    return {
      view: nav?.view ?? "list",
      meetingId: nav?.meetingId,
      panel: nav?.panel,
    };
  },
});
