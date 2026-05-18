/**
 * Google Calendar provider.
 *
 * Thin adapter over the Google Calendar API. Consumers wire it up by
 * calling `createGoogleCalendarProvider()` with accessors that return
 * OAuth tokens from their preferred store (typically core's oauth_tokens).
 *
 * This lives in the package rather than the template because the logic is
 * the same for every scheduling consumer. Custom token stores are supported
 * via the `getAccessToken` callback.
 */
import type { CalendarProvider } from "./types.js";
export interface GoogleCalendarProviderConfig {
    clientId: string;
    clientSecret: string;
    /** Resolve a fresh access token for a given credentialId (refresh if needed). */
    getAccessToken: (credentialId: string) => Promise<string>;
    /** Persist updated refresh/access tokens after a refresh. */
    updateTokens?: (credentialId: string, tokens: {
        accessToken: string;
        refreshToken?: string;
        expiresAt?: Date;
    }) => Promise<void>;
    /** Called when the API returns 401/403; the consumer should mark the credential invalid. */
    markInvalid?: (credentialId: string) => Promise<void>;
}
export declare function createGoogleCalendarProvider(config: GoogleCalendarProviderConfig): CalendarProvider;
//# sourceMappingURL=google-calendar.d.ts.map