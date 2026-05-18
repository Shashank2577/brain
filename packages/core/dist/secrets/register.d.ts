/**
 * In-process registry of required / optional secrets.
 *
 * Templates call `registerRequiredSecret()` at module load time — typically
 * from a server plugin. The secrets HTTP routes and the sidebar settings UI
 * read from this registry on every request so overrides and late-registered
 * secrets are picked up without a restart.
 */
export type SecretScope = "user" | "workspace" | "org";
export type SecretKind = "api-key" | "oauth";
export interface ValidatorResult {
    ok: boolean;
    error?: string;
}
export interface SecretValidator {
    (value: string): Promise<ValidatorResult | boolean> | ValidatorResult | boolean;
}
export interface RegisteredSecret {
    /** Env var name & settings key — e.g. "OPENAI_API_KEY". */
    key: string;
    /** Human-readable label shown in the sidebar. */
    label: string;
    /** Short description shown below the label. */
    description?: string;
    /** URL where the user can obtain the key or connect the account. */
    docsUrl?: string;
    /** Whether the secret is per-user or shared across a workspace/org. */
    scope: SecretScope;
    /** UI affordance: "api-key" renders an input; "oauth" renders Connect. */
    kind: SecretKind;
    /** When true, an onboarding step is auto-injected for this secret. */
    required?: boolean;
    /**
     * Optional health check. Receives the plain-text value, returns `true` or
     * `{ ok: true }` on success. Returning `{ ok: false, error }` surfaces the
     * error to the UI. Never log the value from inside the validator.
     */
    validator?: SecretValidator;
    /**
     * For `kind: "oauth"` — the oauth-tokens provider id (e.g. "google") that
     * backs this registration. Used to surface OAuth status in the unified UI.
     */
    oauthProvider?: string;
    /**
     * For `kind: "oauth"` — URL the Connect button should point at. Typically
     * the framework's `/_agent-native/google/auth-url` or similar.
     */
    oauthConnectUrl?: string;
}
/**
 * Register (or override) a required secret.
 *
 * Subsequent registrations with the same `key` replace the previous
 * definition — later plugins can override framework defaults.
 */
export declare function registerRequiredSecret(secret: RegisteredSecret): void;
/** Return all registered secrets in registration order. */
export declare function listRequiredSecrets(): RegisteredSecret[];
/** Look up a single registered secret by key. */
export declare function getRequiredSecret(key: string): RegisteredSecret | undefined;
/** Test helper — clears the registry between runs. */
export declare function __resetSecretsRegistry(): void;
//# sourceMappingURL=register.d.ts.map