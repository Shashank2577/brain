import { jsx as _jsx } from "react/jsx-runtime";
import { useEffect, useRef, useCallback, useState } from "react";
const SCRIPT_ID = "cf-turnstile-script";
const SCRIPT_SRC = "https://challenges.cloudflare.com/turnstile/v0/api.js?onload=__turnstileOnLoad";
let scriptLoadPromise = null;
function loadTurnstileScript() {
    if (scriptLoadPromise)
        return scriptLoadPromise;
    if (window.turnstile)
        return Promise.resolve();
    scriptLoadPromise = new Promise((resolve) => {
        window.__turnstileOnLoad = () => {
            resolve();
            delete window.__turnstileOnLoad;
        };
        const script = document.createElement("script");
        script.id = SCRIPT_ID;
        script.src = SCRIPT_SRC;
        script.async = true;
        script.defer = true;
        document.head.appendChild(script);
    });
    return scriptLoadPromise;
}
/**
 * Cloudflare Turnstile captcha widget.
 *
 * Renders nothing if no site key is available (graceful opt-in).
 * In "managed" mode (default), the widget is invisible unless
 * Turnstile determines a challenge is needed.
 */
export function Turnstile({ siteKey, onVerify, onExpire, mode = "managed", className, }) {
    const resolvedKey = siteKey ||
        import.meta.env
            ?.VITE_TURNSTILE_SITE_KEY;
    const containerRef = useRef(null);
    const widgetIdRef = useRef(null);
    const [ready, setReady] = useState(false);
    const onVerifyRef = useRef(onVerify);
    onVerifyRef.current = onVerify;
    const onExpireRef = useRef(onExpire);
    onExpireRef.current = onExpire;
    useEffect(() => {
        if (!resolvedKey)
            return;
        loadTurnstileScript().then(() => setReady(true));
    }, [resolvedKey]);
    const renderWidget = useCallback(() => {
        if (!ready ||
            !resolvedKey ||
            !containerRef.current ||
            !window.turnstile ||
            widgetIdRef.current)
            return;
        widgetIdRef.current = window.turnstile.render(containerRef.current, {
            sitekey: resolvedKey,
            appearance: mode === "invisible" ? "interaction-only" : "managed",
            callback: (token) => onVerifyRef.current(token),
            "expired-callback": () => onExpireRef.current?.(),
        });
    }, [ready, resolvedKey, mode]);
    useEffect(() => {
        renderWidget();
        return () => {
            if (widgetIdRef.current && window.turnstile) {
                window.turnstile.remove(widgetIdRef.current);
                widgetIdRef.current = null;
            }
        };
    }, [renderWidget]);
    // Render nothing if no site key — captcha is opt-in
    if (!resolvedKey)
        return null;
    return _jsx("div", { ref: containerRef, className: className });
}
//# sourceMappingURL=Turnstile.js.map