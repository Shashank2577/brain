import React, { type IframeHTMLAttributes } from "react";
import { type AgentNativeClientActions, type AgentNativeHostAuth, type AgentNativeHostBridge, type AgentNativeHostBridgeEvent, type AgentNativeHostCommandHandlers, type AgentNativeHostContextGetter, type AgentNativeHostSession } from "./host-bridge.js";
export interface AgentNativeFrameProps extends Omit<IframeHTMLAttributes<HTMLIFrameElement>, "src"> {
    /** URL of the Agent-Native sidecar/frame app. */
    agentUrl: string;
    /**
     * Exact trusted sidecar origin. Defaults to `new URL(agentUrl).origin`.
     * Pass "*" only for local prototypes.
     */
    agentOrigin?: string;
    /** Stable browser-session identity for multi-tab sidecars. */
    session?: string | Partial<AgentNativeHostSession>;
    /** Return page, selection, resource, user/org, and host-specific context. */
    getContext?: AgentNativeHostContextGetter;
    /** Commands the iframe sidecar can ask the host app to run. */
    commands?: AgentNativeHostCommandHandlers;
    /** Live browser-session actions the iframe sidecar can discover and call. */
    actions?: AgentNativeClientActions;
    /** Optional auth payload sent to the trusted iframe sidecar. */
    auth?: AgentNativeHostAuth;
    onBridgeEvent?: (event: AgentNativeHostBridgeEvent) => void;
    onBridgeReady?: (bridge: AgentNativeHostBridge) => void;
}
export declare const AgentNativeFrame: React.ForwardRefExoticComponent<AgentNativeFrameProps & React.RefAttributes<HTMLIFrameElement>>;
//# sourceMappingURL=AgentNativeFrame.d.ts.map