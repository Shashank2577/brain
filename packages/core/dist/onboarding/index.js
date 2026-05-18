/**
 * Framework-level onboarding system.
 *
 * Templates register steps the agent sidebar should show as a setup checklist.
 * The server auto-mounts `/_agent-native/onboarding/*` routes and the client
 * hook polls them — see `@agent-native/core/client/onboarding`.
 */
export { registerOnboardingStep, listOnboardingSteps } from "./registry.js";
export { createOnboardingPlugin, defaultOnboardingPlugin, } from "./plugin.js";
export { registerDefaultOnboardingSteps } from "./default-steps.js";
//# sourceMappingURL=index.js.map