/**
 * Client helpers for pages rendered inside an agent-chat `embed` iframe.
 *
 * Embedded pages are sandboxed, same-origin iframes mounted by `IframeEmbed`.
 * They usually want a "pop out" button that takes the user to the same URL
 * in the main app window. `postNavigate` handles that — when running inside
 * an embed it posts a message to the parent, which updates the parent's URL
 * without reloading. When running standalone (not in an iframe) it falls
 * back to a same-window navigation.
 */
export declare const AGENT_NAVIGATE_MESSAGE_TYPE = "agent-native:navigate";
export interface AgentNavigateMessage {
    type: typeof AGENT_NAVIGATE_MESSAGE_TYPE;
    path: string;
}
/**
 * Navigate the main app window to the given same-origin path.
 *
 * Accepts paths beginning with `/`. Absolute URLs are rejected — embeds
 * should not be able to steer the parent to arbitrary origins.
 */
export declare function postNavigate(path: string): void;
/**
 * True when the current page is running inside an agent-chat embed iframe.
 * Use to show/hide "Open in main window" buttons.
 */
export declare function isInAgentEmbed(): boolean;
//# sourceMappingURL=embed.d.ts.map