/**
 * Credential provider abstraction.
 *
 * Every feature that needs an external credential (Anthropic API key,
 * Google OAuth tokens, OpenAI key, Slack bot token, etc.) should go through
 * one of the resolve*() helpers here instead of reading `process.env`
 * directly. That way the same feature can work in three modes:
 *
 *   1. User set their own key in .env              → use it directly
 *   2. User connected Builder via `/cli-auth`      → route through Builder proxy
 *   3. Neither                                      → throw FeatureNotConfigured
 *
 * Templates catch FeatureNotConfigured and show a "Connect Builder (1 click) /
 * set up your own key (guide)" card.
 *
 * Today these helpers are used by the Builder-hosted LLM gateway, and the
 * shape is meant to grow to cover future managed credential integrations
 * (e.g. additional Builder-hosted services) without rewrites.
 */
/**
 * Decide which `app_secrets` scope a Builder/credential write should use.
 *
 * Org scope ("everyone in this org sees these credentials") wins when the
 * connecting user is an owner or admin of an active org — the write
 * privileges shared infra. A plain member or a user without an active
 * org falls through to per-user scope so a teammate can't silently
 * overwrite the org-shared connection.
 */
export declare function resolveCredentialWriteScope(email: string, orgId: string | null | undefined, role: string | null | undefined): {
    scope: "user" | "org";
    scopeId: string;
};
export declare class FeatureNotConfiguredError extends Error {
    readonly requiredCredential: string;
    readonly builderConnectUrl?: string;
    readonly byokDocsUrl?: string;
    constructor(opts: {
        requiredCredential: string;
        message?: string;
        builderConnectUrl?: string;
        byokDocsUrl?: string;
    });
}
/**
 * Deployment-level credential fallback for single-tenant/local operation.
 * Multi-tenant call sites must gate this explicitly before calling.
 */
export declare function readDeployCredentialEnv(key: string): string | undefined;
/**
 * Deployment-level credentials are safe as a runtime fallback only in local /
 * single-tenant contexts. In hosted production with a shared database, every
 * signed-in user needs their own user/org/workspace credential so one deploy
 * key does not silently power another tenant's chat.
 */
export declare function isDeployCredentialFallbackAllowed(): boolean;
export declare function canUseDeployCredentialFallbackForRequest(): boolean;
type BuilderCredentialSource = "user" | "org" | "workspace" | "env";
/**
 * Resolve a Builder credential for the current request. User/org credentials
 * win; deployment env is only a fallback. This lets local/root .env keys keep
 * a template working while still allowing users to connect their own Builder
 * account from Settings or onboarding.
 */
export declare function resolveBuilderCredential(key: string): Promise<string | null>;
/**
 * True when `BUILDER_PRIVATE_KEY` is set at the deployment level. This means
 * a deploy-level fallback exists; it does not prevent per-user connect.
 */
export declare function isBuilderEnvManaged(): boolean;
/**
 * Resolve the Builder private key for the current request. User/org OAuth
 * credentials win; deploy-level `BUILDER_PRIVATE_KEY` is the fallback.
 */
export declare function resolveBuilderPrivateKey(): Promise<string | null>;
/**
 * Resolve the current user's Builder auth header.
 * Returns `"Bearer <key>"` or null.
 */
export declare function resolveBuilderAuthHeader(): Promise<string | null>;
/**
 * Check whether the current user has a Builder private key configured
 * (per-user or deployment-level).
 */
export declare function resolveHasBuilderPrivateKey(): Promise<boolean>;
/**
 * Resolve where the effective Builder private key came from. Used by status
 * UIs so they can distinguish a deploy fallback from a user/org connection.
 */
export declare function resolveBuilderCredentialSource(): Promise<BuilderCredentialSource | null>;
/**
 * Resolve all per-user Builder credentials. Used by the status endpoint
 * and agent-chat-plugin to get orgName, userId, etc.
 */
export declare function resolveBuilderCredentials(): Promise<{
    privateKey: string | null;
    publicKey: string | null;
    userId: string | null;
    orgName: string | null;
    orgKind: string | null;
}>;
/**
 * Write Builder credentials to `app_secrets`.
 *
 * Scope decision (see `resolveCredentialWriteScope`): when the connecting
 * user is owner/admin of an active org we write at `scope: "org"` so every
 * member of that org auto-resolves the credentials via
 * `resolveBuilderCredential`'s org fallback — no per-user re-connect
 * needed. A plain member or a user with no active org writes at
 * `scope: "user"` (the safe default that doesn't trample the org's shared
 * connection).
 *
 * Stale-credential cleanup: before writing the new values we (1) clear ALL
 * five BUILDER_* keys at the target scope, so optional fields the new
 * connection doesn't carry (e.g. user picked a Builder space that returns
 * no orgName) don't leave the previous connection's metadata behind, and
 * (2) when writing at org scope, also clear the writer's own user-scope
 * BUILDER_* rows so a stale personal override from an earlier connect
 * doesn't shadow the new org write on resolution (user scope wins org
 * scope by design — see `resolveScopedBuilderCredential`). The org-scope
 * row is intentionally left alone when writing at user scope: that row is
 * shared with the rest of the org and a single user's personal override
 * shouldn't blow it away. (Victoria's "I signed in again with my Builder
 * space and it still says no credits" report on 2026-05-11 was exactly
 * this stale-shadow case.)
 *
 * Returns the actual scope/scopeId used so the caller can show "Connected
 * for Builder.io" vs "Connected (personal)" in the UI.
 */
export declare function writeBuilderCredentials(email: string, creds: {
    privateKey: string;
    publicKey: string;
    userId?: string | null;
    orgName?: string | null;
    orgKind?: string | null;
}, options?: {
    orgId?: string | null;
    role?: string | null;
}): Promise<{
    scope: "user" | "org";
    scopeId: string;
}>;
/**
 * Delete Builder credentials.
 *
 * Default behaviour: clears only this user's per-user override (so a
 * member can disconnect their personal Builder identity without
 * collapsing the org-wide connection for every teammate). To revoke the
 * org's shared connection, pass `{ orgId, role }` for an owner/admin —
 * matching the same authority gate `writeBuilderCredentials` uses on
 * write. Plain members can never reach the org-scoped row.
 */
export declare function deleteBuilderCredentials(email: string, options?: {
    orgId?: string | null;
    role?: string | null;
}): Promise<{
    scope: "user" | "org";
    scopeId: string;
}>;
/**
 * Resolve a request-scoped secret. Reads from `app_secrets` first (current
 * user override, active org, then workspace row); falls back to `process.env`
 * only when the deploy fallback policy allows it.
 */
export declare function resolveSecret(key: string): Promise<string | null>;
/**
 * True when a Builder private key is configured at the deployment level.
 *
 * This is the same env-only check as `isBuilderEnvManaged()`. For "does this
 * request have access to Builder via user/org/env credentials?" use the async
 * `resolveHasBuilderPrivateKey()`.
 */
export declare function hasBuilderPrivateKey(): boolean;
/** The origin for Builder-proxied API calls. Overridable for testing. */
export declare function getBuilderProxyOrigin(): string;
/**
 * Base URL for the public Builder LLM gateway (distinct from the internal
 * proxy origin above — the public gateway lives at
 * api.builder.io/agent-native/gateway, while the internal origin is
 * ai-services.builder.io).
 * Override via BUILDER_GATEWAY_BASE_URL for staging / testing.
 */
export declare function getBuilderGatewayBaseUrl(): string;
/**
 * Base URL for Builder-managed image generation.
 * Override via BUILDER_IMAGE_GENERATION_BASE_URL for staging / testing.
 */
export declare function getBuilderImageGenerationBaseUrl(): string;
/** Authorization header value for Builder-proxied calls (env-only). */
export declare function getBuilderAuthHeader(): string | null;
export {};
//# sourceMappingURL=credential-provider.d.ts.map