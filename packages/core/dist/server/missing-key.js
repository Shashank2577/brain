import { setResponseStatus } from "h3";
/**
 * Check if an env var is set. If not, set response status and return a structured
 * missing_api_key response object. Returns null if the key exists (no action needed).
 *
 * Usage:
 *   const missing = requireEnvKey(event, 'MY_KEY', 'My Service');
 *   if (missing) return missing;
 */
export function requireEnvKey(event, key, label, options) {
    if (process.env[key])
        return null;
    setResponseStatus(event, 200);
    return {
        error: "missing_api_key",
        key,
        label,
        message: options?.message ?? `Connect your ${label} account to see this data`,
        settingsPath: options?.settingsPath ?? "/settings",
    };
}
//# sourceMappingURL=missing-key.js.map