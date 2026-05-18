export declare const AGENT_NATIVE_EXTENSION_MESSAGE_TYPES: {
    readonly STORAGE_REQUEST: "agentNative.extension.storage";
    readonly STORAGE_RESPONSE: "agentNative.extension.storageResult";
    readonly RESIZE: "agentNative.extension.resize";
    readonly SLOT_CONTEXT: "agentNative.extension.slotContext";
};
export type AgentNativeExtensionMessageType = (typeof AGENT_NATIVE_EXTENSION_MESSAGE_TYPES)[keyof typeof AGENT_NATIVE_EXTENSION_MESSAGE_TYPES];
export type AgentNativeExtensionStorageScope = "user" | "org" | "all" | string;
export interface AgentNativeExtensionManifest {
    /** Slot IDs this extension may render into. Omit to let the host decide. */
    slots?: readonly string[];
    /** Host action names this extension is allowed to call. Omit to inherit the slot policy. */
    requestedActions?: readonly string[];
    /** Host command names this extension is allowed to call. Omit to inherit the slot policy. */
    requestedCommands?: readonly string[];
    /** Storage scopes this extension is allowed to use. Omit to inherit the slot policy. */
    storageScopes?: readonly AgentNativeExtensionStorageScope[];
}
export interface AgentNativeExtensionDefinition {
    id: string;
    name: string;
    content: string;
    description?: string;
    updatedAt?: string;
    manifest?: AgentNativeExtensionManifest;
    slots?: readonly string[];
    requestedActions?: readonly string[];
    requestedCommands?: readonly string[];
    storageScopes?: readonly AgentNativeExtensionStorageScope[];
    [key: string]: unknown;
}
export interface AgentNativeExtensionStorageOptions {
    scope?: AgentNativeExtensionStorageScope;
    limit?: number;
    [key: string]: unknown;
}
export interface AgentNativeExtensionStorageContext {
    extensionId: string;
    slotId?: string;
    scope?: Exclude<AgentNativeExtensionStorageScope, "all"> | string;
    userId?: string;
    organizationId?: string;
    [key: string]: unknown;
}
export interface AgentNativeExtensionStorageRow<TData = unknown> {
    id: string;
    extensionId: string;
    collection: string;
    data: TData;
    scope: string;
    createdAt: string;
    updatedAt: string;
}
export interface AgentNativeExtensionStorage {
    list(collection: string, options: AgentNativeExtensionStorageOptions | undefined, context: AgentNativeExtensionStorageContext): AgentNativeExtensionStorageRow[] | Promise<AgentNativeExtensionStorageRow[]>;
    get(collection: string, id: string, options: AgentNativeExtensionStorageOptions | undefined, context: AgentNativeExtensionStorageContext): AgentNativeExtensionStorageRow | null | Promise<AgentNativeExtensionStorageRow | null>;
    set(collection: string, id: string, data: unknown, options: AgentNativeExtensionStorageOptions | undefined, context: AgentNativeExtensionStorageContext): AgentNativeExtensionStorageRow | Promise<AgentNativeExtensionStorageRow>;
    remove(collection: string, id: string, options: AgentNativeExtensionStorageOptions | undefined, context: AgentNativeExtensionStorageContext): {
        removed: boolean;
    } | Promise<{
        removed: boolean;
    }>;
}
export interface CreateHttpAgentNativeExtensionStorageOptions {
    /** Endpoint that receives storage operation POSTs. */
    endpoint: string;
    fetch?: typeof fetch;
    headers?: HeadersInit | ((context: AgentNativeExtensionStorageContext) => HeadersInit | Promise<HeadersInit>);
    credentials?: RequestCredentials;
}
export interface BuildAgentNativeExtensionHtmlOptions {
    extensionId: string;
    content: string;
    title?: string;
    slotId?: string;
    slotContext?: Record<string, unknown> | null;
    themeCss?: string;
    isDark?: boolean;
}
export declare function getAgentNativeExtensionManifest(extension: AgentNativeExtensionDefinition): AgentNativeExtensionManifest;
export declare function isAgentNativeExtensionAllowedInSlot(extension: AgentNativeExtensionDefinition, slotId: string | undefined): boolean;
export declare function createLocalStorageAgentNativeExtensionStorage(namespace?: string): AgentNativeExtensionStorage;
export declare function createHttpAgentNativeExtensionStorage({ endpoint, fetch: fetchImpl, headers, credentials, }: CreateHttpAgentNativeExtensionStorageOptions): AgentNativeExtensionStorage;
export declare function normalizeAgentNativeExtensionSandbox(sandbox: string | undefined): string;
export declare function buildAgentNativeExtensionHtml({ extensionId, content, title, slotId, slotContext, themeCss, isDark, }: BuildAgentNativeExtensionHtmlOptions): string;
//# sourceMappingURL=portable-extension.d.ts.map