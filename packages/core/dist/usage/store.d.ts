export declare const BUILDER_AGENT_CREDIT_MARGIN_MULTIPLIER = 1.25;
export declare const BUILDER_AGENT_CREDITS_PER_USD = 20;
export type UsageBillingUnit = "usd" | "builder-credits";
export interface UsageBillingMode {
    unit: UsageBillingUnit;
    label: string;
    shortLabel: string;
    source: "estimated-provider-cost" | "builder-agent-credits";
    hardCostMarginMultiplier?: number;
    creditsPerUsd?: number;
}
export declare const USD_USAGE_BILLING: UsageBillingMode;
export declare const BUILDER_CREDIT_USAGE_BILLING: UsageBillingMode;
export declare function usageBillingForEngine(engineName: string | null | undefined): UsageBillingMode;
export declare function builderCreditsFromCostCents(cents: number): number;
export interface UsageRecord {
    ownerEmail: string;
    inputTokens: number;
    outputTokens: number;
    cacheReadTokens?: number;
    cacheWriteTokens?: number;
    model: string;
    /** Category for this call — e.g. "chat", "automation", "job", "custom-agent". */
    label?: string;
    /** Optional template/app name (e.g. "mail"). Falls back to AGENT_APP / APP_NAME env. */
    app?: string;
}
/**
 * Calculate cost in centicents (1/100th of a cent).
 * Accepts cache tokens so callers that use prompt caching are priced
 * correctly. Non-cache-aware callers can pass 0 for the cache fields.
 */
export declare function calculateCost(inputTokens: number, outputTokens: number, model: string, cacheReadTokens?: number, cacheWriteTokens?: number): number;
/**
 * Record token usage from an LLM call.
 *
 * Accepts an object with the full set of fields. A positional overload
 * remains for backward compatibility with the older 4-arg signature.
 */
export declare function recordUsage(record: UsageRecord): Promise<void>;
export declare function recordUsage(ownerEmail: string, inputTokens: number, outputTokens: number, model: string): Promise<void>;
/** Total cost (in cents) charged against a user, across all time. */
export declare function getUserUsageCents(ownerEmail: string): Promise<number>;
export interface UsageSummaryOptions {
    ownerEmail: string;
    /** Inclusive lower bound (ms since epoch). Defaults to 30 days ago. */
    sinceMs?: number;
}
export interface UsageBucket {
    key: string;
    inputTokens: number;
    outputTokens: number;
    cacheReadTokens: number;
    cacheWriteTokens: number;
    cents: number;
    calls: number;
}
export interface DailyBucket {
    /** YYYY-MM-DD (UTC) */
    date: string;
    cents: number;
    calls: number;
}
export interface UsageRecentEntry {
    id: number;
    createdAt: number;
    label: string;
    app: string;
    model: string;
    inputTokens: number;
    outputTokens: number;
    cacheReadTokens: number;
    cacheWriteTokens: number;
    cents: number;
}
export interface UsageSummary {
    billing?: UsageBillingMode;
    totalCents: number;
    totalCalls: number;
    totalInputTokens: number;
    totalOutputTokens: number;
    totalCacheReadTokens: number;
    totalCacheWriteTokens: number;
    sinceMs: number;
    byLabel: UsageBucket[];
    byModel: UsageBucket[];
    byApp: UsageBucket[];
    byDay: DailyBucket[];
    recent: UsageRecentEntry[];
}
/**
 * Produce an aggregated spend view for the Usage admin panel.
 * Scoped to the passed owner email; the UI always passes the session user.
 */
export declare function getUsageSummary(options: UsageSummaryOptions): Promise<UsageSummary>;
//# sourceMappingURL=store.d.ts.map