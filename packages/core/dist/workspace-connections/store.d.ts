import { type WorkspaceConnectionCapability, type WorkspaceConnectionProvider, type WorkspaceConnectionTemplateUse } from "../connections/catalog.js";
export type WorkspaceConnectionStatus = "connected" | "checking" | "needs_reauth" | "error" | "disabled";
export interface WorkspaceConnectionCredentialRef {
    key: string;
    scope?: "user" | "org" | "workspace";
    provider?: string;
    label?: string;
    [key: string]: unknown;
}
export interface WorkspaceConnection {
    id: string;
    provider: string;
    label: string;
    accountId: string | null;
    accountLabel: string | null;
    status: WorkspaceConnectionStatus;
    scopes: string[];
    config: Record<string, unknown>;
    allowedApps: string[];
    credentialRefs: WorkspaceConnectionCredentialRef[];
    ownerEmail: string;
    orgId: string | null;
    createdAt: string;
    updatedAt: string;
    lastUsedAt?: string | null;
    lastCheckedAt: string | null;
    lastError: string | null;
}
export type SerializedWorkspaceConnection = WorkspaceConnection;
export interface WorkspaceConnectionGrant {
    id: string;
    connectionId: string;
    provider: string;
    appId: string;
    scopes: string[];
    config: Record<string, unknown>;
    credentialRefs: WorkspaceConnectionCredentialRef[];
    grantedByEmail: string;
    ownerEmail: string;
    orgId: string | null;
    createdAt: string;
    updatedAt: string;
    lastUsedAt?: string | null;
}
export type SerializedWorkspaceConnectionGrant = WorkspaceConnectionGrant;
export interface ListWorkspaceConnectionsOptions {
    provider?: string;
    appId?: string;
    includeDisabled?: boolean;
}
export interface ListWorkspaceConnectionGrantsOptions {
    connectionId?: string;
    appId?: string;
    provider?: string;
}
export interface ListWorkspaceConnectionsForAppOptions {
    appId: string;
    provider?: string;
    includeDisabled?: boolean;
}
export interface ResolveWorkspaceConnectionForAppOptions extends ListWorkspaceConnectionsForAppOptions {
    connectionId?: string;
    requireConnected?: boolean;
}
export interface UpsertWorkspaceConnectionInput {
    id?: string;
    provider: string;
    label?: string;
    accountId?: string | null;
    accountLabel?: string | null;
    status?: WorkspaceConnectionStatus;
    scopes?: string[];
    config?: Record<string, unknown>;
    allowedApps?: string[];
    credentialRefs?: WorkspaceConnectionCredentialRef[];
    lastCheckedAt?: Date | number | string | null;
    lastError?: string | null;
}
export interface UpsertWorkspaceConnectionGrantInput {
    id?: string;
    connectionId: string;
    appId: string;
    provider?: string;
    scopes?: string[];
    config?: Record<string, unknown>;
    credentialRefs?: WorkspaceConnectionCredentialRef[];
}
export type WorkspaceConnectionAppAccessMode = "all-apps" | "allowed-app" | "explicit-grant" | "unavailable";
export interface WorkspaceConnectionAppAccess {
    appId: string;
    available: boolean;
    mode: WorkspaceConnectionAppAccessMode;
    reason: string;
    grantId: string | null;
}
export type WorkspaceConnectionGrantState = "connected" | "granted" | "needs_grant" | "not_connected";
export type WorkspaceConnectionGrantAvailability = "available" | "needs_grant" | "not_connected";
export type WorkspaceConnectionProviderReadinessStatus = "ready" | "checking" | "needs_credentials" | "needs_attention" | "disabled" | "not_configured";
export interface WorkspaceConnectionPublicCredentialRef {
    key: string;
    scope?: string;
    provider?: string;
    label?: string;
    source: "connection" | "grant";
}
export interface WorkspaceConnectionExplicitGrantSummary {
    id: string;
    appId: string;
    scopes: string[];
    credentialRefs: WorkspaceConnectionPublicCredentialRef[];
    updatedAt: string;
    lastUsedAt: string | null;
}
export interface WorkspaceConnectionForAppSummary {
    id: string;
    label: string;
    provider: string;
    accountId: string | null;
    accountLabel: string | null;
    status: WorkspaceConnectionStatus;
    grantedToApp: boolean;
    grantScope: "all-apps" | "selected-apps";
    appAccess: WorkspaceConnectionAppAccess;
    allowedApps: string[];
    credentialRefs: WorkspaceConnectionPublicCredentialRef[];
    lastUsedAt: string | null;
    lastCheckedAt: string | null;
    lastError: string | null;
    explicitGrant: WorkspaceConnectionExplicitGrantSummary | null;
}
export interface WorkspaceConnectionForApp extends SerializedWorkspaceConnection {
    appAccess: WorkspaceConnectionAppAccess;
    explicitGrant: SerializedWorkspaceConnectionGrant | null;
}
export interface ResolvedWorkspaceConnectionForApp {
    available: boolean;
    connection: WorkspaceConnectionForApp | null;
    appAccess: WorkspaceConnectionAppAccess | null;
    reason: string;
}
export interface WorkspaceConnectionProviderAppSummary {
    appId: string;
    provider: string;
    grantState: WorkspaceConnectionGrantState;
    grantAvailability: WorkspaceConnectionGrantAvailability;
    grantAvailabilityMessage: string;
    connectionCount: number;
    grantedConnectionCount: number;
    activeConnectionCount: number;
    ungrantedConnectionCount: number;
    unhealthyGrantedConnectionCount: number;
    explicitGrantCount: number;
    credentialRefCount: number;
    hasWorkspaceConnection: boolean;
    hasGrantedWorkspaceConnection: boolean;
    hasActiveWorkspaceConnection: boolean;
    lastUsedAt: string | null;
    statuses: WorkspaceConnectionStatus[];
    connections: WorkspaceConnectionForAppSummary[];
}
export interface WorkspaceConnectionProviderReadiness {
    status: WorkspaceConnectionProviderReadinessStatus;
    connectionCount: number;
    activeConnectionCount: number;
    readyConnectionCount: number;
    requiredCredentialKeys: string[];
    missingRequiredCredentialKeys: string[];
    appGrant: WorkspaceConnectionProviderAppSummary | null;
}
export interface WorkspaceConnectionProviderLike {
    id: string;
    label?: string;
    credentialKeys?: readonly {
        key: string;
        required?: boolean;
    }[];
}
export interface SummarizeWorkspaceConnectionProviderForAppOptions {
    providerId: string;
    appId: string;
    connections: SerializedWorkspaceConnection[];
    grants?: SerializedWorkspaceConnectionGrant[];
    includeConnections?: "all" | "granted";
}
export interface SummarizeWorkspaceConnectionProviderReadinessOptions {
    provider: WorkspaceConnectionProviderLike;
    connections: SerializedWorkspaceConnection[];
    grants?: SerializedWorkspaceConnectionGrant[];
    appId?: string;
    includeConnections?: "all" | "granted";
}
export interface ListWorkspaceConnectionProviderCatalogForAppOptions {
    appId: string;
    provider?: string;
    capability?: WorkspaceConnectionCapability;
    templateUse?: WorkspaceConnectionTemplateUse;
    includeDisabled?: boolean;
    includeConnections?: "all" | "granted";
}
export interface MarkWorkspaceConnectionUsedOptions {
    connectionId: string;
    appId?: string | null;
    usedAt?: Date | number | string | null;
}
export interface MarkWorkspaceConnectionUsedResult {
    connectionUpdated: boolean;
    grantUpdated: boolean;
    lastUsedAt: string;
}
export interface WorkspaceConnectionProviderCatalogForAppItem extends WorkspaceConnectionProvider {
    workspaceConnection: WorkspaceConnectionProviderAppSummary;
    readiness: WorkspaceConnectionProviderReadiness;
}
export interface WorkspaceConnectionProviderCatalogForApp {
    appId: string;
    providers: WorkspaceConnectionProviderCatalogForAppItem[];
    connections: SerializedWorkspaceConnection[];
    grants: SerializedWorkspaceConnectionGrant[];
    counts: {
        providers: number;
        connections: number;
        grants: number;
        readyProviders: number;
    };
}
export declare function ensureWorkspaceConnectionsTable(): Promise<void>;
export declare function serializeWorkspaceConnection(connection: WorkspaceConnection): SerializedWorkspaceConnection;
export declare function serializeWorkspaceConnectionGrant(grant: WorkspaceConnectionGrant): SerializedWorkspaceConnectionGrant;
export declare function getWorkspaceConnectionAppAccess(connection: Pick<SerializedWorkspaceConnection, "id" | "allowedApps" | "label">, appId: string, grants?: Pick<SerializedWorkspaceConnectionGrant, "id" | "connectionId" | "appId">[]): WorkspaceConnectionAppAccess;
export declare function workspaceConnectionIsAvailableToApp(connection: Pick<SerializedWorkspaceConnection, "id" | "allowedApps" | "label">, appId: string, grants?: Pick<SerializedWorkspaceConnectionGrant, "id" | "connectionId" | "appId">[]): boolean;
export declare function summarizeWorkspaceConnectionProviderForApp({ providerId, appId, connections, grants, includeConnections, }: SummarizeWorkspaceConnectionProviderForAppOptions): WorkspaceConnectionProviderAppSummary;
export declare function summarizeWorkspaceConnectionProviderReadiness({ provider, connections, grants, appId, includeConnections, }: SummarizeWorkspaceConnectionProviderReadinessOptions): WorkspaceConnectionProviderReadiness;
export declare function listWorkspaceConnectionProviderCatalogForApp({ appId, provider, capability, templateUse, includeDisabled, includeConnections, }: ListWorkspaceConnectionProviderCatalogForAppOptions): Promise<WorkspaceConnectionProviderCatalogForApp>;
export declare function listWorkspaceConnectionsForApp({ appId, provider, includeDisabled, }: ListWorkspaceConnectionsForAppOptions): Promise<WorkspaceConnectionForApp[]>;
export declare function resolveWorkspaceConnectionForApp({ appId, provider, includeDisabled, connectionId, requireConnected, }: ResolveWorkspaceConnectionForAppOptions): Promise<ResolvedWorkspaceConnectionForApp>;
export declare function listWorkspaceConnections(options?: ListWorkspaceConnectionsOptions): Promise<SerializedWorkspaceConnection[]>;
export declare function getWorkspaceConnection(id: string): Promise<SerializedWorkspaceConnection | null>;
export declare function upsertWorkspaceConnection(input: UpsertWorkspaceConnectionInput): Promise<SerializedWorkspaceConnection>;
export declare function listWorkspaceConnectionGrants(options?: ListWorkspaceConnectionGrantsOptions): Promise<SerializedWorkspaceConnectionGrant[]>;
export declare function getWorkspaceConnectionGrant(connectionId: string, appId: string): Promise<SerializedWorkspaceConnectionGrant | null>;
export declare function markWorkspaceConnectionUsed({ connectionId, appId, usedAt, }: MarkWorkspaceConnectionUsedOptions): Promise<MarkWorkspaceConnectionUsedResult>;
export declare function upsertWorkspaceConnectionGrant(input: UpsertWorkspaceConnectionGrantInput): Promise<SerializedWorkspaceConnectionGrant>;
export declare function revokeWorkspaceConnectionGrant(connectionId: string, appId: string): Promise<boolean>;
export declare function deleteWorkspaceConnection(id: string): Promise<boolean>;
//# sourceMappingURL=store.d.ts.map