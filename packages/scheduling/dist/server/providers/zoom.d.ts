/**
 * Zoom provider — OAuth-based; creates a Zoom meeting per booking.
 *
 * Tokens are stored via the consumer's callback (typically core's
 * oauth_tokens), keyed by credentialId. Consumers wire up
 * `getAccessToken` + `updateTokens` against their token store.
 *
 * OAuth:
 *   - Auth URL:   https://zoom.us/oauth/authorize?response_type=code&...
 *   - Token URL:  https://zoom.us/oauth/token (basic-auth client_id:secret)
 *   - Scopes:     meeting:write meeting:read (so we can create + delete)
 *   - User info:  GET https://api.zoom.us/v2/users/me (returns account_id + email)
 */
import type { VideoProvider } from "./types.js";
export interface ZoomProviderConfig {
    clientId: string;
    clientSecret: string;
    getAccessToken: (credentialId: string) => Promise<string>;
    /**
     * Persist tokens after `completeOAuth` (and any later refresh). Optional —
     * if omitted, the consumer is responsible for doing the write inside their
     * own callback handler.
     */
    updateTokens?: (credentialId: string, tokens: {
        accessToken: string;
        refreshToken?: string;
        expiresAt?: Date;
        rawResponse?: Record<string, unknown>;
    }) => Promise<void>;
    /** Called when the API returns 401/403; mark credential invalid in UI. */
    markInvalid?: (credentialId: string) => Promise<void>;
}
export declare function createZoomProvider(config: ZoomProviderConfig): VideoProvider;
//# sourceMappingURL=zoom.d.ts.map