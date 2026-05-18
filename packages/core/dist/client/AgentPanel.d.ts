/**
 * AgentPanel — unified agent component with chat, CLI, and workspace modes.
 *
 * A self-contained panel with no layout opinions — drop it into a sidebar,
 * popover, dialog, full page, or any container. It fills its parent via
 * flex and min-h-0.
 *
 * Features:
 * - Chat mode: assistant-ui powered chat with tool calls
 * - CLI mode: embedded xterm.js terminal (dev mode only)
 * - Toggle between modes via header buttons
 *
 * Usage:
 *   // In a sidebar
 *   <div style={{ width: 380 }}><AgentPanel /></div>
 *
 *   // In a popover
 *   <Popover><AgentPanel suggestions={[...]} /></Popover>
 *
 *   // Full page
 *   <AgentPanel className="h-screen" />
 */
import React from "react";
import type { AssistantChatProps } from "./AssistantChat.js";
export interface AgentPanelCodeAccess {
    /** Whether this surface can safely edit source, access workspace files, and run shell commands. */
    enabled: boolean;
    /** Heading shown when code access is unavailable. */
    unavailableTitle?: string;
    /** Detail copy shown when code access is unavailable. */
    unavailableDescription?: string;
    /** Optional CTA label for the unavailable state. */
    unavailableCtaLabel?: string;
    /** Optional CTA URL for the unavailable state. */
    unavailableCtaHref?: string;
    /** Optional secondary CTA label, usually for Builder cloud code changes. */
    unavailableSecondaryCtaLabel?: string;
    /** Optional secondary CTA URL, usually the Builder connect URL. */
    unavailableSecondaryCtaHref?: string;
    /** @deprecated Chat stays available when code access is unavailable. */
    unavailableComposerPlaceholder?: string;
}
export interface AgentPanelProps extends Omit<AssistantChatProps, "onSwitchToCli"> {
    /** Initial mode. Default: "chat" */
    defaultMode?: "chat" | "cli";
    /** CSS class for the outer container */
    className?: string;
    /** Called when the user clicks the collapse button. If provided, a collapse button appears in the header. */
    onCollapse?: () => void;
    /** Whether the panel is currently in fullscreen (Claude-style centered) mode. */
    isFullscreen?: boolean;
    /** Called when the user clicks the maximize/minimize button. If provided, the button appears next to the collapse button. */
    onToggleFullscreen?: () => void;
    /** URL of the app being developed (shown as "Open app in new tab" in settings). Set by frame. */
    devAppUrl?: string;
    /** Namespace for localStorage keys — used to isolate chat state per app in the frame. */
    storageKey?: string;
    /**
     * Bind the chat to a specific resource (deck, design, dashboard, ...).
     * When set, chats started inside the panel inherit this scope, the tab
     * bar partitions per (storageKey, scope), and the user gets a "Working
     * on {label}" badge with a Detach escape hatch. Templates compute this
     * from the current route — see the `Layout` files for each template.
     */
    scope?: import("./use-chat-threads.js").ChatThreadScope | null;
    /** Optional notice rendered below the main header while Chat mode is active. */
    chatNotice?: React.ReactNode;
    /** Capability gate for source edits, workspace files, and CLI access. */
    codeAccess?: AgentPanelCodeAccess;
}
export declare function AgentPanel(props: AgentPanelProps): import("react/jsx-runtime").JSX.Element;
export interface AgentSidebarProps {
    children: React.ReactNode;
    /** Placeholder text for the empty chat state */
    emptyStateText?: string;
    /** Suggestion prompts shown when no messages */
    suggestions?: string[];
    /** Initial sidebar width in pixels. Mount-only; user resize and a saved
     *  localStorage value override this. Default: 380 */
    defaultSidebarWidth?: number;
    /** @deprecated Use `defaultSidebarWidth` — this prop is mount-only. */
    sidebarWidth?: number;
    /** Which side the sidebar appears on. Default: "right" */
    position?: "left" | "right";
    /** Whether the sidebar starts open. Default: false */
    defaultOpen?: boolean;
    /** Animate the mobile overlay in a sheet-style slide transition. */
    animateMobile?: boolean;
    /**
     * Bind chats to a resource. When set, every chat started here is
     * scoped to `{type, id}`, the tab bar/history partition by that scope,
     * and a "Working on {label}" badge appears with a Detach option.
     * Templates compute this from the active route (see template layouts).
     */
    scope?: import("./use-chat-threads.js").ChatThreadScope | null;
}
/**
 * Wraps app content with a toggleable agent sidebar.
 * Use AgentToggleButton in your header to open/close it.
 */
export declare function AgentSidebar({ children, emptyStateText, suggestions, defaultSidebarWidth, sidebarWidth, position, defaultOpen, animateMobile, scope, }: AgentSidebarProps): import("react/jsx-runtime").JSX.Element;
/**
 * Focus the agent chat composer input.
 * Opens the sidebar if closed, then focuses the text input.
 */
export declare function focusAgentChat(): void;
/**
 * Button to toggle the agent sidebar. Place this in your app's header/toolbar.
 * Dispatches a custom event that AgentSidebar listens for.
 */
export declare function AgentToggleButton({ className }: {
    className?: string;
}): import("react/jsx-runtime").JSX.Element;
//# sourceMappingURL=AgentPanel.d.ts.map