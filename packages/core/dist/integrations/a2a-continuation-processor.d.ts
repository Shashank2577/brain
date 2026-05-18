import type { PlatformAdapter } from "./types.js";
export declare function dispatchA2AContinuation(continuationId: string, webhookBaseUrl?: string): Promise<void>;
export declare function processA2AContinuationById(continuationId: string, options: {
    adapters: Map<string, PlatformAdapter>;
}): Promise<void>;
export declare function processDueA2AContinuations(options: {
    adapters: Map<string, PlatformAdapter>;
    limit?: number;
}): Promise<void>;
//# sourceMappingURL=a2a-continuation-processor.d.ts.map