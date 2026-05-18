/**
 * Built-in video provider (Daily.co) — zero-OAuth video provider driven by a
 * server-to-server API key. Creates a Daily.co room per booking.
 */
import type { VideoProvider } from "./types.js";
export interface DailyVideoProviderConfig {
    apiKey: string;
    /** Prefix for Daily room names; defaults to "room-" */
    roomPrefix?: string;
}
export declare function createDailyVideoProvider(config: DailyVideoProviderConfig): VideoProvider;
//# sourceMappingURL=builtin-video.d.ts.map