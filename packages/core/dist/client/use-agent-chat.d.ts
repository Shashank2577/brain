import { type AgentChatMessage } from "./agent-chat.js";
/**
 * Hook that wraps sendToAgentChat with a loading state.
 *
 * Returns [isGenerating, send] where:
 * - isGenerating: true after send() is called, false when the
 *   agentNative.chatRunning event reports that the run has stopped
 * - send: wrapper around sendToAgentChat that sets isGenerating to true
 */
export declare function useAgentChatGenerating(): [
    boolean,
    (opts: AgentChatMessage) => string
];
//# sourceMappingURL=use-agent-chat.d.ts.map