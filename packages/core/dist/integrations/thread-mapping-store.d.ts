export interface ThreadMapping {
    platform: string;
    externalThreadId: string;
    internalThreadId: string;
    platformContext: Record<string, unknown>;
    createdAt: number;
    updatedAt: number;
}
/**
 * Look up the internal thread ID for an external platform thread.
 */
export declare function getThreadMapping(platform: string, externalThreadId: string): Promise<ThreadMapping | null>;
/**
 * Create or update a thread mapping.
 */
export declare function saveThreadMapping(platform: string, externalThreadId: string, internalThreadId: string, platformContext?: Record<string, unknown>): Promise<void>;
/**
 * Delete a thread mapping.
 */
export declare function deleteThreadMapping(platform: string, externalThreadId: string): Promise<void>;
/**
 * List all thread mappings for a platform.
 */
export declare function listThreadMappings(platform: string): Promise<ThreadMapping[]>;
//# sourceMappingURL=thread-mapping-store.d.ts.map