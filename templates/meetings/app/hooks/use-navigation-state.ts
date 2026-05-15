import { useEffect, useRef } from "react";
import { useLocation, useNavigate } from "react-router";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { agentNativePath } from "@agent-native/core/client";

export type MeetingsView = "list" | "meeting";

export interface NavigationState {
  view: MeetingsView;
  meetingId?: string;
  panel?: "transcript" | "summary";
  path?: string;
}

interface NavigateCommand extends Partial<NavigationState> {
  path?: string;
  _ts?: number;
}

function stateFromLocation(pathname: string): NavigationState {
  const p = pathname.replace(/\/+$/, "") || "/";
  const meetingMatch = p.match(/^\/([^/]+)$/);
  if (meetingMatch && meetingMatch[1] !== "" && meetingMatch[1] !== "list") {
    return { view: "meeting", meetingId: meetingMatch[1] };
  }
  return { view: "list" };
}

function pathFromCommand(cmd: NavigateCommand): string {
  if (cmd.path) return cmd.path;
  if (cmd.view === "meeting" && cmd.meetingId) return `/${cmd.meetingId}`;
  return "/";
}

export function useNavigationState() {
  const location = useLocation();
  const navigate = useNavigate();
  const qc = useQueryClient();
  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    const state = stateFromLocation(location.pathname);
    if (debounceRef.current) clearTimeout(debounceRef.current);
    debounceRef.current = setTimeout(() => {
      fetch(agentNativePath("/_agent-native/application-state/navigation"), {
        method: "PUT",
        keepalive: true,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(state),
      }).catch(() => {});
    }, 300);
    return () => {
      if (debounceRef.current) clearTimeout(debounceRef.current);
    };
  }, [location.pathname]);

  const { data: navCommand } = useQuery<NavigateCommand | null>({
    queryKey: ["navigate-command"],
    queryFn: async () => {
      const res = await fetch(
        agentNativePath("/_agent-native/application-state/navigate"),
      );
      if (!res.ok) return null;
      const data = (await res.json()) as NavigateCommand | null;
      if (data) return { ...data, _ts: Date.now() };
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
    const path = pathFromCommand(navCommand);
    navigate(path);
    qc.setQueryData(["navigate-command"], null);
  }, [navCommand, navigate, qc]);
}
