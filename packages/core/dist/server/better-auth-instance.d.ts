/**
 * Internal Better Auth instance — lazily created, not exported to templates.
 *
 * Templates interact with auth via the existing `getSession()`, `autoMountAuth()`,
 * `createAuthPlugin()`, and `createGoogleAuthPlugin()` APIs. Better Auth is an
 * implementation detail behind those interfaces.
 */
import { type BetterAuthOptions } from "better-auth";
export declare function shouldSkipEmailVerification(): boolean;
/** Read-only accessor for the resolved auth secret. */
export declare function getAuthSecret(): string;
/** The shape we need from a Better Auth instance (internal — not exported to templates). */
export interface BetterAuthInstance {
    handler: (request: Request) => Promise<Response>;
    api: {
        getSession: (opts: {
            headers: Headers;
        }) => Promise<{
            user: {
                id: string;
                email: string;
                name: string;
            };
            session: {
                id: string;
                token: string;
                expiresAt: Date;
            };
        } | null>;
        signInEmail: (opts: {
            body: {
                email: string;
                password: string;
            };
        }) => Promise<{
            token?: string;
            user?: any;
        } | null>;
        signUpEmail: (opts: {
            body: {
                email: string;
                password: string;
                name: string;
                callbackURL?: string;
            };
        }) => Promise<any>;
        signOut: (opts: {
            headers: Headers;
        }) => Promise<any>;
    };
}
export interface BetterAuthConfig {
    /** Base path for Better Auth routes. Default: "/_agent-native/auth/ba" */
    basePath?: string;
    /** Additional social providers beyond what env vars auto-detect */
    socialProviders?: BetterAuthOptions["socialProviders"];
    /** Additional Better Auth plugins */
    plugins?: BetterAuthOptions["plugins"];
    /**
     * Additional Google OAuth scopes (Gmail, Calendar, etc.) to request
     * up front during the primary "Sign in with Google" flow, beyond the
     * default identity scopes (`openid`, `email`, `profile`).
     *
     * When set, the Google social provider also opts into:
     * - `accessType: "offline"` — so a refresh token is issued
     * - `prompt: "consent"` — so the refresh token is reissued every sign-in
     *
     * Tokens are mirrored into `oauth_tokens` via a databaseHooks.account
     * hook so existing template code that reads from `oauth_tokens` (mail's
     * Gmail client, calendar's events fetcher) works without any separate
     * "Connect Google" page.
     */
    googleScopes?: string[];
}
/**
 * Get or create the Better Auth instance.
 * Lazily initialized on first call — the database must be reachable by then.
 */
export declare function getBetterAuth(config?: BetterAuthConfig): Promise<BetterAuthInstance>;
/**
 * Synchronous getter — returns the instance if already initialized, else undefined.
 * Use this in hot paths where you know init has already happened.
 */
export declare function getBetterAuthSync(): BetterAuthInstance | undefined;
/**
 * The subset of Better Auth's internal adapter we use for federated-SSO
 * JIT account linking. Better Auth owns these writes (id + timestamp +
 * schema handling), so callers never hand-roll SQL against `user`/`account`.
 * Read-only lookups + strictly-additive `linkAccount`/`createUser` only — no
 * update/delete of existing identity rows.
 */
export interface BetterAuthInternalAdapter {
    findUserByEmail: (email: string, options?: {
        includeAccounts: boolean;
    }) => Promise<{
        user: {
            id: string;
            email: string;
            name?: string;
        };
        accounts: Array<{
            providerId: string;
            accountId: string;
        }>;
    } | null>;
    linkAccount: (account: {
        userId: string;
        providerId: string;
        accountId: string;
    }) => Promise<unknown>;
    createUser: (user: {
        email: string;
        name: string;
        emailVerified?: boolean;
    }) => Promise<{
        id: string;
    }>;
}
/**
 * Resolve Better Auth's internal adapter via the live instance's
 * `$context`. The framework's narrowed `BetterAuthInstance` interface omits
 * `$context`, but the underlying object created by `betterAuth(...)` always
 * exposes it (see Better Auth's `Auth` type) — so this is a safe, typed
 * accessor for the federated-SSO client. Returns `undefined` if the context
 * shape is unexpected (older/newer Better Auth) so callers can fall back.
 */
export declare function getBetterAuthInternalAdapter(config?: BetterAuthConfig): Promise<BetterAuthInternalAdapter | undefined>;
/** Reset for testing */
export declare function resetBetterAuth(): Promise<void>;
//# sourceMappingURL=better-auth-instance.d.ts.map