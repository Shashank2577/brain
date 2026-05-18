export interface CredentialContext {
    userEmail: string;
    orgId?: string | null;
}
export type CredentialStorageScope = "user" | "org";
/**
 * Resolve a credential from one explicit legacy SQL credential scope.
 *
 * Prefer `resolveCredential()` for normal app-local credential lookup. This
 * helper exists for workspace connection refs, where a ref can explicitly say
 * "use the org-scoped key" and must not accidentally read a user override.
 */
export declare function resolveCredentialForScope(key: string, ctx: CredentialContext & {
    scope: CredentialStorageScope;
}): Promise<string | undefined>;
/**
 * Resolve a credential, scoped to the caller's user (and falling back to
 * the active org's shared credential, if any).
 *
 * SECURITY: NEVER reads from process.env. Env vars are global to the
 * deployment and would leak across users in a multi-tenant app. The only
 * sources are per-user / per-org rows in the SQL `settings` table.
 *
 * Storage keys (priority order):
 *   1. u:<email>:credential:<KEY>   — per-user override
 *   2. o:<orgId>:credential:<KEY>   — per-org shared credential (if orgId given)
 */
export declare function resolveCredential(key: string, ctx: CredentialContext): Promise<string | undefined>;
/**
 * Check if a credential is available for the given context.
 */
export declare function hasCredential(key: string, ctx: CredentialContext): Promise<boolean>;
/**
 * Save a credential. By default writes to the per-user store; pass
 * `scope: "org"` to write to the active org's shared credentials.
 */
export declare function saveCredential(key: string, value: string, ctx: CredentialContext & {
    scope?: "user" | "org";
}): Promise<void>;
/**
 * Delete a credential from the per-user (default) or per-org store.
 */
export declare function deleteCredential(key: string, ctx: CredentialContext & {
    scope?: "user" | "org";
}): Promise<void>;
//# sourceMappingURL=index.d.ts.map