import { createApp, createRouter } from "h3";
export interface EnvKeyConfig {
    /** Environment variable name (e.g. "HUBSPOT_ACCESS_TOKEN") */
    key: string;
    /** Human-readable label (e.g. "HubSpot") */
    label: string;
    /** Whether this key is required for the app to function */
    required?: boolean;
    /** Optional UI hint shown next to the field describing where to find this value. */
    helpText?: string;
}
export interface CreateServerOptions {
    /** CORS options. Ignored (H3 handles CORS via middleware). Default: enabled. */
    cors?: Record<string, unknown> | false;
    /** JSON body parser limit. Kept for API compatibility (H3 uses readBody). */
    jsonLimit?: string;
    /** Custom ping message. Default: reads PING_MESSAGE env var, falls back to "pong" */
    pingMessage?: string;
    /** Disable the /_agent-native/ping health check. Default: false */
    disablePing?: boolean;
    /** Env key configuration for the settings UI. Enables /_agent-native/env-status and /_agent-native/env-vars routes. */
    envKeys?: EnvKeyConfig[];
}
/**
 * Upsert vars into a .env file, preserving existing structure.
 */
export declare function upsertEnvFile(envPath: string, vars: Array<{
    key: string;
    value: string;
}>): Promise<void>;
export interface CreateServerResult {
    app: ReturnType<typeof createApp>;
    router: ReturnType<typeof createRouter>;
}
/**
 * Create a pre-configured H3 app with standard agent-native setup:
 * - CORS headers via middleware
 * - /_agent-native/ping health check
 * - /_agent-native/env-status and /_agent-native/env-vars (when envKeys is provided)
 *
 * Returns { app, router } — mount routes on `router`.
 */
export declare function createServer(options?: CreateServerOptions): CreateServerResult;
//# sourceMappingURL=create-server.d.ts.map