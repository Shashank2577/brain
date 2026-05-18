import { useState, useEffect, useCallback } from "react";
import { sendToAgentChat } from "./agent-chat.js";
/**
 * Hook that wraps sendToAgentChat with a loading state.
 *
 * Returns [isGenerating, send] where:
 * - isGenerating: true after send() is called, false when the
 *   agentNative.chatRunning event reports that the run has stopped
 * - send: wrapper around sendToAgentChat that sets isGenerating to true
 */
export function useAgentChatGenerating() {
    const [isGenerating, setIsGenerating] = useState(false);
    useEffect(() => {
        const handler = (e) => {
            const detail = e.detail;
            if (typeof detail?.isRunning === "boolean") {
                setIsGenerating(detail.isRunning);
            }
        };
        window.addEventListener("agentNative.chatRunning", handler);
        return () => window.removeEventListener("agentNative.chatRunning", handler);
    }, []);
    const send = useCallback((opts) => {
        setIsGenerating(true);
        return sendToAgentChat(opts);
    }, []);
    return [isGenerating, send];
}
//# sourceMappingURL=use-agent-chat.js.map