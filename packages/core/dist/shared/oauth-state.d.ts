/**
 * Extract the workspace app id from an agent-native OAuth state parameter
 * without verifying the HMAC signature.
 *
 * This is only for routing a provider callback to the app that will verify
 * and consume the state. The destination callback must still call
 * decodeOAuthState before trusting anything inside the payload.
 */
export declare function extractOAuthStateAppId(state: string | null | undefined): string | undefined;
//# sourceMappingURL=oauth-state.d.ts.map