interface RunsTrayProps {
    /** Poll interval in ms. 0 disables. Default 3000. */
    pollMs?: number;
    /** Max runs to show in the dropdown. Default 5. */
    limit?: number;
    /** Hide the trigger entirely when no active runs. Default true. */
    hideWhenIdle?: boolean;
    className?: string;
}
/**
 * Header-bar progress indicator. Shows a spinner icon with a count badge
 * when runs are active; opens a dropdown with live progress bars for each.
 * Same inline-header pattern as <NotificationsBell /> — drop it into the
 * header, no floating overlay over the main content.
 */
export declare function RunsTray({ pollMs, limit, hideWhenIdle, className, }: RunsTrayProps): import("react/jsx-runtime").JSX.Element;
export {};
//# sourceMappingURL=RunsTray.d.ts.map