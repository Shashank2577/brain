export interface ThreadDebugSource {
    id: string;
    label: string;
    kind: "current" | "env" | "configured";
    current: boolean;
    connected: boolean;
    databaseUrlEnv: string | null;
    databaseAuthTokenEnv: string | null;
    canInspectAll: boolean;
}
interface DebugAccess {
    viewerEmail: string;
    orgId: string | null;
    role: string | null;
    envAdmin: boolean;
    canInspectAll: boolean;
    memberEmails: string[];
}
export declare function listThreadDebugSources(): Promise<{
    access: Omit<DebugAccess, "memberEmails" | "envAdmin"> & {
        envAdmin: boolean;
        memberCount: number;
    };
    sources: ThreadDebugSource[];
}>;
export declare function searchAgentThreads(input: {
    sourceId?: string;
    query?: string;
    ownerEmail?: string;
    limit?: number;
}): Promise<{
    source: {
        id: string;
        label: string;
        kind: "current" | "env" | "configured";
        databaseUrlEnv: string;
    };
    access: {
        viewerEmail: string;
        scope: string;
        canInspectAll: boolean;
    };
    query: string;
    count: number;
    threads: {
        id: string;
        ownerEmail: string;
        title: string;
        preview: string;
        messageCount: number;
        createdAt: number;
        updatedAt: number;
        snippet: string;
    }[];
}>;
export declare function getAgentThreadDebug(input: {
    sourceId?: string;
    threadId: string;
    ownerEmail?: string;
    maxRuns?: number;
    maxEvents?: number;
    maxTraceSpans?: number;
}): Promise<{
    source: {
        id: string;
        label: string;
        kind: "current" | "env" | "configured";
        databaseUrlEnv: string;
    };
    access: {
        viewerEmail: string;
        scope: string;
        canInspectAll: boolean;
    };
    thread: {
        id: string;
        ownerEmail: string;
        title: string;
        preview: string;
        messageCount: number;
        createdAt: number;
        updatedAt: number;
    };
    messages: any;
    debug: any;
    debugRuns: any;
    queuedMessages: any;
    threadData: Record<string, unknown>;
    rawThreadData: string;
    runs: any[];
    traces: {
        summaries: Record<string, unknown>[];
        spans: Record<string, unknown>[];
    };
    feedback: Record<string, unknown>[];
    satisfaction: Record<string, unknown>[];
    evals: Record<string, unknown>[];
    checkpoints: Record<string, unknown>[];
}>;
export {};
//# sourceMappingURL=thread-debug-store.d.ts.map