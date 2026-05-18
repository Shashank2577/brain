/**
 * Isomorphic Agent Chat Utility
 *
 * Works in both browser and Node.js contexts:
 * - Browser: sends via postMessage to the parent window
 * - Node.js (scripts): sends via BUILDER_PARENT_MESSAGE stdout format,
 *   which the Electron host translates to postMessage
 */
export interface AgentChatMessage {
    /** The visible prompt text shown in the chat input */
    message: string;
    /** Hidden context appended to the prompt (not shown to user, but sent to AI) */
    context?: string;
    /** true = auto-submit, false = prefill only, omit = use project setting */
    submit?: boolean;
}
/**
 * Send a structured message to the agent chat.
 * Automatically detects environment (browser vs Node.js) and uses the right transport.
 */
declare function send(data: AgentChatMessage): void;
/**
 * Submit a message to the agent chat (auto-submits by default).
 */
declare function submit(message: string, context?: string): void;
/**
 * Prefill the agent chat input without submitting (user reviews first).
 */
declare function prefill(message: string, context?: string): void;
export interface AgentChatCallOptions {
    context?: string;
    timeout?: number;
    framePort?: number;
}
export interface AgentChatResponse {
    response: string;
    filesChanged: string[];
    warnings?: string[];
}
/**
 * Request/response call to the frame agent.
 * Sends a message to the frame CLI endpoint and awaits a response.
 * Node.js only — requires the frame server to be running.
 */
declare function call(message: string, options?: AgentChatCallOptions): Promise<AgentChatResponse>;
export declare const agentChat: {
    /** Send raw AgentChatMessage — full control over all fields */
    send: typeof send;
    /** Auto-submit a message to agent chat */
    submit: typeof submit;
    /** Prefill the chat input for user review before sending */
    prefill: typeof prefill;
    /** Request/response call to the frame agent (Node.js only) */
    call: typeof call;
};
export {};
//# sourceMappingURL=agent-chat.d.ts.map