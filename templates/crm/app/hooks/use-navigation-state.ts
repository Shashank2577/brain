import { useEffect } from "react";
import { useLocation, useParams } from "react-router";
import { agentNativePath } from "@agent-native/core/client";

export interface NavigationState {
  view: "dashboard" | "contacts" | "contact" | "deals" | "deal";
  contactId?: string;
  dealId?: string;
  path?: string;
}

/**
 * Sync URL-derived navigation state into the framework's
 * `application_state.navigation` row so the agent always knows what the user
 * is looking at.
 */
export function useNavigationState() {
  const location = useLocation();
  const params = useParams();

  useEffect(() => {
    const path = location.pathname;
    let view: NavigationState["view"] = "dashboard";
    if (path === "/" || path === "") view = "dashboard";
    else if (path.startsWith("/contacts")) {
      view = params.id ? "contact" : "contacts";
    } else if (path.startsWith("/deals")) {
      view = params.id ? "deal" : "deals";
    }

    const state: NavigationState = {
      view,
      contactId: view === "contact" ? params.id : undefined,
      dealId: view === "deal" ? params.id : undefined,
      path,
    };

    fetch(agentNativePath("/_agent-native/application-state/navigation"), {
      method: "PUT",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({ value: state }),
      credentials: "include",
    }).catch(() => {
      // Non-fatal — the agent will see stale state until the next nav.
    });
  }, [location.pathname, params.id]);
}
