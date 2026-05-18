/** Any object with on/off methods (compatible with EventEmitter, TypedEventEmitter, etc.). */
interface EventLike {
    on(event: string, listener: (...args: any[]) => void): any;
    off(event: string, listener: (...args: any[]) => void): any;
}
export interface SSEHandlerOptions {
    /** Additional EventEmitters to stream events from (e.g. DB change events). */
    extraEmitters?: Array<{
        emitter: EventLike;
        event: string;
    }>;
}
/**
 * Create an H3 event handler that streams Server-Sent Events.
 *
 * Streams events from DB change emitters (application state, settings).
 *
 * Usage:
 *   router.get("/_agent-native/events", createSSEHandler({ extraEmitters }));
 */
export declare function createSSEHandler(options?: SSEHandlerOptions): import("h3").EventHandlerWithFetch<import("h3").EventHandlerRequest, Promise<BodyInit>>;
export {};
//# sourceMappingURL=sse.d.ts.map