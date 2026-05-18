export declare function insertCheckpoint(id: string, threadId: string, runId: string | null, commitSha: string, message: string): Promise<void>;
export declare function getCheckpointsByThread(threadId: string): Promise<Array<{
    id: string;
    threadId: string;
    runId: string | null;
    commitSha: string;
    message: string;
    createdAt: number;
}>>;
export declare function getCheckpointById(id: string): Promise<{
    id: string;
    threadId: string;
    runId: string | null;
    commitSha: string;
    message: string;
    createdAt: number;
} | null>;
export declare function getCheckpointByRunId(runId: string): Promise<{
    id: string;
    threadId: string;
    runId: string | null;
    commitSha: string;
    message: string;
    createdAt: number;
} | null>;
export declare function cleanupOldCheckpoints(olderThanMs: number): Promise<void>;
//# sourceMappingURL=store.d.ts.map