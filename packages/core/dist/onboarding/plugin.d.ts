/**
 * Onboarding plugin — auto-mounts the `/_agent-native/onboarding/*` routes.
 *
 * Routes:
 *   GET  /_agent-native/onboarding/steps              — list steps + completion
 *   POST /_agent-native/onboarding/steps/:id/complete — manual override (marks complete)
 *   POST /_agent-native/onboarding/dismiss            — dismiss the banner
 *   GET  /_agent-native/onboarding/dismissed          — dismissed flag + allComplete
 */
type NitroPluginDef = (nitroApp: any) => void | Promise<void>;
export interface OnboardingPluginOptions {
    /** Skip registering the built-in default steps (llm, database, auth). */
    skipDefaultSteps?: boolean;
}
export declare function createOnboardingPlugin(options?: OnboardingPluginOptions): NitroPluginDef;
/** Default plugin instance — mounted automatically when a template doesn't override. */
export declare const defaultOnboardingPlugin: NitroPluginDef;
export {};
//# sourceMappingURL=plugin.d.ts.map