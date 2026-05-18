import React, { type CSSProperties, type IframeHTMLAttributes } from "react";
import { type AgentNativeClientActions, type AgentNativeHostAuth, type AgentNativeHostBridge, type AgentNativeHostBridgeEvent, type AgentNativeHostCommandHandlers, type AgentNativeHostContextGetter, type AgentNativeHostSession } from "../host-bridge.js";
import { type AgentNativeExtensionDefinition, type AgentNativeExtensionStorage, type AgentNativeExtensionStorageContext, type AgentNativeExtensionStorageOptions, type AgentNativeExtensionStorageScope } from "./portable-extension.js";
export type AgentNativeExtensionPermissionList = readonly string[] | ((extension: AgentNativeExtensionDefinition) => readonly string[] | undefined) | undefined;
export type AgentNativeExtensionStorageScopeList = readonly AgentNativeExtensionStorageScope[] | ((extension: AgentNativeExtensionDefinition) => readonly AgentNativeExtensionStorageScope[] | undefined) | undefined;
export interface AgentNativeExtensionFrameProps extends Omit<IframeHTMLAttributes<HTMLIFrameElement>, "src" | "srcDoc"> {
    extension: AgentNativeExtensionDefinition;
    /** Stable slot identifier, for example `customer-detail.sidebar`. */
    slotId?: string;
    /** Context pushed into `window.slotContext` and merged into host context. */
    context?: Record<string, unknown> | null;
    /** Live actions exposed to the extension through `appAction()` and `agentNative.action()`. */
    actions?: AgentNativeClientActions;
    /** Page/app context exposed through `agentNative.context()`. */
    getContext?: AgentNativeHostContextGetter;
    /** Host commands exposed through `agentNative.command()` and `agentNative.refresh()`. */
    commands?: AgentNativeHostCommandHandlers;
    /** Host-enforced action allowlist. Defaults to extension manifest requestedActions. */
    allowedActions?: AgentNativeExtensionPermissionList;
    /** Host-enforced command allowlist. Defaults to extension manifest requestedCommands. */
    allowedCommands?: AgentNativeExtensionPermissionList;
    auth?: AgentNativeHostAuth;
    session?: string | Partial<AgentNativeHostSession>;
    /** Storage adapter used by `extensionData.*`. Defaults to browser localStorage. */
    storage?: AgentNativeExtensionStorage | false;
    /** Host-enforced storage scope allowlist. Defaults to extension manifest storageScopes. */
    allowedStorageScopes?: AgentNativeExtensionStorageScopeList;
    storageNamespace?: string;
    storageContext?: Omit<AgentNativeExtensionStorageContext, "extensionId" | "slotId">;
    themeCss?: string;
    isDark?: boolean;
    autoHeight?: boolean;
    initialHeight?: number;
    onBridgeEvent?: (event: AgentNativeHostBridgeEvent) => void;
    onBridgeReady?: (bridge: AgentNativeHostBridge) => void;
    onStorageError?: (error: Error, request: AgentNativeExtensionStorageRequest) => void;
}
export interface AgentNativeExtensionSlotProps extends Omit<AgentNativeExtensionFrameProps, "extension" | "className" | "style" | "children"> {
    id: string;
    extensions: AgentNativeExtensionDefinition[];
    className?: string;
    extensionClassName?: string;
    extensionStyle?: CSSProperties;
    empty?: React.ReactNode;
    showEmptyAffordance?: boolean;
}
interface AgentNativeExtensionStorageRequest {
    requestId: string;
    op: "list" | "get" | "set" | "remove";
    collection: string;
    id?: string;
    data?: unknown;
    options?: AgentNativeExtensionStorageOptions;
}
export declare const AgentNativeExtensionFrame: React.ForwardRefExoticComponent<AgentNativeExtensionFrameProps & React.RefAttributes<HTMLIFrameElement>>;
export declare function AgentNativeExtensionSlot({ id, extensions, context, actions, getContext, commands, allowedActions, allowedCommands, auth, session, storage, allowedStorageScopes, storageNamespace, storageContext, themeCss, isDark, autoHeight, initialHeight, onBridgeEvent, onBridgeReady, onStorageError, className, extensionClassName, extensionStyle, empty, showEmptyAffordance, ...iframeProps }: AgentNativeExtensionSlotProps): import("react/jsx-runtime").JSX.Element;
export {};
//# sourceMappingURL=AgentNativeExtensionFrame.d.ts.map