import type { TrackingProvider } from "./types.js";
export declare function registerTrackingProvider(provider: TrackingProvider): void;
export declare function unregisterTrackingProvider(name: string): boolean;
export declare function listTrackingProviders(): string[];
export declare function track(name: string, properties?: Record<string, unknown>, meta?: {
    userId?: string;
}): void;
export declare function identify(userId: string, traits?: Record<string, unknown>): void;
export declare function flushTracking(): Promise<void[]>;
//# sourceMappingURL=registry.d.ts.map