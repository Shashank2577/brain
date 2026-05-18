/**
 * Server-side awareness state management for collaborative editing.
 *
 * Stores per-client awareness state (cursor positions, user info) in memory.
 * Clients POST their state and receive other clients' states via polling.
 * States expire after 30 seconds of no updates.
 */
export interface AwarenessEntry {
    clientId: number;
    state: string;
    lastSeen: number;
}
export declare function getDocAwareness(docId: string): Map<number, AwarenessEntry>;
export declare function cleanExpired(map: Map<number, AwarenessEntry>): void;
/**
 * POST /_agent-native/collab/:docId/awareness
 *
 * Client sends its awareness state and receives other clients' states.
 *
 * Body: { clientId: number, state: string (base64) }
 * Response: { states: Array<{ clientId: number, state: string }> }
 */
export declare const postAwareness: import("h3").EventHandlerWithFetch<import("h3").EventHandlerRequest, Promise<{
    error: string;
    states?: undefined;
} | {
    states: {
        clientId: number;
        state: string;
    }[];
    error?: undefined;
}>>;
/**
 * GET /_agent-native/collab/:docId/users
 *
 * Returns the list of active users for a document (for presence bar).
 */
export declare const getActiveUsers: import("h3").EventHandlerWithFetch<import("h3").EventHandlerRequest, Promise<{
    error: string;
    users?: undefined;
} | {
    users: {
        clientId: number;
        lastSeen: number;
    }[];
    error?: undefined;
}>>;
//# sourceMappingURL=awareness.d.ts.map