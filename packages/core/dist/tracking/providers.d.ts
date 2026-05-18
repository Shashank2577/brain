/**
 * Built-in tracking providers that auto-register from env vars.
 *
 * No SDK dependencies — uses raw HTTP to keep core lightweight.
 * Set the env var and tracking starts automatically.
 *
 * POSTHOG_API_KEY + POSTHOG_HOST  → PostHog
 * MIXPANEL_TOKEN                  → Mixpanel
 * AMPLITUDE_API_KEY               → Amplitude
 * AGENT_NATIVE_ANALYTICS_PUBLIC_KEY → Agent Native Analytics
 *
 * Call `registerBuiltinProviders()` at server startup (done
 * automatically by the core-routes plugin).
 */
export declare function registerBuiltinProviders(): void;
//# sourceMappingURL=providers.d.ts.map