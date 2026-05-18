export interface IntegrationConfig {
    platform: string;
    configKey: string;
    configData: Record<string, unknown>;
    owner: string | null;
    updatedAt: number;
}
/**
 * Get the config for a platform integration.
 */
export declare function getIntegrationConfig(platform: string, configKey?: string): Promise<IntegrationConfig | null>;
/**
 * Save or update a platform integration config.
 */
export declare function saveIntegrationConfig(platform: string, configData: Record<string, unknown>, configKey?: string, owner?: string): Promise<void>;
/**
 * Delete a platform integration config.
 */
export declare function deleteIntegrationConfig(platform: string, configKey?: string): Promise<void>;
/**
 * List all configs for a platform.
 */
export declare function listIntegrationConfigs(platform?: string): Promise<IntegrationConfig[]>;
//# sourceMappingURL=config-store.d.ts.map