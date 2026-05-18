export declare const SIDEBAR_OPEN_KEY = "agent-native-sidebar-open";
export declare const SIDEBAR_STATE_CHANGE_EVENT = "agent-panel:state-change";
export type AgentSidebarStateSource = "app" | "frame";
export type AgentSidebarStateMode = "app" | "code";
export interface AgentSidebarStateChangeDetail {
    /** Whether the user-visible agent panel is open. */
    open: boolean;
    /** Which surface owns the visible agent panel. */
    source: AgentSidebarStateSource;
    /** Frame protocol mode: "code" is parent-owned, "app" is app-owned. */
    mode: AgentSidebarStateMode;
}
export declare function dispatchAgentSidebarStateChange(detail: AgentSidebarStateChangeDetail): void;
export declare function getAgentSidebarUrlOpenOverride(): boolean | null;
export declare function consumeAgentSidebarUrlOpenOverride(): boolean | null;
export declare function getInitialAgentSidebarOpen(defaultOpen: boolean): boolean;
//# sourceMappingURL=agent-sidebar-state.d.ts.map