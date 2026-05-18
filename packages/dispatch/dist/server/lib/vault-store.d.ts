import { type SecretScope } from "@agent-native/core/secrets";
import { schema } from "../../db/index.js";
export type VaultAccessMode = "all-apps" | "manual";
export interface VaultAccessSettings {
    mode: VaultAccessMode;
    scope: "org" | "user";
    scopeId: string;
}
/**
 * Caller-supplied access context for vault operations.
 *
 * Every getSecret / updateSecret / deleteSecret / createGrant call must
 * pass the ctx of the *current request* so the row is scoped to that
 * caller's tenant. Looking up a vault secret by id alone is unsafe — UUIDs
 * are not authorization. A row matches the ctx if either the caller owns
 * it or it lives in the caller's active org.
 */
export interface VaultCtx {
    ownerEmail: string;
    orgId: string | null;
}
/**
 * Build a VaultCtx from the current request. Throws if the request is
 * unauthenticated — the previous behavior of falling back to "local@localhost"
 * leaked rows across tenants when a misconfigured environment skipped auth.
 */
export declare function requireVaultCtx(): VaultCtx;
export declare function getVaultAccessSettings(): Promise<VaultAccessSettings>;
export declare function setVaultAccessSettings(input: {
    mode: VaultAccessMode;
}): Promise<VaultAccessSettings>;
export declare function recordVaultAudit(input: {
    action: string;
    secretId?: string | null;
    appId?: string | null;
    summary: string;
    metadata?: unknown;
    actor?: string;
}): Promise<void>;
export declare function listVaultAudit(limit?: number): Promise<{
    id: string;
    ownerEmail: string;
    orgId: string;
    secretId: string;
    appId: string;
    action: string;
    actor: string;
    summary: string;
    metadata: string;
    createdAt: number;
}[]>;
export declare function listSecrets(): Promise<{
    id: string;
    ownerEmail: string;
    orgId: string;
    name: string;
    credentialKey: string;
    value: string;
    provider: string;
    description: string;
    createdBy: string;
    createdAt: number;
    updatedAt: number;
}[]>;
export declare function getSecret(secretId: string, ctx: VaultCtx): Promise<{
    id: string;
    ownerEmail: string;
    orgId: string;
    name: string;
    credentialKey: string;
    value: string;
    provider: string;
    description: string;
    createdBy: string;
    createdAt: number;
    updatedAt: number;
}>;
export declare function createSecret(input: {
    credentialKey: string;
    value: string;
    name: string;
    provider?: string | null;
    description?: string | null;
}, ctx?: VaultCtx): Promise<{
    id: string;
    ownerEmail: string;
    orgId: string;
    name: string;
    credentialKey: string;
    value: string;
    provider: string;
    description: string;
    createdBy: string;
    createdAt: number;
    updatedAt: number;
}>;
export declare function updateSecret(secretId: string, value: string, ctx?: VaultCtx): Promise<{
    id: string;
    ownerEmail: string;
    orgId: string;
    name: string;
    credentialKey: string;
    value: string;
    provider: string;
    description: string;
    createdBy: string;
    createdAt: number;
    updatedAt: number;
}>;
export declare function deleteSecret(secretId: string, ctx?: VaultCtx): Promise<{
    id: string;
    ownerEmail: string;
    orgId: string;
    name: string;
    credentialKey: string;
    value: string;
    provider: string;
    description: string;
    createdBy: string;
    createdAt: number;
    updatedAt: number;
}>;
export declare function listGrants(filter?: {
    secretId?: string;
    appId?: string;
}): Promise<{
    id: string;
    ownerEmail: string;
    orgId: string;
    secretId: string;
    appId: string;
    grantedBy: string;
    status: string;
    syncedAt: number;
    createdAt: number;
    updatedAt: number;
}[]>;
export declare function getGrant(grantId: string, ctx?: VaultCtx): Promise<{
    id: string;
    ownerEmail: string;
    orgId: string;
    secretId: string;
    appId: string;
    grantedBy: string;
    status: string;
    syncedAt: number;
    createdAt: number;
    updatedAt: number;
}>;
export declare function createGrant(secretId: string, appId: string, ctx?: VaultCtx): Promise<{
    id: string;
    ownerEmail: string;
    orgId: string;
    secretId: string;
    appId: string;
    grantedBy: string;
    status: string;
    syncedAt: number;
    createdAt: number;
    updatedAt: number;
}>;
export declare function grantSecretsToApp(secretIds: string[], appId: string, ctx?: VaultCtx): Promise<{
    appId: string;
    accessMode: "all-apps";
    created: any[];
    skipped: string[];
} | {
    appId: string;
    accessMode: "manual";
    created: any[];
    skipped: string[];
}>;
export declare function revokeGrant(grantId: string, ctx?: VaultCtx): Promise<{
    id: string;
    ownerEmail: string;
    orgId: string;
    secretId: string;
    appId: string;
    grantedBy: string;
    status: string;
    syncedAt: number;
    createdAt: number;
    updatedAt: number;
}>;
type VaultSecretRow = typeof schema.vaultSecrets.$inferSelect;
export declare function credentialStoreScopeForVaultCtx(ctx: VaultCtx): {
    scope: Extract<SecretScope, "org" | "workspace">;
    scopeId: string;
};
export declare function syncSecretsToCredentialStore(secrets: VaultSecretRow[], ctx: VaultCtx): Promise<{
    keys: string[];
    scope: Extract<SecretScope, "org" | "workspace">;
    scopeId: string;
}>;
export declare function syncGrantsToApp(appId: string, ctx?: VaultCtx): Promise<{
    appId: string;
    accessMode: VaultAccessMode;
    synced: number;
    keys: any[];
    credentialStore?: undefined;
    envVars?: undefined;
} | {
    appId: string;
    accessMode: VaultAccessMode;
    synced: number;
    keys: string[];
    credentialStore: {
        scope: "workspace" | "org";
        scopeId: string;
        synced: number;
    };
    envVars: {
        status: "synced";
        keys: string[];
    } | {
        status: "skipped";
        reason: string;
    } | {
        status: "failed";
        reason: string;
    };
}>;
export declare function listRequests(filter?: {
    status?: string;
}): Promise<{
    id: string;
    ownerEmail: string;
    orgId: string;
    credentialKey: string;
    appId: string;
    reason: string;
    requestedBy: string;
    status: string;
    reviewedBy: string;
    reviewedAt: number;
    createdAt: number;
    updatedAt: number;
}[]>;
export declare function getRequest(requestId: string, ctx?: VaultCtx): Promise<{
    id: string;
    ownerEmail: string;
    orgId: string;
    credentialKey: string;
    appId: string;
    reason: string;
    requestedBy: string;
    status: string;
    reviewedBy: string;
    reviewedAt: number;
    createdAt: number;
    updatedAt: number;
}>;
export declare function createRequest(input: {
    credentialKey: string;
    appId: string;
    reason?: string | null;
}): Promise<{
    id: string;
    ownerEmail: string;
    orgId: string;
    credentialKey: string;
    appId: string;
    reason: string;
    requestedBy: string;
    status: string;
    reviewedBy: string;
    reviewedAt: number;
    createdAt: number;
    updatedAt: number;
}>;
export declare function approveRequest(requestId: string, secretValue: string, secretName?: string, ctx?: VaultCtx): Promise<{
    id: string;
    ownerEmail: string;
    orgId: string;
    credentialKey: string;
    appId: string;
    reason: string;
    requestedBy: string;
    status: string;
    reviewedBy: string;
    reviewedAt: number;
    createdAt: number;
    updatedAt: number;
}>;
export declare function denyRequest(requestId: string, reason?: string | null, ctx?: VaultCtx): Promise<{
    id: string;
    ownerEmail: string;
    orgId: string;
    credentialKey: string;
    appId: string;
    reason: string;
    requestedBy: string;
    status: string;
    reviewedBy: string;
    reviewedAt: number;
    createdAt: number;
    updatedAt: number;
}>;
export interface IntegrationEntry {
    key: string;
    label: string;
    required: boolean;
    configured: boolean;
    vaultGranted: boolean;
    vaultSecretId?: string;
}
export interface AppIntegrations {
    appId: string;
    appName: string;
    url: string;
    color: string;
    integrations: IntegrationEntry[];
    vaultAccessMode: VaultAccessMode;
    reachable: boolean;
}
export declare function listIntegrationsCatalog(): Promise<AppIntegrations[]>;
export declare function listVaultOverview(): Promise<{
    accessMode: VaultAccessMode;
    secretCount: number;
    activeGrantCount: number;
    manualGrantCount: number;
    pendingRequestCount: number;
}>;
export {};
//# sourceMappingURL=vault-store.d.ts.map