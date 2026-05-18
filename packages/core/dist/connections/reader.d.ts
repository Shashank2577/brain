import { type WorkspaceConnectionCapability, type WorkspaceConnectionCredentialKey, type WorkspaceConnectionProviderId } from "./catalog.js";
import { type ResolveWorkspaceConnectionCredentialsForAppOptions, type WorkspaceConnectionCredentialsResolution, type WorkspaceConnectionPublicCredentialRef } from "../workspace-connections/index.js";
import { type ResolvedWorkspaceConnectionForApp, type ResolveWorkspaceConnectionForAppOptions } from "../workspace-connections/store.js";
export type ProviderReaderOperation = "search" | "get" | "listRecent";
export type ProviderReaderImplementationStatus = "metadata-only" | "template-owned" | "shared";
export interface ProviderReaderCapability {
    capability: WorkspaceConnectionCapability;
    label: string;
    description: string;
}
export interface ProviderReaderOperationParameter {
    name: string;
    type: "string" | "number" | "boolean" | "string[]";
    required?: boolean;
    description: string;
}
export interface ProviderReaderOperationDescriptor {
    operation: ProviderReaderOperation;
    label: string;
    description: string;
    implementationStatus: ProviderReaderImplementationStatus;
    parameters: readonly ProviderReaderOperationParameter[];
}
export interface ProviderReaderDefinition {
    providerId: WorkspaceConnectionProviderId;
    label: string;
    description: string;
    implementationStatus: ProviderReaderImplementationStatus;
    credentialKeys: readonly WorkspaceConnectionCredentialKey[];
    requiredCredentialKeys: readonly string[];
    capabilities: readonly ProviderReaderCapability[];
    operations: readonly ProviderReaderOperationDescriptor[];
    notes?: string;
}
export interface ListProviderReadersOptions {
    providerId?: WorkspaceConnectionProviderId;
    capability?: WorkspaceConnectionCapability;
    operation?: ProviderReaderOperation;
    implementationStatus?: ProviderReaderImplementationStatus;
}
export type ProviderReaderRuntimeErrorCode = "unsupported_provider" | "unsupported_operation" | "connection_not_available" | "credentials_unavailable";
export interface ProviderReaderRequest<TParams extends Record<string, unknown> = Record<string, unknown>> {
    providerId: WorkspaceConnectionProviderId;
    operation: ProviderReaderOperation;
    params?: TParams;
    connectionId?: string | null;
    userEmail?: string | null;
    orgId?: string | null;
}
export interface ProviderReaderRuntimeItem {
    id: string;
    type: string;
    title?: string;
    url?: string;
    text?: string;
    metadata?: Record<string, unknown>;
}
export interface ProviderReaderRuntimeResponse {
    providerId: WorkspaceConnectionProviderId;
    operation: ProviderReaderOperation;
    connectionId: string;
    items?: ProviderReaderRuntimeItem[];
    item?: ProviderReaderRuntimeItem | null;
    metadata?: Record<string, unknown>;
}
export interface ProviderReaderRuntimeConnection {
    id: string;
    provider: string;
    label: string;
    accountId: string | null;
    accountLabel: string | null;
    credentialRefs: WorkspaceConnectionPublicCredentialRef[];
}
export interface ProviderReaderCredentialRequirement {
    values: Record<string, string>;
    resolution: WorkspaceConnectionCredentialsResolution;
}
export interface ProviderReaderRuntimeContext {
    appId: string;
    providerId: WorkspaceConnectionProviderId;
    reader: ProviderReaderDefinition;
    connection: ProviderReaderRuntimeConnection;
    resolveCredentials(keys?: readonly string[]): Promise<WorkspaceConnectionCredentialsResolution>;
    requireCredentials(keys?: readonly string[]): Promise<ProviderReaderCredentialRequirement>;
}
export type ProviderReaderRuntimeHandler<TParams extends Record<string, unknown> = Record<string, unknown>> = (params: TParams, context: ProviderReaderRuntimeContext) => ProviderReaderRuntimeResponse | Promise<ProviderReaderRuntimeResponse>;
export interface ProviderReaderRuntimeImplementation<TProviderId extends WorkspaceConnectionProviderId = WorkspaceConnectionProviderId> {
    providerId: TProviderId;
    operations: Partial<Record<ProviderReaderOperation, ProviderReaderRuntimeHandler>>;
}
export interface ProviderReaderRuntimeConnectionResolverOptions extends Pick<ResolveWorkspaceConnectionForAppOptions, "appId" | "connectionId"> {
    providerId: WorkspaceConnectionProviderId;
}
export interface ProviderReaderRuntimeCredentialsResolverOptions extends Pick<ResolveWorkspaceConnectionCredentialsForAppOptions, "appId" | "connectionId" | "keys" | "userEmail" | "orgId"> {
    providerId: WorkspaceConnectionProviderId;
}
export interface ProviderReaderRuntimeOptions {
    appId: string;
    readers: readonly ProviderReaderRuntimeImplementation[];
    resolveConnection?: (options: ProviderReaderRuntimeConnectionResolverOptions) => Promise<ResolvedWorkspaceConnectionForApp>;
    resolveCredentials?: (options: ProviderReaderRuntimeCredentialsResolverOptions) => Promise<WorkspaceConnectionCredentialsResolution>;
}
export interface ProviderReaderRuntime {
    read<TParams extends Record<string, unknown> = Record<string, unknown>>(request: ProviderReaderRequest<TParams>): Promise<ProviderReaderRuntimeResponse>;
}
export declare class ProviderReaderRuntimeError extends Error {
    readonly code: ProviderReaderRuntimeErrorCode;
    readonly providerId: string;
    readonly operation?: ProviderReaderOperation;
    constructor(code: ProviderReaderRuntimeErrorCode, message: string, options: {
        providerId: string;
        operation?: ProviderReaderOperation;
    });
}
export declare function defineProviderReader<const T extends ProviderReaderDefinition>(reader: T): T;
export declare function defineProviderReaderImplementation<const T extends ProviderReaderRuntimeImplementation>(implementation: T): T;
export declare const PROVIDER_READERS: readonly [{
    readonly providerId: "slack";
    readonly label: "Slack reader";
    readonly description: "Normalized metadata for reading Slack messages and channel history through template-owned Slack implementations.";
    readonly implementationStatus: "template-owned";
    readonly credentialKeys: readonly WorkspaceConnectionCredentialKey[];
    readonly requiredCredentialKeys: readonly string[];
    readonly capabilities: readonly [{
        readonly capability: "search";
        readonly label: "Message search";
        readonly description: "Search conversation history using Slack's message search semantics.";
    }, {
        readonly capability: "messages";
        readonly label: "Message retrieval";
        readonly description: "Read individual messages or recent channel activity when a template owns the Slack client.";
    }];
    readonly operations: readonly [ProviderReaderOperationDescriptor, ProviderReaderOperationDescriptor, ProviderReaderOperationDescriptor];
    readonly notes: "Core only exposes the contract; templates still own Slack API calls and provider-specific pagination.";
}, {
    readonly providerId: "github";
    readonly label: "GitHub reader";
    readonly description: "Normalized metadata for reading repositories, issues, pull requests, and code search results.";
    readonly implementationStatus: "template-owned";
    readonly credentialKeys: readonly WorkspaceConnectionCredentialKey[];
    readonly requiredCredentialKeys: readonly string[];
    readonly capabilities: readonly [{
        readonly capability: "search";
        readonly label: "Repository search";
        readonly description: "Search GitHub issues, pull requests, repositories, code, or docs using template-owned clients.";
    }, {
        readonly capability: "code";
        readonly label: "Code context";
        readonly description: "Read code-oriented objects such as repositories, files, issues, and pull requests.";
    }];
    readonly operations: readonly [ProviderReaderOperationDescriptor, ProviderReaderOperationDescriptor, ProviderReaderOperationDescriptor];
    readonly notes: "No shared Octokit client is exported from core in this spike; templates remain responsible for API calls.";
}, {
    readonly providerId: "notion";
    readonly label: "Notion reader";
    readonly description: "Normalized metadata for reading Notion pages, databases, and workspace docs.";
    readonly implementationStatus: "template-owned";
    readonly credentialKeys: readonly WorkspaceConnectionCredentialKey[];
    readonly requiredCredentialKeys: readonly string[];
    readonly capabilities: readonly [{
        readonly capability: "search";
        readonly label: "Page search";
        readonly description: "Search pages and databases shared with the Notion integration.";
    }, {
        readonly capability: "docs";
        readonly label: "Document retrieval";
        readonly description: "Read Notion page or database metadata through template-owned clients.";
    }];
    readonly operations: readonly [ProviderReaderOperationDescriptor, ProviderReaderOperationDescriptor, ProviderReaderOperationDescriptor];
    readonly notes: "Core does not traverse Notion blocks yet; templates own page hydration and rate-limit behavior.";
}, {
    readonly providerId: "hubspot";
    readonly label: "HubSpot reader";
    readonly description: "Normalized metadata for CRM object lookup through template-owned HubSpot integrations.";
    readonly implementationStatus: "template-owned";
    readonly credentialKeys: readonly WorkspaceConnectionCredentialKey[];
    readonly requiredCredentialKeys: readonly string[];
    readonly capabilities: readonly [{
        readonly capability: "search";
        readonly label: "CRM search";
        readonly description: "Search CRM contacts, companies, deals, tickets, and engagements.";
    }, {
        readonly capability: "crm";
        readonly label: "CRM retrieval";
        readonly description: "Read CRM objects when a template owns HubSpot object mapping.";
    }];
    readonly operations: readonly [ProviderReaderOperationDescriptor, ProviderReaderOperationDescriptor, ProviderReaderOperationDescriptor];
    readonly notes: "Templates define object allow-lists and property projections; core only documents the reader shape.";
}, {
    readonly providerId: "gmail";
    readonly label: "Gmail reader";
    readonly description: "Normalized metadata for mailbox search and thread/message reads through app-owned Google OAuth flows.";
    readonly implementationStatus: "template-owned";
    readonly credentialKeys: readonly WorkspaceConnectionCredentialKey[];
    readonly requiredCredentialKeys: readonly string[];
    readonly capabilities: readonly [{
        readonly capability: "search";
        readonly label: "Mailbox search";
        readonly description: "Search Gmail messages and threads.";
    }, {
        readonly capability: "messages";
        readonly label: "Mail retrieval";
        readonly description: "Read Gmail messages and threads when a template owns OAuth token handling.";
    }];
    readonly operations: readonly [ProviderReaderOperationDescriptor, ProviderReaderOperationDescriptor, ProviderReaderOperationDescriptor];
    readonly notes: "This is metadata for templates with Google OAuth; core does not expose a shared Gmail network client here.";
}, {
    readonly providerId: "google_drive";
    readonly label: "Google Drive reader";
    readonly description: "Normalized metadata for Drive file search and document lookup through app-owned Google OAuth flows.";
    readonly implementationStatus: "template-owned";
    readonly credentialKeys: readonly WorkspaceConnectionCredentialKey[];
    readonly requiredCredentialKeys: readonly string[];
    readonly capabilities: readonly [{
        readonly capability: "search";
        readonly label: "Drive search";
        readonly description: "Search files visible to the connected Google account.";
    }, {
        readonly capability: "docs";
        readonly label: "Drive document retrieval";
        readonly description: "Read file metadata or exported document content through template-owned Google clients.";
    }];
    readonly operations: readonly [ProviderReaderOperationDescriptor, ProviderReaderOperationDescriptor, ProviderReaderOperationDescriptor];
    readonly notes: "Templates still own file export formats, Docs/Sheets/Slides handling, and OAuth token refresh.";
}, {
    readonly providerId: "generic";
    readonly label: "Generic metadata reader";
    readonly description: "Placeholder reader metadata for custom sources that expose searchable documents through a template-specific adapter.";
    readonly implementationStatus: "metadata-only";
    readonly credentialKeys: readonly WorkspaceConnectionCredentialKey[];
    readonly requiredCredentialKeys: readonly string[];
    readonly capabilities: readonly [{
        readonly capability: "search";
        readonly label: "Custom search";
        readonly description: "Describe a template-specific search interface for one-off sources.";
    }, {
        readonly capability: "docs";
        readonly label: "Custom document retrieval";
        readonly description: "Describe a template-specific document retrieval interface.";
    }];
    readonly operations: readonly [ProviderReaderOperationDescriptor, ProviderReaderOperationDescriptor];
    readonly notes: "Use this only to document a template-owned adapter; core cannot execute generic provider reads.";
}];
export declare function listProviderReaders(options?: ListProviderReadersOptions): ProviderReaderDefinition[];
export declare function getProviderReader(providerId: string): ProviderReaderDefinition | undefined;
export declare function providerReaderSupports(providerOrReader: ProviderReaderDefinition | WorkspaceConnectionProviderId, operationName: ProviderReaderOperation): boolean;
export declare function createProviderReaderRuntime(options: ProviderReaderRuntimeOptions): ProviderReaderRuntime;
//# sourceMappingURL=reader.d.ts.map