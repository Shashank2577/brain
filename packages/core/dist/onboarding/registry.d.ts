/**
 * In-process registry of onboarding steps.
 *
 * Templates (or the framework itself) call `registerOnboardingStep` at module
 * load time — typically from a server plugin. The onboarding HTTP routes read
 * from this registry on every request so overrides and late-registered steps
 * are picked up without a restart.
 */
import type { OnboardingStep } from "./types.js";
/**
 * Register (or override) an onboarding step.
 *
 * Subsequent registrations with the same `id` replace the previous definition
 * — templates can override framework defaults this way.
 */
export declare function registerOnboardingStep(step: OnboardingStep): void;
/**
 * Return all registered onboarding steps, sorted by `order` ascending.
 * Ties are broken by registration order (insertion order).
 */
export declare function listOnboardingSteps(): OnboardingStep[];
/** Test helper — clears the registry between runs. Not part of the public API. */
export declare function __resetOnboardingRegistry(): void;
//# sourceMappingURL=registry.d.ts.map