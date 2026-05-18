export declare function withThreadDataLock<T>(threadId: string, fn: () => Promise<T>): Promise<T>;
/**
 * A resource the chat is bound to, e.g. `{ type: "deck", id: "deck-abc" }`.
 * The framework is opaque to the type string — each template chooses what
 * its primary resource is and the surface it scopes to (deck, design,
 * dashboard, etc.). `label` is a denormalized snapshot for display when
 * the resource isn't on hand at render time; the live template can
 * overwrite it via the next createThread call.
 */
export interface ChatThreadScope {
    type: string;
    id: string;
    label?: string;
}
export interface ChatThread {
    id: string;
    ownerEmail: string;
    title: string;
    preview: string;
    threadData: string;
    messageCount: number;
    createdAt: number;
    updatedAt: number;
    scope: ChatThreadScope | null;
}
export interface ChatThreadSummary {
    id: string;
    title: string;
    preview: string;
    messageCount: number;
    createdAt: number;
    updatedAt: number;
    scope: ChatThreadScope | null;
}
export declare function createThread(ownerEmail: string, opts?: {
    id?: string;
    title?: string;
    scope?: ChatThreadScope | null;
}): Promise<ChatThread>;
export declare function getThread(id: string): Promise<ChatThread | null>;
export declare function forkThread(sourceId: string, ownerEmail: string, opts?: {
    id?: string;
}): Promise<ChatThread | null>;
export interface ListThreadsOptions {
    limit?: number;
    offset?: number;
    /**
     * Filter for chats bound to a specific resource. The default (undefined)
     * returns every thread the user owns. `{ type: "deck", id: "abc" }`
     * returns only that resource's threads. `{ type: "deck", id: null }` is
     * NOT supported — pass `unscopedOnly: true` to get only general chats.
     */
    scope?: {
        type: string;
        id: string;
    };
    /** When true, returns only threads with no scope (general chats). */
    unscopedOnly?: boolean;
}
export declare function listThreads(ownerEmail: string, options?: ListThreadsOptions | number, legacyOffset?: number): Promise<ChatThreadSummary[]>;
export declare function searchThreads(ownerEmail: string, query: string, limit?: number, options?: {
    scope?: {
        type: string;
        id: string;
    };
}): Promise<ChatThreadSummary[]>;
/**
 * Detach or rebind a chat's scope. Used by the UI's "Detach from <resource>"
 * action and by templates that need to retag a chat after a rename. Pass
 * `null` to clear the scope (chat becomes general).
 */
export declare function setThreadScope(id: string, scope: ChatThreadScope | null): Promise<void>;
export interface UpdateThreadDataOptions {
    preserveExistingQueuedMessages?: boolean;
    preserveExistingTopLevelKeys?: boolean;
    maxAttempts?: number;
}
export declare function updateThreadData(id: string, threadData: string, title: string, preview: string, messageCount: number, options?: UpdateThreadDataOptions): Promise<void>;
export interface ThreadEngineMeta {
    engineName: string;
    model: string;
}
/**
 * Read the engine pinned to a thread (stored in thread_data JSON).
 * Returns null if no engine is pinned.
 */
export declare function getThreadEngineMeta(threadId: string): Promise<ThreadEngineMeta | null>;
/**
 * Pin an engine to a thread by storing engineMeta in thread_data JSON.
 * Does not change messages, title, or preview.
 */
export declare function setThreadEngineMeta(threadId: string, meta: ThreadEngineMeta): Promise<void>;
export interface QueuedMessage {
    id: string;
    text: string;
    images?: string[];
    references?: unknown[];
}
/**
 * Persist the user's queued (not-yet-sent) messages onto the thread.
 * Stored in thread_data JSON so it survives reloads without a schema
 * change. Safe to call often — the frontend debounces writes.
 */
export declare function setThreadQueuedMessages(threadId: string, queuedMessages: QueuedMessage[]): Promise<void>;
export declare function deleteThread(id: string): Promise<boolean>;
//# sourceMappingURL=store.d.ts.map