/**
 * Framework secrets registry.
 *
 * Lets templates declaratively register required API keys / credentials so
 * they appear in the sidebar settings UI and the onboarding checklist, and
 * so actions can read them by a stable key.
 *
 * See `.agents/skills/secrets/SKILL.md` for usage.
 */
export { registerRequiredSecret, listRequiredSecrets, getRequiredSecret, __resetSecretsRegistry, } from "./register.js";
export { writeAppSecret, readAppSecret, readAppSecretMeta, deleteAppSecret, getAppSecretMeta, listAppSecretsForScope, last4, } from "./storage.js";
export { APP_SECRETS_CREATE_SQL, appSecrets } from "./schema.js";
export { createListSecretsHandler, createWriteSecretHandler, createTestSecretHandler, createAdHocSecretHandler, } from "./routes.js";
export { resolveKeyReferences, validateUrlAllowlist, getKeyAllowlist, } from "./substitution.js";
export { maybeRegisterSecretOnboardingStep } from "./onboarding.js";
//# sourceMappingURL=index.js.map