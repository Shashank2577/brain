import { useEffect } from "react";
import { useLocation, useNavigate } from "react-router";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { agentNativePath } from "@agent-native/core/client";

interface NavigationState {
  view: "list" | "detail";
  selectedTaskId?: string;
  filter?: "active" | "completed" | "all";
}

/**
 * Bidirectional navigation sync:
 *   - writes the current pathname / selectedTaskId to `application_state.navigation`
 *     so the agent (and any sister apps) can read it.
 *   - polls `application_state.navigate` for a one-shot agent navigation command
 *     and applies it.
 */
export function useNavigationState() {
  const location = useLocation();
  const navigate = useNavigate();
  const qc = useQueryClient();

  useEffect(() => {
    const path = location.pathname;
    const state: NavigationState = { view: "list" };
    const match = path.match(/^\/(task_[a-zA-Z0-9]+)$/);
    if (match) {
      state.view = "detail";
      state.selectedTaskId = match[1];
    }

    fetch(agentNativePath("/_agent-native/application-state/navigation"), {
      method: "PUT",
      keepalive: true,
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(state),
    }).catch(() => {});
  }, [location.pathname]);

  const { data: navCommand } = useQuery({
    queryKey: ["navigate-command"],
    queryFn: async () => {
      const res = await fetch(
        agentNativePath("/_agent-native/application-state/navigate"),
      );
      if (!res.ok) return null;
      const data = await res.json();
      if (data && data.path) {
        return { ...data, _ts: Date.now() };
      }
      return null;
    },
    refetchInterval: 2_000,
    structuralSharing: false,
  });

  useEffect(() => {
    if (!navCommand) return;
    fetch(agentNativePath("/_agent-native/application-state/navigate"), {
      method: "DELETE",
      headers: { "X-Agent-Native-CSRF": "1" },
    }).catch(() => {});

    navigate(navCommand.path, { flushSync: true });
    qc.setQueryData(["navigate-command"], null);
  }, [navCommand, navigate, qc]);
}
