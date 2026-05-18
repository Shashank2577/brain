import { jsx as _jsx } from "react/jsx-runtime";
import { createElement as _createElement } from "react";
import { forwardRef, useCallback, useEffect, useMemo, useRef, useState, } from "react";
import { createAgentNativeHostBridge, } from "../host-bridge.js";
import { AGENT_NATIVE_EXTENSION_MESSAGE_TYPES, buildAgentNativeExtensionHtml, createLocalStorageAgentNativeExtensionStorage, getAgentNativeExtensionManifest, isAgentNativeExtensionAllowedInSlot, normalizeAgentNativeExtensionSandbox, } from "./portable-extension.js";
const defaultFrameStyle = {
    border: 0,
    display: "block",
    width: "100%",
};
const BUILT_IN_COMMAND_NAMES = [
    "navigate",
    "refreshData",
    "refresh-data",
    "remountView",
    "remount-view",
    "hardReload",
    "hard-reload",
    "openResource",
    "open-resource",
    "requestApproval",
    "request-approval",
];
const COMMAND_ALIASES = {
    refreshData: ["refreshData", "refresh-data"],
    "refresh-data": ["refreshData", "refresh-data"],
    remountView: ["remountView", "remount-view"],
    "remount-view": ["remountView", "remount-view"],
    hardReload: ["hardReload", "hard-reload"],
    "hard-reload": ["hardReload", "hard-reload"],
    openResource: ["openResource", "open-resource"],
    "open-resource": ["openResource", "open-resource"],
    requestApproval: ["requestApproval", "request-approval"],
    "request-approval": ["requestApproval", "request-approval"],
};
function setForwardedRef(ref, value) {
    if (typeof ref === "function")
        ref(value);
    else if (ref)
        ref.current = value;
}
function isRecord(value) {
    return Boolean(value) && typeof value === "object" && !Array.isArray(value);
}
function safeError(error) {
    return error instanceof Error ? error : new Error(String(error));
}
function safeStringify(value) {
    try {
        return JSON.stringify(value ?? {});
    }
    catch {
        return "{}";
    }
}
function resolvePermissionList(value, extension, fallback) {
    if (typeof value === "function")
        return value(extension);
    if (Array.isArray(value))
        return value;
    return fallback;
}
function resolveStorageScopeList(value, extension, fallback) {
    if (typeof value === "function")
        return value(extension);
    if (Array.isArray(value))
        return value;
    return fallback;
}
function toPermissionSet(value) {
    return value ? new Set(value) : null;
}
function commandPermissionSet(value) {
    if (!value)
        return null;
    const expanded = new Set();
    for (const command of value) {
        expanded.add(command);
        for (const alias of COMMAND_ALIASES[command] ?? [])
            expanded.add(alias);
    }
    return expanded;
}
async function resolveActions(actions) {
    const resolved = typeof actions === "function" ? await actions() : actions;
    return Array.isArray(resolved) ? resolved : [];
}
function scopeExtensionActions(actions, allowedNames) {
    if (!actions || !allowedNames)
        return actions;
    return async () => (await resolveActions(actions)).filter((action) => allowedNames.has(action.name));
}
function blockedCommand(command) {
    return () => {
        throw new Error(`Extension is not allowed to call host command "${command}"`);
    };
}
function scopeExtensionCommands(commands, allowedNames) {
    if (!allowedNames)
        return commands;
    const scoped = {};
    for (const command of BUILT_IN_COMMAND_NAMES) {
        if (!allowedNames.has(command))
            scoped[command] = blockedCommand(command);
    }
    for (const [command, handler] of Object.entries(commands ?? {})) {
        scoped[command] = allowedNames.has(command)
            ? handler
            : blockedCommand(command);
    }
    return scoped;
}
function normalizeStorageRequest(value) {
    if (!isRecord(value))
        return null;
    const requestId = typeof value.requestId === "string" ? value.requestId : "";
    const op = value.op === "list" ||
        value.op === "get" ||
        value.op === "set" ||
        value.op === "remove"
        ? value.op
        : null;
    const collection = typeof value.collection === "string" ? value.collection.trim() : "";
    const id = typeof value.id === "string" ? value.id : undefined;
    const options = isRecord(value.options)
        ? value.options
        : undefined;
    if (!requestId || !op || !collection)
        return null;
    if ((op === "get" || op === "set" || op === "remove") && !id) {
        return null;
    }
    return {
        requestId,
        op,
        collection,
        id,
        data: value.data,
        options,
    };
}
function mergeExtensionContext(base, extension, slotId, slotContext) {
    return {
        ...(base ?? {}),
        extension: {
            id: extension.id,
            name: extension.name,
            description: extension.description,
        },
        slot: slotId
            ? {
                id: slotId,
                context: slotContext ?? {},
            }
            : undefined,
        data: {
            ...(base?.data ?? {}),
            extension: {
                id: extension.id,
                name: extension.name,
            },
            slotContext: slotContext ?? {},
        },
    };
}
export const AgentNativeExtensionFrame = forwardRef(function AgentNativeExtensionFrame({ extension, slotId, context, actions, getContext, commands, allowedActions, allowedCommands, auth, session, storage, allowedStorageScopes, storageNamespace = "default", storageContext, themeCss, isDark, autoHeight = true, initialHeight = 120, onBridgeEvent, onBridgeReady, onStorageError, title, sandbox, allow = "clipboard-read; clipboard-write", referrerPolicy = "no-referrer", style, onLoad, ...iframeProps }, forwardedRef) {
    const iframeRef = useRef(null);
    const bridgeRef = useRef(null);
    const [height, setHeight] = useState(initialHeight);
    const localStorageAdapter = useMemo(() => createLocalStorageAgentNativeExtensionStorage(storageNamespace), [storageNamespace]);
    const storageAdapter = storage === undefined ? localStorageAdapter : storage;
    const contextJson = safeStringify(context);
    const sandboxValue = useMemo(() => normalizeAgentNativeExtensionSandbox(sandbox), [sandbox]);
    const sessionValue = session ?? `extension:${extension.id}:${slotId ?? "standalone"}`;
    const manifest = useMemo(() => getAgentNativeExtensionManifest(extension), [extension]);
    const actionAllowlist = useMemo(() => toPermissionSet(resolvePermissionList(allowedActions, extension, manifest.requestedActions)), [allowedActions, extension, manifest.requestedActions]);
    const commandAllowlist = useMemo(() => commandPermissionSet(resolvePermissionList(allowedCommands, extension, manifest.requestedCommands)), [allowedCommands, extension, manifest.requestedCommands]);
    const storageScopeAllowlist = useMemo(() => {
        const scopes = resolveStorageScopeList(allowedStorageScopes, extension, manifest.storageScopes);
        return scopes ? new Set(scopes) : null;
    }, [allowedStorageScopes, extension, manifest.storageScopes]);
    const scopedActions = useMemo(() => scopeExtensionActions(actions, actionAllowlist), [actions, actionAllowlist]);
    const scopedCommands = useMemo(() => scopeExtensionCommands(commands, commandAllowlist), [commands, commandAllowlist]);
    const getMergedContext = useCallback(async () => {
        const base = getContext ? await getContext() : {};
        return mergeExtensionContext(base, extension, slotId, context);
    }, [contextJson, extension, getContext, slotId]);
    const srcDoc = useMemo(() => buildAgentNativeExtensionHtml({
        extensionId: extension.id,
        title: title ?? extension.name,
        content: extension.content,
        slotId,
        slotContext: context,
        themeCss,
        isDark,
    }), [
        contextJson,
        extension.content,
        extension.id,
        extension.name,
        isDark,
        slotId,
        themeCss,
        title,
    ]);
    const postSlotContext = useCallback(() => {
        iframeRef.current?.contentWindow?.postMessage({
            type: AGENT_NATIVE_EXTENSION_MESSAGE_TYPES.SLOT_CONTEXT,
            extensionId: extension.id,
            slotId,
            context: context ?? {},
        }, "*");
    }, [contextJson, extension.id, slotId]);
    useEffect(() => {
        const bridge = createAgentNativeHostBridge({
            session: sessionValue,
            getContext: getMergedContext,
            commands: scopedCommands,
            actions: scopedActions,
            auth,
            onEvent: onBridgeEvent,
            targetWindow: iframeRef.current?.contentWindow ?? null,
        }).start();
        bridgeRef.current = bridge;
        onBridgeReady?.(bridge);
        return () => {
            bridge.stop();
            if (bridgeRef.current === bridge)
                bridgeRef.current = null;
        };
    }, [
        actions,
        auth,
        getMergedContext,
        onBridgeEvent,
        onBridgeReady,
        sessionValue,
        scopedActions,
        scopedCommands,
    ]);
    useEffect(() => {
        postSlotContext();
        void bridgeRef.current?.refreshContext();
    }, [postSlotContext]);
    useEffect(() => {
        if (typeof window === "undefined")
            return;
        const respond = (requestId, payload) => {
            iframeRef.current?.contentWindow?.postMessage({
                type: AGENT_NATIVE_EXTENSION_MESSAGE_TYPES.STORAGE_RESPONSE,
                requestId,
                ...payload,
            }, "*");
        };
        const handleStorageRequest = async (request) => {
            try {
                if (!storageAdapter) {
                    throw new Error("No extension storage adapter is registered");
                }
                const requestContext = {
                    ...(storageContext ?? {}),
                    extensionId: extension.id,
                    slotId,
                };
                const { op, collection, id, data, options } = request;
                const requestedScope = typeof options?.scope === "string"
                    ? options.scope
                    : (requestContext.scope ?? "user");
                if (storageScopeAllowlist &&
                    !storageScopeAllowlist.has(requestedScope)) {
                    throw new Error(`Extension is not allowed to use storage scope "${requestedScope}"`);
                }
                const result = op === "list"
                    ? await storageAdapter.list(collection, options, requestContext)
                    : op === "get"
                        ? await storageAdapter.get(collection, id, options, requestContext)
                        : op === "set"
                            ? await storageAdapter.set(collection, id, data, options, requestContext)
                            : await storageAdapter.remove(collection, id, options, requestContext);
                respond(request.requestId, { ok: true, result });
            }
            catch (error) {
                const err = safeError(error);
                onStorageError?.(err, request);
                respond(request.requestId, { ok: false, error: err.message });
            }
        };
        function onMessage(event) {
            if (event.source !== iframeRef.current?.contentWindow)
                return;
            const message = event.data;
            if (!isRecord(message))
                return;
            if (message.type === AGENT_NATIVE_EXTENSION_MESSAGE_TYPES.RESIZE) {
                if (!autoHeight)
                    return;
                const nextHeight = Number(message.height);
                if (Number.isFinite(nextHeight) && nextHeight > 0) {
                    setHeight(Math.ceil(nextHeight));
                }
                return;
            }
            if (message.type !== AGENT_NATIVE_EXTENSION_MESSAGE_TYPES.STORAGE_REQUEST) {
                return;
            }
            const request = normalizeStorageRequest(message);
            if (!request) {
                const requestId = typeof message.requestId === "string" ? message.requestId : "";
                if (requestId) {
                    respond(requestId, {
                        ok: false,
                        error: "Invalid extension storage request",
                    });
                }
                return;
            }
            void handleStorageRequest(request);
        }
        window.addEventListener("message", onMessage);
        return () => window.removeEventListener("message", onMessage);
    }, [
        autoHeight,
        extension.id,
        onStorageError,
        slotId,
        storageAdapter,
        storageContext,
        storageScopeAllowlist,
    ]);
    return (_createElement("iframe", { ...iframeProps, key: `${extension.id}:${extension.updatedAt ?? ""}`, ref: (node) => {
            iframeRef.current = node;
            setForwardedRef(forwardedRef, node);
            bridgeRef.current?.setTargetWindow(node?.contentWindow ?? null);
        }, title: title ?? extension.name, srcDoc: srcDoc, sandbox: sandboxValue, allow: allow, referrerPolicy: referrerPolicy, style: {
            ...defaultFrameStyle,
            height: autoHeight ? height : "100%",
            ...style,
        }, onLoad: (event) => {
            bridgeRef.current?.setTargetWindow(event.currentTarget.contentWindow ?? null);
            postSlotContext();
            void bridgeRef.current?.sendInit();
            onLoad?.(event);
        } }));
});
export function AgentNativeExtensionSlot({ id, extensions, context, actions, getContext, commands, allowedActions, allowedCommands, auth, session, storage, allowedStorageScopes, storageNamespace, storageContext, themeCss, isDark, autoHeight, initialHeight, onBridgeEvent, onBridgeReady, onStorageError, className, extensionClassName, extensionStyle, empty = null, showEmptyAffordance = false, ...iframeProps }) {
    const slotExtensions = extensions.filter((extension) => isAgentNativeExtensionAllowedInSlot(extension, id));
    if (slotExtensions.length === 0) {
        if (!showEmptyAffordance)
            return null;
        return _jsx("div", { className: className, children: empty });
    }
    return (_jsx("div", { className: className, children: slotExtensions.map((extension) => (_createElement(AgentNativeExtensionFrame, { ...iframeProps, key: extension.id, extension: extension, slotId: id, context: context, actions: actions, getContext: getContext, commands: commands, allowedActions: allowedActions, allowedCommands: allowedCommands, auth: auth, session: session, storage: storage, allowedStorageScopes: allowedStorageScopes, storageNamespace: storageNamespace, storageContext: storageContext, themeCss: themeCss, isDark: isDark, autoHeight: autoHeight, initialHeight: initialHeight, onBridgeEvent: onBridgeEvent, onBridgeReady: onBridgeReady, onStorageError: onStorageError, className: extensionClassName, style: extensionStyle }))) }));
}
//# sourceMappingURL=AgentNativeExtensionFrame.js.map