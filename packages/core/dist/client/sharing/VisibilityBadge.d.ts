export interface VisibilityBadgeProps {
    visibility: "private" | "org" | "public" | null | undefined;
    size?: number;
    className?: string;
}
/**
 * Tiny visibility chip for list views. Renders a small icon + label so users
 * can spot shared/public resources at a glance.
 */
export declare function VisibilityBadge({ visibility, size, className, }: VisibilityBadgeProps): import("react/jsx-runtime").JSX.Element;
//# sourceMappingURL=VisibilityBadge.d.ts.map