/**
 * Provider registry — consumers register calendar/video/SMS providers at
 * startup. Actions look up providers by kind.
 */
import type { CalendarProvider, VideoProvider, SmsProvider } from "./types.js";
export declare function registerCalendarProvider(p: CalendarProvider): void;
export declare function registerVideoProvider(p: VideoProvider): void;
export declare function registerSmsProvider(p: SmsProvider): void;
export declare function getCalendarProvider(kind: string): CalendarProvider | undefined;
export declare function getVideoProvider(kind: string): VideoProvider | undefined;
export declare function getSmsProvider(kind: string): SmsProvider | undefined;
export declare function listCalendarProviders(): CalendarProvider[];
export declare function listVideoProviders(): VideoProvider[];
//# sourceMappingURL=registry.d.ts.map