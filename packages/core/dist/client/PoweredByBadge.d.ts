export interface PoweredByBadgeProps {
    position?: "bottom-right" | "bottom-left";
}
export interface OpenSourceBadgeProps {
    position?: "bottom-left" | "bottom-right";
}
/**
 * Small branding badge: "Built with [Brain logo]"
 *
 * - Fixed position in the corner
 * - Subtle, semi-transparent
 * - Links to https://github.com/Shashank2577/agent-native
 * - Respects prefers-color-scheme
 * - Can be hidden via HIDE_BRANDING=true env var (for white-label)
 */
export declare function PoweredByBadge({ position, }: PoweredByBadgeProps): import("react/jsx-runtime").JSX.Element;
/**
 * Small GitHub badge: "Open source"
 *
 * Intended to pair with PoweredByBadge on public pages.
 */
export declare function OpenSourceBadge({ position, }: OpenSourceBadgeProps): import("react/jsx-runtime").JSX.Element;
//# sourceMappingURL=PoweredByBadge.d.ts.map