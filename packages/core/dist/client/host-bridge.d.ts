export declare const AGENT_NATIVE_HOST_BRIDGE_VERSION = "0.1.0";
export declare const AGENT_NATIVE_HOST_MESSAGE_TYPES: {
    readonly READY: "agentNative.host.ready";
    readonly INIT: "agentNative.host.init";
    readonly GET_CONTEXT: "agentNative.host.getContext";
    readonly CONTEXT: "agentNative.host.context";
    readonly AUTH: "agentNative.host.auth";
    readonly LIST_ACTIONS: "agentNative.host.listActions";
    readonly ACTIONS: "agentNative.host.actions";
    readonly RUN_ACTION: "agentNative.host.runAction";
    readonly ACTION_RESULT: "agentNative.host.actionResult";
    readonly COMMAND: "agentNative.host.command";
    readonly COMMAND_RESULT: "agentNative.host.commandResult";
    readonly ERROR: "agentNative.host.error";
};
export type AgentNativeHostMessageType = (typeof AGENT_NATIVE_HOST_MESSAGE_TYPES)[keyof typeof AGENT_NATIVE_HOST_MESSAGE_TYPES];
export type BuiltInAgentNativeHostCommand = "navigate" | "refreshData" | "refresh-data" | "remountView" | "remount-view" | "hardReload" | "hard-reload" | "openResource" | "open-resource" | "requestApproval" | "request-approval";
export type AgentNativeJsonSchema = Record<string, unknown>;
export type AgentNativeActionAvailability = "browser-session" | "current-page" | "backend" | "always";
export interface AgentNativeActionManifestEntry {
    name: string;
    description: string;
    schema?: AgentNativeJsonSchema;
    /** Alias for schema for function-calling/tooling runtimes. */
    parameters?: AgentNativeJsonSchema;
    title?: string;
    source?: "client" | "backend" | string;
    availability?: AgentNativeActionAvailability | string;
    destructive?: boolean;
    requiresApproval?: boolean | AgentNativeClientActionApprovalConfig;
    approval?: AgentNativeClientActionApprovalConfig;
    [key: string]: unknown;
}
export interface AgentNativeClientActionApprovalConfig {
    title?: string;
    description?: string;
    confirmLabel?: string;
    risk?: "low" | "medium" | "high" | string;
    [key: string]: unknown;
}
export interface AgentNativeHostSession {
    id: string;
    label?: string;
    connectedAt: string;
    url?: string;
    [key: string]: unknown;
}
export interface AgentNativeClientActionRuntime {
    requestId?: string;
    origin: string;
    context: AgentNativeHostContext;
    session: AgentNativeHostSession;
    event: MessageEvent;
    refresh(payload?: unknown): Promise<unknown>;
    command(command: string, payload?: unknown): Promise<unknown>;
}
export interface AgentNativeClientAction<TArgs = unknown, TResult = unknown> extends AgentNativeActionManifestEntry {
    run(args: TArgs, runtime: AgentNativeClientActionRuntime): TResult | Promise<TResult>;
}
export type AgentNativeClientActionGetter = () => AgentNativeClientAction[] | Promise<AgentNativeClientAction[]>;
export type AgentNativeClientActions = AgentNativeClientAction[] | AgentNativeClientActionGetter;
export interface AgentNativeHostRouteContext {
    pathname?: string;
    search?: string;
    hash?: string;
    name?: string;
    params?: Record<string, string | number | boolean | null | undefined>;
    [key: string]: unknown;
}
export interface AgentNativeHostSelectionContext {
    type?: string;
    text?: string;
    ids?: string[];
    ranges?: unknown[];
    [key: string]: unknown;
}
export interface AgentNativeHostResourceContext {
    type?: string;
    id?: string;
    name?: string;
    [key: string]: unknown;
}
export interface AgentNativeHostPrincipalContext {
    id?: string;
    email?: string;
    name?: string;
    [key: string]: unknown;
}
export interface AgentNativeHostCapabilities {
    commands?: string[];
    actions?: string[];
    refresh?: boolean;
    [key: string]: unknown;
}
export interface AgentNativeHostContext {
    url?: string;
    title?: string;
    route?: AgentNativeHostRouteContext;
    screen?: AgentNativeScreenSnapshot;
    session?: AgentNativeHostSession;
    selection?: AgentNativeHostSelectionContext;
    resource?: AgentNativeHostResourceContext;
    user?: AgentNativeHostPrincipalContext;
    organization?: AgentNativeHostPrincipalContext;
    capabilities?: AgentNativeHostCapabilities | string[];
    data?: Record<string, unknown>;
    [key: string]: unknown;
}
export interface AgentNativeHostAuthPayload {
    token?: string;
    headers?: Record<string, string>;
    userId?: string;
    organizationId?: string;
    [key: string]: unknown;
}
export type AgentNativeHostAuthValue = string | AgentNativeHostAuthPayload | null | undefined;
export type AgentNativeHostAuth = AgentNativeHostAuthValue | (() => AgentNativeHostAuthValue | Promise<AgentNativeHostAuthValue>);
export type AgentNativeHostContextGetter = () => AgentNativeHostContext | Promise<AgentNativeHostContext>;
export interface AgentNativeHostCommandRequest<TPayload = unknown> {
    command: string;
    payload?: TPayload;
    requestId?: string;
    origin: string;
}
export type AgentNativeHostCommandHandler<TPayload = unknown, TResult = unknown> = (request: AgentNativeHostCommandRequest<TPayload>, event: MessageEvent) => TResult | Promise<TResult>;
export type AgentNativeHostCommandHandlers = Record<string, AgentNativeHostCommandHandler | undefined>;
export type AgentNativeHostBridgeEvent = {
    type: "ready";
    requestId?: string;
    origin: string;
} | {
    type: "init";
    requestId?: string;
    origin?: string;
} | {
    type: "context";
    requestId?: string;
    origin?: string;
} | {
    type: "auth";
    requestId?: string;
    origin?: string;
} | {
    type: "actions";
    requestId?: string;
    count: number;
    origin?: string;
} | {
    type: "action";
    name: string;
    requestId?: string;
    origin: string;
} | {
    type: "command";
    command: string;
    requestId?: string;
    origin: string;
} | {
    type: "ignored";
    reason: "origin" | "source" | "message";
    origin: string;
} | {
    type: "error";
    requestId?: string;
    error: Error;
    origin?: string;
};
export interface AgentNativeHostBridgeOptions {
    /**
     * The iframe/content window that runs the agent sidecar. Can be set later
     * with `bridge.setTargetWindow(iframe.contentWindow)`.
     */
    targetWindow?: Window | null;
    /**
     * Exact origin allowed to talk to the host, or a full URL whose origin should
     * be trusted. Pass "*" only for local prototypes.
     */
    agentOrigin?: string;
    /** Stable browser-session identity. Used by the sidecar to distinguish tabs. */
    session?: string | Partial<AgentNativeHostSession>;
    /** Return current route, selected resource, user/org, and host-specific data. */
    getContext?: AgentNativeHostContextGetter;
    /**
     * Commands the sidecar may ask the host app to perform. If omitted, the
     * bridge still supports safe event-dispatch defaults for navigation/refresh.
     */
    commands?: AgentNativeHostCommandHandlers;
    /**
     * Optional bearer token or headers for the iframe sidecar. Only sent via
     * postMessage to the trusted `agentOrigin`.
     */
    auth?: AgentNativeHostAuth;
    /**
     * Live browser-session actions. These can change per render/page context and
     * are only callable while this host page is connected.
     */
    actions?: AgentNativeClientActions;
    onEvent?: (event: AgentNativeHostBridgeEvent) => void;
}
export interface AgentNativeHostBridge {
    start(): AgentNativeHostBridge;
    stop(): void;
    setTargetWindow(targetWindow: Window | null): void;
    post(message: Record<string, unknown>): boolean;
    sendInit(requestId?: string): Promise<boolean>;
    sendContext(requestId?: string): Promise<boolean>;
    refreshContext(): Promise<boolean>;
    sendAuth(requestId?: string): Promise<boolean>;
    sendActions(requestId?: string): Promise<boolean>;
}
export interface AgentNativeScreenSnapshot {
    url?: string;
    title?: string;
    route?: AgentNativeHostRouteContext;
    selection?: AgentNativeHostSelectionContext;
    visibleText?: string;
    html?: string;
    viewport?: {
        width: number;
        height: number;
        scrollX: number;
        scrollY: number;
    };
}
export interface AgentNativeScreenSnapshotOptions {
    /**
     * Root element to read from. Defaults to document.body, then documentElement.
     */
    root?: Element | null | (() => Element | null | undefined);
    /** Include textContent from the root element. Defaults to true. */
    includeVisibleText?: boolean;
    /** Include outerHTML from the root element. Defaults to false. */
    includeDomHtml?: boolean;
    /** Max characters of visible text to include. Defaults to 6000. */
    maxTextLength?: number;
    /** Max characters of DOM html to include. Defaults to 20000. */
    maxHtmlLength?: number;
}
export declare function readAgentNativeScreenContext(options?: AgentNativeScreenSnapshotOptions): AgentNativeHostContext;
export declare const defaultAgentNativeHostCommands: AgentNativeHostCommandHandlers;
export declare function createAgentNativeHostBridge(options: AgentNativeHostBridgeOptions): AgentNativeHostBridge;
export interface AgentNativeHostRequestOptions {
    /** Origin to send messages to. Defaults to "*" so prototypes can start. */
    targetOrigin?: string;
    /** Optional exact origin expected in replies from the host app. */
    hostOrigin?: string;
    timeoutMs?: number;
    targetWindow?: Window;
}
export declare function announceAgentNativeFrameReady(options?: AgentNativeHostRequestOptions): void;
export declare function requestAgentNativeHostContext(options?: AgentNativeHostRequestOptions): Promise<AgentNativeHostContext>;
export declare function requestAgentNativeHostActions(options?: AgentNativeHostRequestOptions): Promise<AgentNativeActionManifestEntry[]>;
export declare function runAgentNativeHostAction<TArgs = unknown, TResult = unknown>(name: string, args?: TArgs, options?: AgentNativeHostRequestOptions): Promise<TResult>;
export declare function sendAgentNativeHostCommand<TPayload = unknown, TResult = unknown>(command: BuiltInAgentNativeHostCommand | string, payload?: TPayload, options?: AgentNativeHostRequestOptions): Promise<TResult>;
export interface AgentNativeHostInit {
    version?: string;
    context?: AgentNativeHostContext;
    auth?: AgentNativeHostAuthPayload;
    actions?: AgentNativeActionManifestEntry[];
    session?: AgentNativeHostSession;
    contextError?: string;
    authError?: string;
    actionsError?: string;
}
export declare function onAgentNativeHostInit(handler: (init: AgentNativeHostInit) => void, options?: Pick<AgentNativeHostRequestOptions, "hostOrigin" | "targetWindow">): () => void;
//# sourceMappingURL=host-bridge.d.ts.map