/**
 * meetings.refresh-list — bump the global refresh-signal so the UI
 * invalidates its query caches.
 */
import { defineAction } from "@agent-native/core";
import { writeAppState } from "@agent-native/core/application-state";
import { z } from "zod";

export default defineAction({
  description: "Bump refresh-signal so the Meetings UI re-renders.",
  schema: z.object({}).optional(),
  run: async () => {
    await writeAppState("refresh-signal", { ts: Date.now() });
    return { refreshed: true as const };
  },
});
