import { defineAction } from "@agent-native/core";
import { writeAppState } from "@agent-native/core/application-state";

export default defineAction({
  description:
    "Bump the refresh-signal — invalidates the React Query caches the UI watches so list views re-fetch after an agent-side mutation.",
  schema: undefined,
  run: async () => {
    await writeAppState("refresh-signal", { ts: Date.now() });
    return { ok: true };
  },
});
