import { type AgentChatMessage } from "./agent-chat.js";
/**
 * Wraps sendToAgentChat with code-request gating.
 *
 * When a message has `type: "code"` (or `requiresCode: true`) and no
 * frame is connected, shows a dialog explaining code changes need Agent
 * Native Desktop or Builder. When a frame IS connected, the message is sent
 * to the frame and a code-agent indicator is shown.
 *
 * Returns a `codeRequiredDialog` React element that must be rendered
 * somewhere in the consumer's JSX tree.
 */
export declare function useSendToAgentChat(): {
    send: (opts: AgentChatMessage) => string | null;
    isGenerating: boolean;
    /** True when a code request is being processed by the frame */
    isCodeAgentWorking: boolean;
    codeRequiredDialog: React.ReactNode;
};
//# sourceMappingURL=use-send-to-agent-chat.d.ts.map