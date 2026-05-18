import { jsx as _jsx } from "react/jsx-runtime";
import { useCallback, useEffect, useMemo } from "react";
import { AgentChatSurface, AgentSidebar, } from "./AgentPanel.js";
import { createAgentNativeBrowserSessionBridge, } from "./browser-session-bridge.js";
import { readAgentNativeScreenContext, } from "./host-bridge.js";
function mergeObject(base, override) {
    if (!base && !override)
        return undefined;
    return { ...(base ?? {}), ...(override ?? {}) };
}
function mergeHostContext(base, override) {
    if (!override)
        return base;
    return {
        ...base,
        ...override,
        route: mergeObject(base.route, override.route),
        selection: mergeObject(base.selection, override.selection),
        screen: mergeObject(base.screen, override.screen),
    };
}
function toCommandHandler(callback) {
    if (!callback)
        return undefined;
    return (request) => callback(request.payload, {
        command: request.command,
        requestId: request.requestId,
        origin: request.origin,
    });
}
function sessionBrowserTabId(session) {
    if (typeof session === "string")
        return session;
    return typeof session?.id === "string" ? session.id : undefined;
}
function useMergedEmbeddedCommands({ commands, onNavigate, onOpenResource, onRefresh, onRemount, onRequestApproval, }) {
    return useMemo(() => {
        const refreshHandler = toCommandHandler(onRefresh);
        const navigateHandler = toCommandHandler(onNavigate);
        const remountHandler = toCommandHandler(onRemount);
        const openResourceHandler = toCommandHandler(onOpenResource);
        const requestApprovalHandler = toCommandHandler(onRequestApproval);
        return {
            ...commands,
            ...(refreshHandler
                ? { refreshData: refreshHandler, "refresh-data": refreshHandler }
                : {}),
            ...(navigateHandler ? { navigate: navigateHandler } : {}),
            ...(remountHandler
                ? { remountView: remountHandler, "remount-view": remountHandler }
                : {}),
            ...(openResourceHandler
                ? {
                    openResource: openResourceHandler,
                    "open-resource": openResourceHandler,
                }
                : {}),
            ...(requestApprovalHandler
                ? {
                    requestApproval: requestApprovalHandler,
                    "request-approval": requestApprovalHandler,
                }
                : {}),
        };
    }, [
        commands,
        onNavigate,
        onOpenResource,
        onRefresh,
        onRemount,
        onRequestApproval,
    ]);
}
export function useAgentNativeEmbeddedBrowserSession({ enabled = true, actions, getContext, screen = true, commands, session, browserSession, onNavigate, onOpenResource, onRefresh, onRemount, onRequestApproval, }) {
    const mergedCommands = useMergedEmbeddedCommands({
        commands,
        onNavigate,
        onOpenResource,
        onRefresh,
        onRemount,
        onRequestApproval,
    });
    const getMergedContext = useCallback(async () => {
        const screenContext = screen === false
            ? {}
            : readAgentNativeScreenContext(screen === true ? {} : screen);
        const customContext = getContext ? await getContext() : undefined;
        return mergeHostContext(screenContext, customContext);
    }, [getContext, screen]);
    useEffect(() => {
        if (!enabled)
            return;
        const bridge = createAgentNativeBrowserSessionBridge({
            endpoint: browserSession?.endpoint,
            sessionId: browserSession?.sessionId,
            label: browserSession?.label,
            heartbeatMs: browserSession?.heartbeatMs,
            pollMs: browserSession?.pollMs,
            ttlMs: browserSession?.ttlMs,
            fetch: browserSession?.fetch,
            session,
            getContext: getMergedContext,
            actions,
            commands: mergedCommands,
        }).start();
        browserSession?.onReady?.(bridge);
        return () => bridge.stop();
    }, [
        actions,
        browserSession?.endpoint,
        browserSession?.fetch,
        browserSession?.heartbeatMs,
        browserSession?.label,
        browserSession?.onReady,
        browserSession?.pollMs,
        browserSession?.sessionId,
        browserSession?.ttlMs,
        enabled,
        getMergedContext,
        mergedCommands,
        session,
    ]);
}
export function AgentNativeEmbedded({ children, surface, actions, getContext, enabled, screen, commands, session, browserSession, onNavigate, onOpenResource, onRefresh, onRemount, onRequestApproval, panel, ...sidebarProps }) {
    useAgentNativeEmbeddedBrowserSession({
        enabled,
        actions,
        getContext,
        screen,
        commands,
        session,
        browserSession,
        onNavigate,
        onOpenResource,
        onRefresh,
        onRemount,
        onRequestApproval,
    });
    const mode = surface ?? (children ? "sidebar" : "panel");
    const browserTabId = sidebarProps.browserTabId ??
        panel?.browserTabId ??
        sessionBrowserTabId(session);
    if (mode === "panel" || !children) {
        return _jsx(AgentChatSurface, { browserTabId: browserTabId, ...panel });
    }
    return (_jsx(AgentSidebar, { ...sidebarProps, browserTabId: browserTabId, children: children }));
}
//# sourceMappingURL=AgentNativeEmbedded.js.map