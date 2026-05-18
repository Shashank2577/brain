/**
 * Polling-based change notification.
 *
 * Replaces SSE with a simple version counter. Each DB mutation (app-state,
 * settings, resources) increments the version. Clients poll `/_agent-native/poll?since=N`
 * and receive any events that occurred after version N.
 *
 * Works in all deployment environments (serverless, edge, long-lived).
 *
 * Also detects cross-process DB writes by periodically checking the
 * application_state and settings tables' updated_at timestamps. This ensures
 * that changes made by external processes (e.g., CLI actions, cron jobs)
 * are picked up even though they don't call recordChange() in this process.
 */
import { EventEmitter } from "node:events";
export interface ChangeEvent {
    version: number;
    source: string;
    type: string;
    key?: string;
    /**
     * Owner email for tenant-scoped events. When absent, the event is treated
     * as deployment-global (e.g. table-level "something changed" pings) and
     * delivered to every authenticated poller. Specific events that should
     * only fan out to one user MUST set this — otherwise polling clients
     * across tenants see each other's signals.
     */
    owner?: string;
    /** Optional org ID for org-scoped events. */
    orgId?: string;
    [k: string]: unknown;
}
export declare const POLL_CHANGE_EVENT = "poll-change";
/** Get the current global version counter. */
export declare function getVersion(): number;
export declare function getPollEmitter(): EventEmitter;
export declare function canSeeChangeForUser(event: ChangeEvent, userEmail: string, orgId: string | undefined): boolean;
/** Record a change event. Called by emitter listeners. */
export declare function recordChange(event: {
    source: string;
    type: string;
    key?: string;
    [k: string]: unknown;
}): void;
/** Get all changes after a given version. */
export declare function getChangesSince(since: number): {
    version: number;
    events: ChangeEvent[];
};
/**
 * Get changes after a given version, filtered to events the caller is
 * allowed to see.
 *
 * Filtering rules:
 *   - Events without an `owner` are deployment-global (table-level pings,
 *     screen-refresh, etc.) and visible to every authenticated user.
 *   - Events with `owner === userEmail` go to that user.
 *   - Events with `orgId === orgId` go to anyone in that org.
 *   - All other owned events are filtered out.
 */
export declare function getChangesSinceForUser(since: number, userEmail: string, orgId: string | undefined): {
    version: number;
    events: ChangeEvent[];
};
/**
 * Create an H3 handler for the poll endpoint.
 *
 * GET /_agent-native/poll?since=N → { version, events[] }
 *
 * Requires an authenticated session. Events are filtered to the caller's
 * tenant — global events (owner-less, table-level pings) reach every
 * authenticated caller; owned events reach only the matching user/org.
 * Without auth + filtering, an anonymous attacker could poll the deployment
 * and infer cross-tenant activity from the global event stream.
 */
export declare function createPollHandler(): import("h3").EventHandlerWithFetch<import("h3").EventHandlerRequest, Promise<{
    version: number;
    events: ChangeEvent[];
} | {
    error: string;
}>>;
//# sourceMappingURL=poll.d.ts.map