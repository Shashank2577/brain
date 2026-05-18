/**
 * Onboarding integration for the secrets registry.
 *
 * When a secret is registered with `required: true`, we inject an onboarding
 * step so the sidebar checklist nudges the user to configure it. The step's
 * completion resolver consults the live status — either by checking for an
 * env var, by looking at oauth-tokens, or by reading `app_secrets`.
 */
import type { RegisteredSecret } from "./register.js";
/**
 * If the secret is marked `required`, register a matching onboarding step.
 * Called by `registerRequiredSecret()`. No-op for non-required secrets.
 *
 * Step `order` sits at 60 by default so framework steps (10/20/30/40) stay
 * at the top; the caller can bump this by re-registering the step.
 */
export declare function maybeRegisterSecretOnboardingStep(secret: RegisteredSecret): void;
//# sourceMappingURL=onboarding.d.ts.map