/**
 * Agent Chat Bridge (browser)
 *
 * Sends structured messages to the agent chat from UI interactions.
 * Messages are sent via postMessage to the parent window (or self if top-level).
 * Builder frames are special: code requests go to Builder, but content prompts
 * stay inside the embedded app so its own AgentSidebar can receive them.
 */
import type { ReasoningEffort } from "../shared/reasoning-effort.js";
export interface AgentChatMessage {
    /** The visible prompt message sent to the chat */
    message: string;
    /** Hidden context appended to the message (not shown in chat UI) */
    context?: string;
    /** true = auto-submit, false = prefill only, omit = use project setting */
    submit?: boolean;
    /** Optional project slug for structured context */
    projectSlug?: string;
    /** Optional preset name for downstream consumers */
    preset?: string;
    /** Optional reference image paths */
    referenceImagePaths?: string[];
    /** Optional uploaded reference images */
    uploadedReferenceImages?: string[];
    /** Stable tab identifier — auto-generated if omitted */
    tabId?: string;
    /**
     * Message routing type:
     * - "content" (default): stays in the embedded app agent for content/data operations
     * - "code": routes to the code editing frame (Agent Native Desktop or Builder.io)
     *
     * When type is "code" and no frame is connected, a dialog is shown.
     * `requiresCode: true` is treated as `type: "code"` for backward compatibility.
     */
    type?: "content" | "code";
    /** @deprecated Use `type: "code"` instead. If true, treated as `type: "code"`. */
    requiresCode?: boolean;
    /** Model preference for this sub-agent (e.g. "claude-haiku-4-5"). Uses default if omitted */
    model?: string;
    /** Engine preference paired with model for cross-provider switches. */
    engine?: string;
    /** Reasoning effort preference paired with model. */
    effort?: ReasoningEffort;
    /** Scoped system prompt additions for this sub-agent */
    instructions?: string;
    /**
     * Whether to open the agent sidebar if it's currently hidden.
     * Defaults to true — submitting a chat should make the response visible.
     * Pass `false` for background/silent sends that shouldn't pop the UI open.
     */
    openSidebar?: boolean;
    /**
     * When true, opens a new chat tab before sending the message.
     * Use for creation requests (create tool, dashboard, etc.) that deserve
     * their own isolated thread rather than cluttering an existing conversation.
     */
    newTab?: boolean;
    /**
     * When true with newTab, creates the tab in the background without
     * focusing it or opening the sidebar. The message runs silently.
     */
    background?: boolean;
}
/** Generate a unique tab ID */
export declare function generateTabId(): string;
/**
 * Send a message to the agent chat via postMessage.
 */
/**
 * Send a message to the agent chat via postMessage.
 * Returns the stable tabId for tracking this chat run.
 */
export declare function sendToAgentChat(opts: AgentChatMessage): string;
//# sourceMappingURL=agent-chat.d.ts.map