import React from "react";
import { type AssistantChatProps } from "./AssistantChat.js";
import { type ChatThreadScope } from "./use-chat-threads.js";
interface ChatTab {
    id: string;
    label: string;
    status: "idle" | "running" | "completed";
    /** If this tab is a sub-agent, the parent thread ID */
    parentThreadId?: string;
    /** Short name for sub-agent tabs (e.g. "Research", "Draft email") */
    subAgentName?: string;
}
export interface MultiTabAssistantChatHeaderProps {
    tabs: ChatTab[];
    activeTabId: string;
    activeTabMessageCount: number;
    setActiveTabId: (tabId: string) => void;
    addTab: () => void;
    closeTab: (tabId: string) => void;
    closeOtherTabs: (tabId: string) => void;
    closeAllTabs: () => void;
    clearActiveTab: () => void;
    /** Open the history popover */
    showHistory?: boolean;
    toggleHistory?: () => void;
    /** Number of open tabs (useful for triggering scroll on tab count change) */
    tabCount: number;
}
export type MultiTabAssistantChatProps = Omit<AssistantChatProps, "tabId" | "threadId"> & {
    /** Show the tab bar. Default: true */
    showTabBar?: boolean;
    /** Optional custom single-row header renderer */
    renderHeader?: (props: MultiTabAssistantChatHeaderProps) => React.ReactNode;
    /** Optional overlay actions renderer for the active tab */
    renderOverlay?: (props: MultiTabAssistantChatHeaderProps) => React.ReactNode;
    /** Hide the chat content while keeping the header visible. Used when CLI/resources mode is active. */
    contentHidden?: boolean;
    /** Namespace for localStorage keys — used to isolate chat state per app in the frame. */
    storageKey?: string;
    /** Stable browser tab id used for tab-scoped app-state context. */
    browserTabId?: string;
    /**
     * Bind new chats to a resource (deck, design, dashboard, etc.). When set,
     * the tab bar, history popover, and active-thread persistence all
     * partition by `{type, id}` — switching resources lands the user on the
     * thread they last had open for that resource, not whichever chat was
     * globally active. New chats automatically inherit this scope; the user
     * can detach a chat via the scope chip above the composer.
     */
    scope?: ChatThreadScope | null;
};
export declare function MultiTabAssistantChat({ showTabBar, renderHeader, renderOverlay, contentHidden, apiUrl, storageKey, browserTabId, scope, ...props }: MultiTabAssistantChatProps): import("react/jsx-runtime").JSX.Element;
export {};
//# sourceMappingURL=MultiTabAssistantChat.d.ts.map