/**
 * Dispatch-specific onboarding steps.
 *
 * Slack/Telegram/etc. are auto-registered at order 60 by the framework when
 * their env keys are declared `required: true` in `env-config.ts`. Without
 * any earlier dispatch-specific step, a brand-new workspace lands on
 * "Connect Slack" as the first visible to-do — which is intimidating before
 * the user has even created a real app. This step nudges them at adding
 * their first workspace app first.
 */
export declare function registerDispatchOnboardingSteps(): void;
//# sourceMappingURL=onboarding-steps.d.ts.map