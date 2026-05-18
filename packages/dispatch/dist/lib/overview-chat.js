import { isInBuilderFrame, sendToAgentChat } from "@agent-native/core/client";
export function submitOverviewPrompt(message, selectedModel) {
    const trimmed = message.trim();
    if (!trimmed)
        return null;
    if (isInBuilderFrame()) {
        return sendToAgentChat({
            message: trimmed,
            submit: true,
            type: "code",
        });
    }
    return sendToAgentChat({
        message: trimmed,
        submit: true,
        newTab: true,
        model: selectedModel || undefined,
    });
}
//# sourceMappingURL=overview-chat.js.map