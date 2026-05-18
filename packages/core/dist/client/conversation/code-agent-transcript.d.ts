import type { AgentConversationMessage } from "./types.js";
export type CodeAgentConversationTranscriptEventType = "user" | "system" | "artifact" | "status" | "note";
/**
 * Browser/UI transcript event shape used by Code-style hosts. It accepts both
 * the local Code UI field names (`type`, `text`) and the core transcript-store
 * field names (`kind`, `message`) so hosts can pass through either shape.
 */
export interface CodeAgentConversationTranscriptEvent {
    id: string;
    runId: string;
    type?: CodeAgentConversationTranscriptEventType;
    kind?: CodeAgentConversationTranscriptEventType;
    title?: string;
    text?: string;
    message?: string;
    createdAt: string;
    artifactPath?: string;
    artifactUrl?: string;
    metadata?: Record<string, unknown>;
}
export interface NormalizeCodeAgentTranscriptOptions {
    hideCredentialMessages?: boolean;
}
export declare function normalizeCodeAgentTranscriptForConversation(events: readonly CodeAgentConversationTranscriptEvent[], options?: NormalizeCodeAgentTranscriptOptions): AgentConversationMessage[];
//# sourceMappingURL=code-agent-transcript.d.ts.map