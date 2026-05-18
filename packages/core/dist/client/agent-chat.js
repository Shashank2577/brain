/**
 * Agent Chat Bridge (browser)
 *
 * Sends structured messages to the agent chat from UI interactions.
 * Messages are sent via postMessage to the parent window (or self if top-level).
 * Builder frames are special: code requests go to Builder, but content prompts
 * stay inside the embedded app so its own AgentSidebar can receive them.
 */
import { getFrameOrigin, isTrustedFrameMessage } from "./frame.js";
import { isInBuilderFrame, isTrustedBuilderMessage, sendToBuilderChat, } from "./builder-frame.js";
const AGENT_CHAT_MESSAGE_TYPE = "agentNative.submitChat";
/**
 * Listen for chatRunning messages from the frame (postMessage)
 * and re-dispatch as a CustomEvent so hooks like useAgentChatGenerating() work.
 */
if (typeof window !== "undefined") {
    window.addEventListener("message", (event) => {
        if (!isTrustedFrameMessage(event) && !isTrustedBuilderMessage(event)) {
            return;
        }
        if (event.data?.type === "agentNative.chatRunning" ||
            event.data?.type === "builder.chatRunning") {
            window.dispatchEvent(new CustomEvent("agentNative.chatRunning", {
                detail: event.data.detail ?? event.data.data,
            }));
        }
    });
}
/** Generate a unique tab ID */
export function generateTabId() {
    return `chat-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;
}
/**
 * Send a message to the agent chat via postMessage.
 */
/**
 * Send a message to the agent chat via postMessage.
 * Returns the stable tabId for tracking this chat run.
 */
export function sendToAgentChat(opts) {
    const tabId = opts.tabId ?? generateTabId();
    const isCodeRequest = opts.type === "code" || opts.requiresCode === true;
    if (isCodeRequest && isInBuilderFrame()) {
        sendToBuilderChat({
            message: opts.message,
            context: opts.context,
            submit: opts.submit,
        });
        return tabId;
    }
    const payload = {
        type: AGENT_CHAT_MESSAGE_TYPE,
        data: { ...opts, tabId },
    };
    const targetSelf = !isCodeRequest && isInBuilderFrame();
    const target = targetSelf
        ? window
        : window.parent !== window
            ? window.parent
            : window;
    const targetOrigin = targetSelf
        ? window.location.origin
        : getFrameOrigin() || window.location.origin;
    target.postMessage(payload, targetOrigin);
    // Surface the sidebar so the user sees the response. Callers can opt out
    // via `openSidebar: false` for background/silent sends. AgentSidebar
    // listens for this event; the parent-frame case is handled by whoever
    // owns that sidebar receiving the postMessage above.
    if (opts.openSidebar !== false && !opts.background) {
        window.dispatchEvent(new CustomEvent("agent-panel:set-mode", {
            detail: { mode: "chat" },
        }));
        window.dispatchEvent(new CustomEvent("agent-panel:open"));
    }
    return tabId;
}
//# sourceMappingURL=agent-chat.js.map