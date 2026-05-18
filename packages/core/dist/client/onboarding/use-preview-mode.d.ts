/**
 * `useOnboardingPreviewMode` — toggle that the dev overlay flips to preview the
 * new-user onboarding flow without touching real setup state.
 *
 * Storage key matches the dev-overlay option id `framework-onboarding/show-as-new-user`
 * so toggling the option in the overlay automatically activates preview mode here.
 */
export declare const ONBOARDING_PREVIEW_STORAGE_KEY = "agent-native-dev-overlay-option-framework-onboarding-show-as-new-user";
export declare function useOnboardingPreviewMode(): boolean;
//# sourceMappingURL=use-preview-mode.d.ts.map