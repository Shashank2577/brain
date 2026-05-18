export interface ChatThreadScope {
    type: string;
    id: string;
    label?: string;
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
export interface ChatThreadData {
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
export declare function useChatThreads(apiUrl?: string, storageKey?: string, scope?: ChatThreadScope | null): {
    threads: ChatThreadSummary[];
    activeThreadId: string;
    isLoading: boolean;
    createThread: (preferredId?: string) => Promise<string | null>;
    switchThread: (id: string) => void;
    deleteThread: (id: string) => Promise<void>;
    detachThread: (threadId: string) => Promise<void>;
    forkThread: (sourceId: string) => Promise<string | null>;
    saveThreadData: (id: string, data: {
        threadData: string;
        title: string;
        preview: string;
        messageCount?: number;
    }) => Promise<void>;
    generateTitle: (threadId: string, message: string) => Promise<string | null>;
    searchThreads: (query: string) => Promise<ChatThreadSummary[]>;
    refreshThreads: () => void;
    isNewThread: (id: string) => boolean;
};
//# sourceMappingURL=use-chat-threads.d.ts.map