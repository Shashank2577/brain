/**
 * <OnboardingBanner /> — compact bar for the top of the agent sidebar.
 *
 * Shows "Setup: N of M complete" plus a Continue button that expands the
 * full <OnboardingPanel />. Use when you want the panel collapsed by default.
 */
interface OnboardingBannerProps {
    onContinue?: () => void;
    className?: string;
}
export declare function OnboardingBanner({ onContinue, className, }: OnboardingBannerProps): import("react/jsx-runtime").JSX.Element;
export {};
//# sourceMappingURL=OnboardingBanner.d.ts.map