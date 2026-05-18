import React from "react";
import type { ChatModelAdapter, ExportedMessageRepository } from "@assistant-ui/react";
import { type AgentDynamicSuggestionsOption } from "./dynamic-suggestions.js";
import type { ReasoningEffort } from "../shared/reasoning-effort.js";
import type { ChatThreadScope, ChatThreadSnapshot } from "./use-chat-threads.js";
export declare function displayableUserMessageText(text: string): string;
export declare function isAssistantUiStaleIndexError(error: unknown): boolean;
type AssistantUiStaleIndexErrorBoundaryProps = {
    resetKey: string;
    componentName?: string;
    children: React.ReactNode;
};
type AssistantUiStaleIndexErrorBoundaryState = {
    error: Error | null;
    retryToken: number;
};
export declare class AssistantUiStaleIndexErrorBoundary extends React.Component<AssistantUiStaleIndexErrorBoundaryProps, AssistantUiStaleIndexErrorBoundaryState> {
    state: AssistantUiStaleIndexErrorBoundaryState;
    private retryTimer;
    static getDerivedStateFromError(error: unknown): Partial<AssistantUiStaleIndexErrorBoundaryState>;
    componentDidCatch(error: unknown, info: React.ErrorInfo): void;
    componentDidUpdate(prevProps: AssistantUiStaleIndexErrorBoundaryProps): void;
    componentWillUnmount(): void;
    render(): import("react/jsx-runtime").JSX.Element;
}
export declare function AssistantMessageListErrorBoundary({ resetKey, children, }: {
    resetKey: string;
    children: React.ReactNode;
}): import("react/jsx-runtime").JSX.Element;
export interface AssistantChatHandle {
    /** Programmatically send a message into this chat */
    sendMessage(text: string): void;
    /** Queue a message to send after the current run finishes */
    queueMessage(text: string): void;
    /** Whether the chat is currently running */
    isRunning(): boolean;
    /** Focus the composer input */
    focusComposer(): void;
    /** Export the currently visible client-side thread for operations like fork. */
    exportThreadSnapshot(): ChatThreadSnapshot | null;
}
export interface AssistantChatAdapterContext {
    apiUrl: string;
    tabId?: string;
    threadId?: string;
    modelRef: {
        current: string | undefined;
    };
    engineRef: {
        current: string | undefined;
    };
    effortRef: {
        current: ReasoningEffort | undefined;
    };
    execModeRef: {
        current: "build" | "plan" | undefined;
    };
    browserTabId?: string;
    scopeRef: {
        current: ChatThreadScope | null | undefined;
    };
}
export interface AssistantChatProps {
    /** API endpoint URL. Default: "/_agent-native/agent-chat" */
    apiUrl?: string;
    /** Stable tab identifier passed to the adapter for event correlation */
    tabId?: string;
    /** Stable browser tab id used for tab-scoped app-state context. */
    browserTabId?: string;
    /** Thread ID for SQL-backed persistence. When set, messages are loaded from and saved to the server. */
    threadId?: string;
    /** Resource scope to include with chat requests for server-side context. */
    contextScope?: ChatThreadScope | null;
    /** Placeholder text for empty state */
    emptyStateText?: string;
    /** Suggestion prompts shown when no messages */
    suggestions?: string[];
    /** Context-aware suggestions merged with `suggestions`. Enabled by default. */
    dynamicSuggestions?: AgentDynamicSuggestionsOption;
    /** Optional content rendered in the empty state, above the suggestion buttons.
     *  Used by MultiTabAssistantChat to surface "previous chats for this design"
     *  when the current thread is empty but the scope has other threads. */
    emptyStateAddon?: React.ReactNode;
    /** Whether to show the header bar. Default: true */
    showHeader?: boolean;
    /** CSS class for the outer container */
    className?: string;
    /** Callback when user clicks "Use CLI" button */
    onSwitchToCli?: () => void;
    /** Callback when message count changes */
    onMessageCountChange?: (count: number) => void;
    /** Callback to save thread data to the server (provided by useChatThreads) */
    onSaveThread?: (threadId: string, data: {
        threadData: string;
        title: string;
        preview: string;
        messageCount: number;
    }) => void;
    /** Callback to generate a title from the first user message */
    onGenerateTitle?: (threadId: string, message: string) => void;
    /** Optional content rendered just above the composer input */
    composerSlot?: React.ReactNode;
    /** Class applied to the shared composer area for host-specific sizing/skin. */
    composerAreaClassName?: string;
    /** Optional content rendered inside the composer toolbar after the attach button. */
    composerToolbarSlot?: React.ReactNode;
    /** Optional action rendered beside the voice/send controls. */
    composerExtraActionButton?: React.ReactNode;
    /** Disable the composer for capability-gated surfaces while still showing history. */
    composerDisabled?: boolean;
    /** Placeholder to show while the composer is disabled by the host surface. */
    composerDisabledPlaceholder?: string;
    /** When true, skip the restore skeleton (used for freshly created threads with no messages) */
    isNewThread?: boolean;
    /** Called when a slash command (e.g. /clear, /help) is executed */
    onSlashCommand?: (command: string) => void;
    /** Current execution mode (build/plan) */
    execMode?: "build" | "plan";
    /** Callback to change execution mode */
    onExecModeChange?: (mode: "build" | "plan") => void;
    /** Disable Plan mode while leaving Act mode available. */
    planModeDisabled?: boolean;
    /** Explanation shown next to the disabled Plan option. */
    planModeDisabledReason?: string;
    /** Selected model override for this conversation (undefined = use server default) */
    selectedModel?: string;
    /** Default model from server config (shown in picker when no override is set) */
    defaultModel?: string;
    /** Selected engine override for this conversation */
    selectedEngine?: string;
    /** Selected reasoning effort override for this conversation */
    selectedEffort?: ReasoningEffort;
    /** Available engine/model list for the model picker */
    availableModels?: Array<{
        engine: string;
        label: string;
        models: string[];
        configured: boolean;
    }>;
    /** Callback when user picks a model from the picker */
    onModelChange?: (model: string, engine: string) => void;
    /** Callback when user picks a reasoning effort from the picker */
    onEffortChange?: (effort: ReasoningEffort) => void;
    /** Callback when user clicks "Fork Chat" in the message actions menu */
    onForkChat?: () => void | boolean | Promise<void | boolean>;
    /** Override Builder/provider connect routing for embedded hosts. */
    onConnectProvider?: () => void;
    /**
     * Controls the shared composer + menu. Sidebar keeps the full menu by default;
     * hosts without the sidebar provider stack can use upload-only.
     */
    plusMenuMode?: "full" | "upload-only" | "hidden";
    /**
     * Enable framework provider/env status checks. Embedded hosts that provide
     * model/provider state through another transport can disable these probes.
     */
    providerStatusChecksEnabled?: boolean;
    /**
     * Advanced host override for non-HTTP transports. Defaults to the production
     * sidebar SSE adapter when omitted.
     */
    createAdapter?: (context: AssistantChatAdapterContext) => ChatModelAdapter;
    /**
     * Explicitly recreate an injected adapter when the host transport identity
     * changes. Omit for the production sidebar so parent rerenders do not reset
     * active chats.
     */
    adapterReloadKey?: unknown;
    /**
     * Advanced host override for thread replay. Defaults to SQL thread fetch when
     * `threadId` is set, or sessionStorage for legacy tab chats.
     */
    loadHistoryRepository?: () => Promise<ExportedMessageRepository | null>;
    /** Re-run `loadHistoryRepository` when the host's external transcript changes. */
    historyReloadKey?: string | number | null;
}
export declare const CHAT_STORAGE_PREFIX = "agent-chat:";
/** Remove persisted chat for a given tabId (or "default"). */
export declare function clearChatStorage(tabId?: string): void;
import { extractThreadMeta } from "../agent/thread-data-builder.js";
export { extractThreadMeta };
export declare const AssistantChat: React.ForwardRefExoticComponent<AssistantChatProps & React.RefAttributes<AssistantChatHandle>>;
//# sourceMappingURL=AssistantChat.d.ts.map