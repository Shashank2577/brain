export interface FeedbackButtonProps {
    /**
     * "sidebar" renders a full-width row with icon + label (for app left sidebars).
     * "icon" renders a small icon-only button (for dense toolbars, e.g. the agent panel header).
     * "outlined" renders an outlined pill button with icon + label (for top-nav bars, e.g. docs).
     */
    variant?: "sidebar" | "icon" | "outlined";
    label?: string;
    url?: string;
    className?: string;
    /** Which side the popover opens on. Defaults match the variant. */
    side?: "top" | "bottom" | "left" | "right";
    align?: "start" | "center" | "end";
    /** Placeholder text for the textarea. */
    placeholder?: string;
}
export declare function FeedbackButton({ variant, label, url, className, side, align, placeholder, }: FeedbackButtonProps): import("react/jsx-runtime").JSX.Element;
//# sourceMappingURL=FeedbackButton.d.ts.map