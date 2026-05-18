import { isInBuilderFrame } from "./builder-frame.js";
import { AGENT_SIDEBAR_QUERY_PARAM, AGENT_SIDEBAR_QUERY_VALUE_CLOSED, } from "../shared/agent-sidebar-url.js";
export const SIDEBAR_OPEN_KEY = "agent-native-sidebar-open";
export const SIDEBAR_STATE_CHANGE_EVENT = "agent-panel:state-change";
export function dispatchAgentSidebarStateChange(detail) {
    if (typeof window === "undefined")
        return;
    window.dispatchEvent(new CustomEvent(SIDEBAR_STATE_CHANGE_EVENT, {
        detail,
    }));
}
export function getAgentSidebarUrlOpenOverride() {
    if (typeof window === "undefined")
        return null;
    try {
        const url = new URL(window.location.href);
        const value = url.searchParams.get(AGENT_SIDEBAR_QUERY_PARAM);
        if (value === AGENT_SIDEBAR_QUERY_VALUE_CLOSED)
            return false;
    }
    catch { }
    return null;
}
export function consumeAgentSidebarUrlOpenOverride() {
    const override = getAgentSidebarUrlOpenOverride();
    if (override === null || typeof window === "undefined")
        return override;
    try {
        localStorage.setItem(SIDEBAR_OPEN_KEY, String(override));
    }
    catch { }
    try {
        const url = new URL(window.location.href);
        url.searchParams.delete(AGENT_SIDEBAR_QUERY_PARAM);
        window.history.replaceState(window.history.state, "", `${url.pathname}${url.search}${url.hash}`);
    }
    catch { }
    return override;
}
export function getInitialAgentSidebarOpen(defaultOpen) {
    const urlOverride = getAgentSidebarUrlOpenOverride();
    if (urlOverride !== null)
        return urlOverride;
    // On mobile viewports the sidebar would cover most of the screen, so
    // always start closed regardless of any persisted desktop preference.
    if (typeof window !== "undefined" &&
        window.matchMedia("(max-width: 767px)").matches) {
        return false;
    }
    // Builder owns the code/chat surface around embedded apps. Start the
    // app-native chat collapsed there even if a previous standalone session
    // persisted it as open.
    if (isInBuilderFrame()) {
        return false;
    }
    try {
        const saved = localStorage.getItem(SIDEBAR_OPEN_KEY);
        if (saved !== null)
            return saved === "true";
    }
    catch { }
    return defaultOpen;
}
//# sourceMappingURL=agent-sidebar-state.js.map