import { type H3Event } from "h3";
export interface MissingKeyResponse {
    error: "missing_api_key";
    key: string;
    label: string;
    message: string;
    settingsPath: string;
}
/**
 * Check if an env var is set. If not, set response status and return a structured
 * missing_api_key response object. Returns null if the key exists (no action needed).
 *
 * Usage:
 *   const missing = requireEnvKey(event, 'MY_KEY', 'My Service');
 *   if (missing) return missing;
 */
export declare function requireEnvKey(event: H3Event, key: string, label: string, options?: {
    message?: string;
    settingsPath?: string;
}): MissingKeyResponse | null;
//# sourceMappingURL=missing-key.d.ts.map