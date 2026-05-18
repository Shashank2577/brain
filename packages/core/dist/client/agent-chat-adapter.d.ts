import type { ChatModelAdapter } from "@assistant-ui/react";
import type { ReasoningEffort } from "../shared/reasoning-effort.js";
/**
 * The composer's exec mode is sent as explicit request metadata. The server
 * owns the plan-mode prompt and read-only tool filtering so the chat history
 * stays clean and Plan mode is enforced outside the model's goodwill.
 */
/**
 * Creates a ChatModelAdapter that connects to the agent-native
 * `/_agent-native/agent-chat` SSE endpoint. Supports reconnection via run-manager.
 */
export declare function createAgentChatAdapter(options?: {
    apiUrl?: string;
    tabId?: string;
    threadId?: string;
    modelRef?: {
        current: string | undefined;
    };
    engineRef?: {
        current: string | undefined;
    };
    effortRef?: {
        current: ReasoningEffort | undefined;
    };
    execModeRef?: {
        current: "build" | "plan" | undefined;
    };
}): ChatModelAdapter;
//# sourceMappingURL=agent-chat-adapter.d.ts.map