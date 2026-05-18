/**
 * Office 365 / Outlook calendar provider via Microsoft Graph.
 *
 * Token flow is identical to Google but against login.microsoftonline.com.
 * Uses Microsoft Graph API for calendars and events.
 */
import type { CalendarProvider } from "./types.js";
export interface Office365ProviderConfig {
    clientId: string;
    clientSecret: string;
    tenant?: string;
    getAccessToken: (credentialId: string) => Promise<string>;
    updateTokens?: (credentialId: string, tokens: {
        accessToken: string;
        refreshToken?: string;
        expiresAt?: Date;
    }) => Promise<void>;
    markInvalid?: (credentialId: string) => Promise<void>;
}
export declare function createOffice365Provider(config: Office365ProviderConfig): CalendarProvider;
//# sourceMappingURL=office365.d.ts.map