/**
 * Single source of truth for every built-in LLM provider's env var name and
 * UI metadata. Imported by both server and client code — keep it free of
 * runtime imports so it stays tree-shakeable into the browser bundle.
 *
 * Add a new provider here when adding it to builtin.ts; all three UI gates
 * (AssistantChat composer, settings env-var list, settings key form) pick
 * it up automatically.
 */
export interface ProviderEnvMeta {
    envVar: string;
    /** Shown next to the env var in the settings "framework env keys" list */
    label: string;
    /** Input placeholder hint shown in the LLM picker's key field */
    placeholder: string;
}
export declare const PROVIDER_ENV_META: Record<string, ProviderEnvMeta>;
export declare const PROVIDER_TO_ENV: Record<string, string>;
export declare const PROVIDER_ENV_VARS: readonly string[];
export declare const PROVIDER_ENV_PLACEHOLDERS: Record<string, string>;
//# sourceMappingURL=provider-env-vars.d.ts.map