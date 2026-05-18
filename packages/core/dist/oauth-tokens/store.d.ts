export declare function getOAuthTokens(provider: string, accountId: string): Promise<Record<string, unknown> | null>;
/**
 * Thrown when an OAuth save would re-bind an `(provider, account_id)` row
 * to a different owner than already holds it. Callers should catch this and
 * surface a clean "this account is already linked to another user" message
 * to the requester rather than letting it propagate as a 500.
 *
 * Carries `statusCode = 409` so route handlers using h3's `createError` can
 * pass it straight through.
 */
export declare class OAuthAccountOwnedByOtherUserError extends Error {
    readonly statusCode = 409;
    readonly provider: string;
    readonly accountId: string;
    readonly existingOwner: string;
    readonly attemptedOwner: string;
    constructor(opts: {
        provider: string;
        accountId: string;
        existingOwner: string;
        attemptedOwner: string;
    });
}
/**
 * Save OAuth tokens. The `owner` parameter specifies which user owns this
 * account — defaults to `accountId` (the account itself is the owner).
 * For multi-account support, pass the logged-in user's email as owner.
 *
 * If the account already exists and is owned by a different user, throws
 * `OAuthAccountOwnedByOtherUserError` (statusCode 409) to prevent silently
 * stealing another user's linked account.
 *
 * Read + write happen as a single linearised batch (Postgres) or paired
 * statements (SQLite). On both backends the per-row PK serialises concurrent
 * writes for the same `(provider, account_id)` so the owner check cannot be
 * raced by an attacker calling saveOAuthTokens twice in flight — the second
 * caller sees the first caller's owner row and raises 409.
 */
export declare function saveOAuthTokens(provider: string, accountId: string, tokens: Record<string, unknown>, owner?: string): Promise<void>;
export declare function deleteOAuthTokens(provider: string, accountId?: string): Promise<number>;
export declare function listOAuthAccounts(provider: string): Promise<Array<{
    accountId: string;
    owner: string | null;
    tokens: Record<string, unknown>;
}>>;
/**
 * List all OAuth accounts owned by a specific user.
 * In multi-account mode, a user may have connected multiple Google accounts.
 */
export declare function listOAuthAccountsByOwner(provider: string, owner: string): Promise<Array<{
    accountId: string;
    displayName: string | null;
    tokens: Record<string, unknown>;
}>>;
/**
 * Set the display name for an OAuth account (e.g. Google profile name).
 */
export declare function setOAuthDisplayName(provider: string, accountId: string, displayName: string): Promise<void>;
/**
 * Check whether a specific user has tokens for a provider.
 *
 * `owner` is REQUIRED. The previous unscoped form leaked information
 * across users — the onboarding banner would mark the OAuth secret as
 * "set" for user B as soon as ANY user in the deployment connected the
 * provider, and user B would never see the prompt to connect.
 */
export declare function hasOAuthTokens(provider: string, owner: string): Promise<boolean>;
//# sourceMappingURL=store.d.ts.map