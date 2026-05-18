import { type AgentNativeClientActions, type AgentNativeHostRequestOptions, type AgentNativeHostCommandHandlers, type AgentNativeHostContextGetter, type AgentNativeHostSession } from "./host-bridge.js";
import type { AgentNativeBrowserSessionRecord, AgentNativeBrowserSessionRequest } from "../browser-sessions/types.js";
export interface AgentNativeBrowserSessionBridgeOptions extends AgentNativeHostRequestOptions {
    /** Framework browser-session endpoint. Defaults to /_agent-native/browser-sessions. */
    endpoint?: string;
    /** Stable tab/session id. Defaults to the host-provided session id. */
    sessionId?: string;
    /**
     * Direct in-app session identity. Use this when the Agent-Native chat is
     * rendered inside the host app instead of inside a sidecar iframe.
     */
    session?: string | Partial<AgentNativeHostSession>;
    /**
     * Direct in-app context getter. When set, the bridge does not use
     * postMessage; it registers this tab directly with the backend.
     */
    getContext?: AgentNativeHostContextGetter;
    /** Direct in-app client actions exposed to backend browser-session tools. */
    actions?: AgentNativeClientActions;
    /** Direct in-app host commands exposed to backend browser-session tools. */
    commands?: AgentNativeHostCommandHandlers;
    /** Origin label passed to direct action/command callbacks. */
    origin?: string;
    /** Human-readable label shown to the agent when multiple tabs are live. */
    label?: string;
    /** Re-register host context/actions on this interval. Defaults to 5s. */
    heartbeatMs?: number;
    /** Claim pending backend requests on this interval. Defaults to 500ms. */
    pollMs?: number;
    /** Session TTL on the server. Defaults to 45s. */
    ttlMs?: number;
    /** Override fetch for tests or custom runtimes. */
    fetch?: typeof fetch;
}
export interface AgentNativeBrowserSessionBridge {
    readonly sessionId: string | null;
    start(): AgentNativeBrowserSessionBridge;
    stop(): void;
    refreshRegistration(): Promise<AgentNativeBrowserSessionRecord>;
    claimOnce(): Promise<AgentNativeBrowserSessionRequest | null>;
}
export declare function createAgentNativeBrowserSessionBridge(options?: AgentNativeBrowserSessionBridgeOptions): AgentNativeBrowserSessionBridge;
export declare function startAgentNativeBrowserSessionBridge(options?: AgentNativeBrowserSessionBridgeOptions): AgentNativeBrowserSessionBridge;
//# sourceMappingURL=browser-session-bridge.d.ts.map