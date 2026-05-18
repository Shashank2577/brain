import { type NotificationChannel, type NotificationInput, type NotificationMeta, type Notification } from "./types.js";
export declare function registerNotificationChannel(channel: NotificationChannel): void;
export declare function unregisterNotificationChannel(name: string): boolean;
export declare function listNotificationChannels(): string[];
export declare function notify(input: NotificationInput, meta: NotificationMeta): Promise<Notification | undefined>;
/** Test helper — drops all registered channels. */
export declare function __resetNotificationChannels(): void;
export { listNotifications, markNotificationRead, markAllNotificationsRead, deleteNotification, countUnread, } from "./store.js";
//# sourceMappingURL=registry.d.ts.map