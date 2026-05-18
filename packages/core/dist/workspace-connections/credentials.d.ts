import { type CredentialStorageScope } from "../credentials/index.js";
import { type SecretRef } from "../secrets/storage.js";
import { type WorkspaceConnectionAppAccessMode, type WorkspaceConnectionPublicCredentialRef } from "./store.js";
export type WorkspaceConnectionCredentialResolutionStatus = "resolved" | "missing_context" | "not_available" | "missing_ref" | "missing_secret" | "error";
export type WorkspaceConnectionCredentialBackend = "secrets" | "credentials";
export interface ResolveWorkspaceConnectionCredentialForAppOptions {
    appId: string;
    provider: string;
    key: string;
    connectionId?: string | null;
    userEmail?: string | null;
    orgId?: string | null;
}
export interface ResolveWorkspaceConnectionCredentialsForAppOptions extends Omit<ResolveWorkspaceConnectionCredentialForAppOptions, "key"> {
    keys: string[];
}
export interface WorkspaceConnectionCredentialProvenance {
    source: "workspace_connection";
    provider: string;
    requestedKey: string;
    resolvedKey: string;
    credentialRef: WorkspaceConnectionPublicCredentialRef;
    connectionId: string;
    connectionLabel: string;
    grantId: string | null;
    appAccessMode: WorkspaceConnectionAppAccessMode;
    secretScope: SecretRef["scope"] | CredentialStorageScope;
    backend: WorkspaceConnectionCredentialBackend;
}
export interface WorkspaceConnectionCredentialResolutionCheck {
    status: Exclude<WorkspaceConnectionCredentialResolutionStatus, "resolved" | "missing_context">;
    reason: string;
    key: string;
    resolvedKey?: string;
    connectionId?: string;
    connectionLabel?: string;
    grantId?: string | null;
    appAccessMode?: WorkspaceConnectionAppAccessMode;
    credentialRef?: WorkspaceConnectionPublicCredentialRef;
    secretScope?: SecretRef["scope"] | CredentialStorageScope;
    backend?: WorkspaceConnectionCredentialBackend;
}
export interface WorkspaceConnectionCredentialResolution {
    available: boolean;
    status: WorkspaceConnectionCredentialResolutionStatus;
    reason: string;
    provider: string;
    key: string;
    value?: string;
    provenance: WorkspaceConnectionCredentialProvenance | null;
    checked: WorkspaceConnectionCredentialResolutionCheck[];
}
export interface WorkspaceConnectionCredentialsResolution {
    available: boolean;
    appId: string;
    provider: string;
    connectionId: string | null;
    values: Record<string, string>;
    results: Record<string, WorkspaceConnectionCredentialResolution>;
    missingKeys: string[];
}
export declare function resolveWorkspaceConnectionCredentialForApp(options: ResolveWorkspaceConnectionCredentialForAppOptions): Promise<WorkspaceConnectionCredentialResolution>;
export declare function resolveWorkspaceConnectionCredentialsForApp(options: ResolveWorkspaceConnectionCredentialsForAppOptions): Promise<WorkspaceConnectionCredentialsResolution>;
//# sourceMappingURL=credentials.d.ts.map