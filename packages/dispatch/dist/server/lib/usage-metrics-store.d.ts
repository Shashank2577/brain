import { type UsageBillingMode } from "@agent-native/core/usage";
import { type WorkspaceAppSummary } from "./app-creation-store.js";
export interface UsageMetricBucket {
    key: string;
    label: string;
    costCents: number;
    calls: number;
    chatCalls: number;
    inputTokens: number;
    outputTokens: number;
    cacheReadTokens: number;
    cacheWriteTokens: number;
    activeUsers: number;
    lastActiveAt: number | null;
}
export interface UserUsageMetric extends UsageMetricBucket {
    ownerEmail: string;
    chatThreads: number;
    chatMessages: number;
    lastChatAt: number | null;
    topApp: string | null;
    role: string | null;
}
export interface AppAccessMetric {
    id: string;
    name: string;
    path: string;
    status: WorkspaceAppSummary["status"];
    isDispatch: boolean;
    accessModel: "workspace" | "solo";
    accessLabel: string;
    accessUsers: number;
    usersWithUsage: number;
    usageCalls: number;
    chatCalls: number;
    costCents: number;
    lastActiveAt: number | null;
}
export interface DailyUsageMetric {
    date: string;
    costCents: number;
    calls: number;
    chatCalls: number;
    activeUsers: number;
}
export interface RecentUsageMetric {
    id: number;
    createdAt: number;
    ownerEmail: string;
    app: string;
    label: string;
    model: string;
    inputTokens: number;
    outputTokens: number;
    cacheReadTokens: number;
    cacheWriteTokens: number;
    costCents: number;
}
export interface DispatchUsageMetrics {
    billing: UsageBillingMode;
    sinceMs: number;
    sinceDays: number;
    generatedAt: number;
    access: {
        viewerEmail: string;
        orgId: string | null;
        role: string | null;
        scope: "organization" | "solo";
        totalUsers: number;
    };
    totals: {
        costCents: number;
        calls: number;
        chatCalls: number;
        inputTokens: number;
        outputTokens: number;
        cacheReadTokens: number;
        cacheWriteTokens: number;
        activeUsers: number;
        chatThreads: number;
        chatMessages: number;
        workspaceApps: number;
    };
    byApp: UsageMetricBucket[];
    byUser: UserUsageMetric[];
    byLabel: UsageMetricBucket[];
    byModel: UsageMetricBucket[];
    daily: DailyUsageMetric[];
    appAccess: AppAccessMetric[];
    recent: RecentUsageMetric[];
}
export declare function listDispatchUsageMetrics(input: {
    sinceDays?: number;
}): Promise<DispatchUsageMetrics>;
//# sourceMappingURL=usage-metrics-store.d.ts.map