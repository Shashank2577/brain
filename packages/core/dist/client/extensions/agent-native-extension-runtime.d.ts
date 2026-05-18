export declare const AGENT_NATIVE_EXTENSION_STORAGE_MESSAGE_TYPES: {
    readonly REQUEST: "agentNative.extension.storage";
    readonly RESPONSE: "agentNative.extension.storageResult";
    readonly SLOT_CONTEXT: "agentNative.extension.slotContext";
    readonly RESIZE: "agentNative.extension.resize";
};
export type AgentNativeExtensionStorageScope = "user" | "org";
export type AgentNativeExtensionStorageOperation = "list" | "get" | "set" | "remove";
export interface AgentNativeExtensionDefinition {
    id: string;
    name: string;
    description?: string;
    content: string;
    updatedAt?: string;
}
export interface AgentNativeExtensionStorageRequest {
    operation: AgentNativeExtensionStorageOperation;
    extensionId: string;
    collection: string;
    id?: string;
    data?: unknown;
    scope?: AgentNativeExtensionStorageScope;
    limit?: number;
}
export interface AgentNativeExtensionStorageContext {
    extensionId: string;
    slotId?: string;
    slotContext?: Record<string, unknown> | null;
}
export interface AgentNativeExtensionDataRow {
    id: string;
    extensionId: string;
    collection: string;
    data: unknown;
    scope: AgentNativeExtensionStorageScope;
    createdAt: string;
    updatedAt: string;
}
export interface AgentNativeExtensionStorage {
    list(collection: string, options: {
        scope?: AgentNativeExtensionStorageScope | "all";
        limit?: number;
        context: AgentNativeExtensionStorageContext;
    }): Promise<AgentNativeExtensionDataRow[]>;
    get(collection: string, id: string, options: {
        scope?: AgentNativeExtensionStorageScope;
        context: AgentNativeExtensionStorageContext;
    }): Promise<AgentNativeExtensionDataRow | null>;
    set(collection: string, id: string, data: unknown, options: {
        scope?: AgentNativeExtensionStorageScope;
        context: AgentNativeExtensionStorageContext;
    }): Promise<AgentNativeExtensionDataRow>;
    remove(collection: string, id: string, options: {
        scope?: AgentNativeExtensionStorageScope;
        context: AgentNativeExtensionStorageContext;
    }): Promise<{
        ok: true;
    }>;
}
export interface BuildAgentNativeExtensionHtmlOptions {
    extensionId: string;
    content: string;
    title?: string;
    dark?: boolean;
    themeCss?: string;
}
export declare function buildAgentNativeExtensionHtml(options: BuildAgentNativeExtensionHtmlOptions): string;
export declare function createLocalStorageAgentNativeExtensionStorage(namespace?: string): AgentNativeExtensionStorage;
//# sourceMappingURL=agent-native-extension-runtime.d.ts.map