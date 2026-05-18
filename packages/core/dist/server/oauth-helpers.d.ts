/**
 * Check if any OAuth tokens exist for a provider, scoped to the given owner.
 * Always scopes by owner email — never returns tokens across users.
 *
 * `forEmail` is required. Calling this without an email used to fall
 * through to an unscoped `hasOAuthTokens(provider)` which leaked the fact
 * that ANY user in the deployment had connected the provider — see the
 * `hasOAuthTokens` rationale.
 */
export declare function isOAuthConnected(provider: string, forEmail: string): Promise<boolean>;
/**
 * Get OAuth accounts for a provider, scoped to the given owner.
 * Always scopes by owner email — never returns tokens across users.
 * Returns empty array when forEmail is not provided (prevents leaking all accounts).
 */
export declare function getOAuthAccounts(provider: string, forEmail?: string): Promise<Array<{
    accountId: string;
    tokens: Record<string, unknown>;
}>>;
//# sourceMappingURL=oauth-helpers.d.ts.map