export interface CompleteVideoOAuthResult {
    credentialId: string;
    kind: string;
    externalEmail?: string;
    externalAccountId: string;
    displayName?: string;
}
/**
 * Complete a video-provider OAuth callback. Throws on any failure so the
 * caller can decide how to render the error (HTML page, JSON, redirect).
 */
export declare function completeVideoOAuth(opts: {
    kind: string;
    userEmail: string;
    code: string;
    redirectUri: string;
}): Promise<CompleteVideoOAuthResult>;
//# sourceMappingURL=video-oauth.d.ts.map