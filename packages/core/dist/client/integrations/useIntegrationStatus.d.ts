export interface IntegrationStatus {
    platform: string;
    label: string;
    enabled: boolean;
    configured: boolean;
    details?: Record<string, unknown>;
    error?: string;
    webhookUrl?: string;
}
export declare function useIntegrationStatus(): {
    statuses: IntegrationStatus[];
    loading: boolean;
    refetch: () => Promise<void>;
};
//# sourceMappingURL=useIntegrationStatus.d.ts.map