import React from "react";
import { type AgentChatSurfaceProps, type AgentSidebarProps } from "./AgentPanel.js";
import { type AgentNativeBrowserSessionBridge } from "./browser-session-bridge.js";
import { type AgentNativeClientActions, type AgentNativeHostCommandHandlers, type AgentNativeHostContextGetter, type AgentNativeHostSession, type AgentNativeScreenSnapshotOptions } from "./host-bridge.js";
export interface AgentNativeEmbeddedCommandCallbackInfo {
    command: string;
    requestId?: string;
    origin: string;
}
export type AgentNativeEmbeddedCommandCallback = (payload: unknown, info: AgentNativeEmbeddedCommandCallbackInfo) => unknown | Promise<unknown>;
export interface AgentNativeEmbeddedBrowserSessionOptions {
    endpoint?: string;
    sessionId?: string;
    label?: string;
    heartbeatMs?: number;
    pollMs?: number;
    ttlMs?: number;
    fetch?: typeof fetch;
    onReady?: (bridge: AgentNativeBrowserSessionBridge) => void;
}
export interface UseAgentNativeEmbeddedBrowserSessionOptions {
    enabled?: boolean;
    actions?: AgentNativeClientActions;
    getContext?: AgentNativeHostContextGetter;
    screen?: boolean | AgentNativeScreenSnapshotOptions;
    commands?: AgentNativeHostCommandHandlers;
    session?: string | Partial<AgentNativeHostSession>;
    browserSession?: AgentNativeEmbeddedBrowserSessionOptions;
    onRefresh?: AgentNativeEmbeddedCommandCallback;
    onNavigate?: AgentNativeEmbeddedCommandCallback;
    onRemount?: AgentNativeEmbeddedCommandCallback;
    onOpenResource?: AgentNativeEmbeddedCommandCallback;
    onRequestApproval?: AgentNativeEmbeddedCommandCallback;
}
export interface AgentNativeEmbeddedProps extends Omit<AgentSidebarProps, "children">, UseAgentNativeEmbeddedBrowserSessionOptions {
    children?: React.ReactNode;
    /**
     * Render only the agent chat surface when no host children are supplied.
     * Defaults to "sidebar" when `children` exist and "panel" otherwise.
     */
    surface?: "sidebar" | "panel";
    /** Props forwarded to AgentChatSurface in panel mode. */
    panel?: AgentChatSurfaceProps;
}
export declare function useAgentNativeEmbeddedBrowserSession({ enabled, actions, getContext, screen, commands, session, browserSession, onNavigate, onOpenResource, onRefresh, onRemount, onRequestApproval, }: UseAgentNativeEmbeddedBrowserSessionOptions): void;
export declare function AgentNativeEmbedded({ children, surface, actions, getContext, enabled, screen, commands, session, browserSession, onNavigate, onOpenResource, onRefresh, onRemount, onRequestApproval, panel, ...sidebarProps }: AgentNativeEmbeddedProps): import("react/jsx-runtime").JSX.Element;
//# sourceMappingURL=AgentNativeEmbedded.d.ts.map