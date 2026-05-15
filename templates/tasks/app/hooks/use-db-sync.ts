import { useQueryClient } from "@tanstack/react-query";
import { useDbSync as useCoreDbSync } from "@agent-native/core/client";

/**
 * Bind the framework polling sync to React Query's cache so the UI refreshes
 * within 2s whenever the agent (or another tab) writes a task.
 */
export function useDbSync() {
  const queryClient = useQueryClient();
  useCoreDbSync({
    queryClient,
    queryKeys: ["action"],
  });
}
