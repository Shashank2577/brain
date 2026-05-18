import type { AgentChatAttachment, RunEvent } from "./types.js";
interface ContentPart {
    type: string;
    text?: string;
    toolCallId?: string;
    toolName?: string;
    argsText?: string;
    args?: Record<string, string>;
    result?: string;
}
interface BuildAssistantMessageOptions {
    suppressInternalContinuation?: boolean;
}
type AssistantMessage = NonNullable<ReturnType<typeof buildAssistantMessage>>;
type UserMessage = ReturnType<typeof buildUserMessage>;
/**
 * Reconstruct an assistant-ui message from raw agent run events.
 * Mirrors the client-side processEvent logic so the server can persist
 * the assistant's response even if the frontend is disconnected.
 */
export declare function buildAssistantMessage(events: RunEvent[], runId?: string, options?: BuildAssistantMessageOptions): {
    id: string;
    createdAt: Date;
    role: "assistant";
    content: ContentPart[];
    status: {
        type: "complete";
        reason: "stop";
    } | {
        type: "incomplete";
        reason: "error";
    };
    metadata: Record<string, unknown>;
} | null;
/**
 * Convert legacy/partially merged thread data into assistant-ui's exported
 * repository shape and repair parent links so `threadRuntime.import()` cannot
 * fail with "Parent message not found".
 */
export declare function normalizeThreadRepository(repo: any): any;
/**
 * Merge an incoming client-side full-thread save over the current SQL copy.
 *
 * The browser exports and PUTs the whole assistant-ui repository. If a server
 * completion save lands first, an older browser export can otherwise replace
 * `thread_data` wholesale and delete the assistant message the server just
 * reconstructed from run events. Preserve server-only messages while still
 * accepting client-only messages and metadata.
 */
export interface MergeThreadDataOptions {
    preserveExistingQueuedMessages?: boolean;
    preserveExistingTopLevelKeys?: boolean;
}
export declare function mergeThreadDataForClientSave(existingRepo: any, incomingRepo: any, options?: MergeThreadDataOptions): any;
export declare function buildUserMessage(opts: {
    text: string;
    attachments?: AgentChatAttachment[];
    runId?: string;
    createdAt?: Date;
}): {
    id: string;
    createdAt: Date;
    role: "user";
    content: ContentPart[];
    attachments?: any[];
    metadata: Record<string, unknown>;
};
export declare function upsertUserMessage(repo: any, userMsg: UserMessage): any;
/**
 * Merge the server-reconstructed assistant message into persisted
 * assistant-ui thread data.
 *
 * The browser periodically saves thread data while a run is still streaming.
 * That can leave the last assistant message non-empty but partial/pending.
 * Completion must replace that same-run partial message instead of treating
 * any assistant content as proof that the frontend already saved the final
 * turn.
 */
export declare function upsertAssistantMessage(repo: any, assistantMsg: AssistantMessage): any;
/**
 * Extract title and preview from a thread runtime export.
 * Isomorphic — works on both server and client.
 */
export declare function extractThreadMeta(repo: any): {
    title: string;
    preview: string;
};
export {};
//# sourceMappingURL=thread-data-builder.d.ts.map