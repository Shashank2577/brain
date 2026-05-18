import { jsx as _jsx } from "react/jsx-runtime";
import { forwardRef, useEffect, useMemo, useRef, } from "react";
import { createAgentNativeHostBridge, } from "./host-bridge.js";
function originFromUrl(value) {
    try {
        const base = typeof window !== "undefined"
            ? window.location.href
            : "http://agent-native.local";
        return new URL(value, base).origin;
    }
    catch {
        return undefined;
    }
}
function setForwardedRef(ref, value) {
    if (typeof ref === "function")
        ref(value);
    else if (ref)
        ref.current = value;
}
const defaultStyle = {
    border: 0,
    width: "100%",
    height: "100%",
};
export const AgentNativeFrame = forwardRef(function AgentNativeFrame({ agentUrl, agentOrigin, session, getContext, commands, actions, auth, onBridgeEvent, onBridgeReady, title = "Agent Native assistant", sandbox = "allow-scripts allow-same-origin allow-forms allow-popups allow-downloads", allow = "clipboard-read; clipboard-write; microphone; fullscreen", referrerPolicy = "strict-origin-when-cross-origin", style, onLoad, ...iframeProps }, forwardedRef) {
    const iframeRef = useRef(null);
    const bridgeRef = useRef(null);
    const resolvedOrigin = useMemo(() => agentOrigin ?? originFromUrl(agentUrl), [agentOrigin, agentUrl]);
    useEffect(() => {
        const bridge = createAgentNativeHostBridge({
            agentOrigin: resolvedOrigin,
            session,
            getContext,
            commands,
            actions,
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
        auth,
        actions,
        commands,
        getContext,
        onBridgeEvent,
        onBridgeReady,
        resolvedOrigin,
        session,
    ]);
    return (_jsx("iframe", { ...iframeProps, ref: (node) => {
            iframeRef.current = node;
            setForwardedRef(forwardedRef, node);
            bridgeRef.current?.setTargetWindow(node?.contentWindow ?? null);
        }, src: agentUrl, title: title, sandbox: sandbox, allow: allow, referrerPolicy: referrerPolicy, style: { ...defaultStyle, ...style }, onLoad: (event) => {
            bridgeRef.current?.setTargetWindow(event.currentTarget.contentWindow ?? null);
            void bridgeRef.current?.sendInit();
            onLoad?.(event);
        } }));
});
//# sourceMappingURL=AgentNativeFrame.js.map