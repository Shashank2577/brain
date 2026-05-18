export interface LlmConnectionStatus {
    configured?: boolean;
    engine?: string | null;
    model?: string | null;
    source?: string | null;
    envVar?: string | null;
}
export declare function normalizeLlmConnection(engine: string | null | undefined): string;
export declare function llmConnectionTrackingProperties(status: LlmConnectionStatus | null | undefined): Record<string, unknown>;
//# sourceMappingURL=llm-connection.d.ts.map