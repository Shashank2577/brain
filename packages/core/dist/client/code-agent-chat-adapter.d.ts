import type { ChatModelAdapter } from "@assistant-ui/react";
import type { ReasoningEffort } from "../shared/reasoning-effort.js";
import { type CodeAgentRunStateLike } from "../code-agents/transcript-order.js";
import { type CodeAgentTranscriptEvent as CoreCodeAgentTranscriptEvent } from "../code-agents/transcript-normalizer.js";
import type { ContentPart } from "./sse-event-processor.js";
export type CodeAgentChatFollowUpMode = "immediate" | "queued";
export interface CodeAgentChatTranscriptEvent {
    id: string;
    runId: string;
    kind?: CoreCodeAgentTranscriptEvent["kind"];
    type?: CoreCodeAgentTranscriptEvent["kind"] | "note";
    message?: string;
    text?: string;
    createdAt: string;
    metadata?: Record<string, unknown>;
    artifactPath?: string;
    artifactUrl?: string;
}
export interface CodeAgentChatControlResult {
    ok: boolean;
    run?: CodeAgentRunStateLike | null;
    queued?: boolean;
    message?: string;
    error?: string;
}
export interface CodeAgentChatController {
    get(runId: string): Promise<CodeAgentRunStateLike | null>;
    transcript(runId: string): Promise<CodeAgentChatTranscriptEvent[]>;
    sendFollowUp(input: {
        runId: string;
        prompt: string;
        mode?: CodeAgentChatFollowUpMode;
        permissionMode?: string;
        engine?: string;
        model?: string;
        reasoningEffort?: ReasoningEffort;
        source?: string;
        metadata?: Record<string, unknown>;
    }): Promise<CodeAgentChatControlResult>;
    control(input: {
        runId: string;
        command: "stop";
    }): Promise<CodeAgentChatControlResult>;
}
export interface CreateCodeAgentChatAdapterOptions {
    controller: CodeAgentChatController;
    runIdRef: {
        current: string | null;
    };
    permissionModeRef?: {
        current: string | undefined;
    };
    modelRef?: {
        current: string | undefined;
    };
    engineRef?: {
        current: string | undefined;
    };
    effortRef?: {
        current: ReasoningEffort | undefined;
    };
    followUpModeRef?: {
        current: CodeAgentChatFollowUpMode | undefined;
    };
    attachOnlyRef?: {
        current: boolean;
    };
    tabId?: string;
    pollIntervalMs?: number;
    idlePollIntervalMs?: number;
    terminalIdlePolls?: number;
    /**
     * Assistant-ui may abort a run for UI lifecycle reasons, such as switching
     * selected sessions. Code sessions keep running unless the host sends an
     * explicit stop command.
     */
    stopOnAbort?: boolean;
}
export declare function createCodeAgentChatAdapter(options: CreateCodeAgentChatAdapterOptions): ChatModelAdapter;
export declare function codeAgentTranscriptEventsToContent(events: readonly CodeAgentChatTranscriptEvent[]): ContentPart[];
//# sourceMappingURL=code-agent-chat-adapter.d.ts.map