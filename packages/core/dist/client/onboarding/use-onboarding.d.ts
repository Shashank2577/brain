import type { OnboardingMethod, OnboardingStepStatus } from "../../onboarding/types.js";
export interface UseOnboardingResult {
    steps: OnboardingStepStatus[];
    loading: boolean;
    error: string | null;
    /** Active step = first required+incomplete, else first incomplete. */
    currentStepId: string | null;
    completeCount: number;
    totalCount: number;
    /** True when every required step is complete. */
    allComplete: boolean;
    /** User dismissed the banner via the X button. */
    dismissed: boolean;
    /** Refetch steps immediately. */
    refresh: () => Promise<void>;
    /** Mark a step complete via the server-side override. */
    complete: (id: string) => Promise<void>;
    /** Dismiss the banner permanently (until server-side reset). */
    dismiss: () => Promise<void>;
    /** Re-open the panel after dismissal. */
    reopen: () => Promise<void>;
}
export declare function useOnboarding(options?: {
    preview?: boolean;
}): UseOnboardingResult;
/** Re-export type for convenience. */
export type { OnboardingMethod, OnboardingStepStatus };
//# sourceMappingURL=use-onboarding.d.ts.map