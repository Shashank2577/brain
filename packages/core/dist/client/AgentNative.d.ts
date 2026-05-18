import { type AgentNativeFrameProps } from "./AgentNativeFrame.js";
import { type AgentNativeClientActions, type AgentNativeHostCommandHandlers, type AgentNativeHostContextGetter, type AgentNativeScreenSnapshotOptions } from "./host-bridge.js";
export interface AgentNativeCommandCallbackInfo {
    command: string;
    requestId?: string;
    origin: string;
}
export type AgentNativeCommandCallback = (payload: unknown, info: AgentNativeCommandCallbackInfo) => unknown | Promise<unknown>;
export interface AgentNativeProps extends Omit<AgentNativeFrameProps, "actions" | "commands" | "getContext"> {
    /**
     * Live browser-session tools. These can change as page state changes and are
     * only callable while this tab is connected.
     */
    actions?: AgentNativeClientActions;
    /** Semantic app/page context layered over the built-in screen snapshot. */
    getContext?: AgentNativeHostContextGetter;
    /**
     * Built-in screen context. Defaults to visible text + route + selection.
     * Pass false to disable, or { includeDomHtml: true } for a DOM fallback.
     */
    screen?: boolean | AgentNativeScreenSnapshotOptions;
    /** Extra/advanced host commands. */
    commands?: AgentNativeHostCommandHandlers;
    onRefresh?: AgentNativeCommandCallback;
    onNavigate?: AgentNativeCommandCallback;
    onRemount?: AgentNativeCommandCallback;
    onOpenResource?: AgentNativeCommandCallback;
    onRequestApproval?: AgentNativeCommandCallback;
}
export declare function useAgentNativeScreenContext(options?: AgentNativeScreenSnapshotOptions): AgentNativeHostContextGetter;
export declare function AgentNative({ actions, getContext, screen, commands, onRefresh, onNavigate, onRemount, onOpenResource, onRequestApproval, ...frameProps }: AgentNativeProps): import("react/jsx-runtime").JSX.Element;
//# sourceMappingURL=AgentNative.d.ts.map