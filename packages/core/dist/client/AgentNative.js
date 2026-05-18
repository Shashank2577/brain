import { jsx as _jsx } from "react/jsx-runtime";
import { useCallback, useMemo } from "react";
import { AgentNativeFrame, } from "./AgentNativeFrame.js";
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
export function useAgentNativeScreenContext(options) {
    return useCallback(() => readAgentNativeScreenContext(options), [options]);
}
export function AgentNative({ actions, getContext, screen = true, commands, onRefresh, onNavigate, onRemount, onOpenResource, onRequestApproval, ...frameProps }) {
    const getMergedContext = useCallback(async () => {
        const screenContext = screen === false
            ? {}
            : readAgentNativeScreenContext(screen === true ? {} : screen);
        const customContext = getContext ? await getContext() : undefined;
        return mergeHostContext(screenContext, customContext);
    }, [getContext, screen]);
    const mergedCommands = useMemo(() => {
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
    return (_jsx(AgentNativeFrame, { ...frameProps, actions: actions, commands: mergedCommands, getContext: getMergedContext }));
}
//# sourceMappingURL=AgentNative.js.map