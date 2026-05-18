import type { Notification, NotificationSeverity } from "./types.js";
export interface InsertNotificationInput {
    owner: string;
    severity: NotificationSeverity;
    title: string;
    body?: string;
    metadata?: Record<string, unknown>;
    deliveredChannels?: string[];
}
export declare function insertNotification(input: InsertNotificationInput): Promise<Notification>;
export declare function updateDeliveredChannels(id: string, channels: string[]): Promise<void>;
export interface ListNotificationsOptions {
    /** When true, only return unread (read_at IS NULL). */
    unreadOnly?: boolean;
    /** Max rows to return. Default 50. */
    limit?: number;
    /** ISO timestamp cursor — returns rows with created_at < cursor. */
    before?: string;
}
export declare function listNotifications(owner: string, options?: ListNotificationsOptions): Promise<Notification[]>;
export declare function countUnread(owner: string): Promise<number>;
export declare function markNotificationRead(id: string, owner: string): Promise<boolean>;
export declare function markAllNotificationsRead(owner: string): Promise<number>;
export declare function deleteNotification(id: string, owner: string): Promise<boolean>;
//# sourceMappingURL=store.d.ts.map