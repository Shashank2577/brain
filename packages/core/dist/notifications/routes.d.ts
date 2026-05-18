/**
 * H3 event handlers for the notifications inbox.
 *
 * Mounted under `/_agent-native/notifications/*` by `core-routes-plugin`.
 *
 *   GET  /_agent-native/notifications?unread=true&limit=50&before=ISO
 *                                                   — list for the session owner
 *   GET  /_agent-native/notifications/count         — unread count
 *   POST /_agent-native/notifications/:id/read      — mark as read
 *   POST /_agent-native/notifications/read-all      — mark all read
 *   DELETE /_agent-native/notifications/:id         — delete
 */
export declare function createNotificationsHandler(): import("h3").EventHandlerWithFetch<import("h3").EventHandlerRequest, Promise<"" | import("./types.js").Notification[] | {
    count: number;
    updated?: undefined;
    error?: undefined;
    ok?: undefined;
} | {
    updated: number;
    count?: undefined;
    error?: undefined;
    ok?: undefined;
} | {
    error: string;
    count?: undefined;
    updated?: undefined;
    ok?: undefined;
} | {
    ok: boolean;
    count?: undefined;
    updated?: undefined;
    error?: undefined;
}>>;
//# sourceMappingURL=routes.d.ts.map