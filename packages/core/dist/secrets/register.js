/**
 * In-process registry of required / optional secrets.
 *
 * Templates call `registerRequiredSecret()` at module load time — typically
 * from a server plugin. The secrets HTTP routes and the sidebar settings UI
 * read from this registry on every request so overrides and late-registered
 * secrets are picked up without a restart.
 */
// Pin the registry to globalThis so templates that load `@agent-native/core`
// via more than one ESM graph (e.g. dev-mode Vite + Nitro, symlinked
// node_modules, dist/ vs src/) share a single registry. Without this, a
// template's `register-secrets.ts` side-effect module may populate one
// registry instance while the /_agent-native/secrets route reads from
// another — net effect: the UI sees an empty list.
const REGISTRY_KEY = Symbol.for("@agent-native/core/secrets.registry");
const registry = (globalThis[REGISTRY_KEY] ??= new Map());
/**
 * Register (or override) a required secret.
 *
 * Subsequent registrations with the same `key` replace the previous
 * definition — later plugins can override framework defaults.
 */
export function registerRequiredSecret(secret) {
    if (!secret || typeof secret.key !== "string" || !secret.key) {
        throw new Error("registerRequiredSecret: secret.key is required");
    }
    if (secret.scope !== "user" &&
        secret.scope !== "workspace" &&
        secret.scope !== "org") {
        throw new Error(`registerRequiredSecret: secret.scope must be "user", "workspace", or "org" (got "${secret.scope}")`);
    }
    if (secret.kind !== "api-key" && secret.kind !== "oauth") {
        throw new Error(`registerRequiredSecret: secret.kind must be "api-key" or "oauth" (got "${secret.kind}")`);
    }
    if (registry.has(secret.key) && process.env.DEBUG) {
        console.log(`[agent-native] Overriding registered secret "${secret.key}" with new registration.`);
    }
    registry.set(secret.key, secret);
    // Auto-inject an onboarding step for required secrets. Done via dynamic
    // import to avoid a load-order cycle between register and the onboarding
    // registry during module bootstrap.
    if (secret.required) {
        // Lazy import — resolved synchronously in practice because the module is
        // already loaded once any route handler runs, but tolerate async.
        import("./onboarding.js")
            .then((mod) => mod.maybeRegisterSecretOnboardingStep(secret))
            .catch(() => {
            // Onboarding is optional — never let it block registration.
        });
    }
}
/** Return all registered secrets in registration order. */
export function listRequiredSecrets() {
    return Array.from(registry.values());
}
/** Look up a single registered secret by key. */
export function getRequiredSecret(key) {
    return registry.get(key);
}
/** Test helper — clears the registry between runs. */
export function __resetSecretsRegistry() {
    registry.clear();
}
//# sourceMappingURL=register.js.map