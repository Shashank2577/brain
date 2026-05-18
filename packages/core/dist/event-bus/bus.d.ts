/**
 * Typed pub/sub bus for framework events.
 *
 * Wraps Node's EventEmitter with payload validation against the registered
 * Standard Schema for each event. Handler errors are caught and logged so a
 * misbehaving subscriber can never crash the emitter.
 */
import type { EventMeta } from "./types.js";
type Handler = (payload: unknown, meta: EventMeta) => void | Promise<void>;
export declare function subscribe(event: string, handler: Handler): string;
export declare function unsubscribe(id: string): boolean;
export declare function emit(event: string, payload: unknown, meta?: Partial<EventMeta>): void;
export declare function listSubscriptions(event?: string): {
    id: string;
    event: string;
}[];
/** Test helper — drops all subscriptions. */
export declare function __resetEventBus(): void;
export {};
//# sourceMappingURL=bus.d.ts.map