interface NotificationsBellProps {
    /** Poll interval in ms. Set to 0 to disable polling. Default: 10000. */
    pollMs?: number;
    /** Optional className for the outer container. */
    className?: string;
    /**
     * When true, fires a system-level `new Notification(...)` popup for each
     * new unread notification — handy when the tab is in the background.
     * Renders an "Enable browser notifications" prompt in the dropdown until
     * the user grants permission. Silently no-ops on denied or unsupported.
     */
    browserNotifications?: boolean;
    /** Empty-state title shown when there are no notifications. */
    emptyTitle?: string;
    /** Optional empty-state detail text. */
    emptyDescription?: string;
}
/**
 * Header-bar bell that shows the unread-notification count and a dropdown of
 * recent entries. Polling keeps it in sync (the framework poll loop already
 * bumps a version counter so notifications ride on that signal, but we poll
 * the count endpoint directly so the bell updates even outside an app-state
 * change).
 */
export declare function NotificationsBell({ pollMs, className, browserNotifications, emptyTitle, emptyDescription, }: NotificationsBellProps): import("react/jsx-runtime").JSX.Element;
export {};
//# sourceMappingURL=NotificationsBell.d.ts.map