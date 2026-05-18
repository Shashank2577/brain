import { jsx as _jsx, jsxs as _jsxs } from "react/jsx-runtime";
/**
 * Lightweight inline CTA that nudges users to connect Builder.io for
 * higher-quality transcription. Renders nothing when Builder is already
 * connected.
 *
 * Drop this next to transcript displays in any template.
 */
import { useCallback, useEffect, useRef, useState } from "react";
import { IconBolt, IconExternalLink, IconLoader2 } from "@tabler/icons-react";
import { agentNativePath } from "../api-path.js";
import { openBuilderConnectPopup } from "../settings/useBuilderStatus.js";
export function BuilderTranscriptionCta() {
    const [configured, setConfigured] = useState(null);
    const [connectUrl, setConnectUrl] = useState(null);
    const [connecting, setConnecting] = useState(false);
    const [error, setError] = useState(null);
    const pollRef = useRef(null);
    const mountedRef = useRef(true);
    useEffect(() => {
        mountedRef.current = true;
        fetch(agentNativePath("/_agent-native/builder/status"))
            .then((r) => r.ok
            ? r.json()
            : null)
            .then((s) => {
            if (!mountedRef.current)
                return;
            // Env-managed mode counts as configured for the CTA — the deploy
            // already routes transcription through Builder, no per-user prompt.
            setConfigured(!!(s?.configured || s?.envManaged));
            setConnectUrl(s?.cliAuthUrl || s?.connectUrl || null);
        })
            .catch(() => {
            if (mountedRef.current)
                setConfigured(false);
        });
        return () => {
            mountedRef.current = false;
            if (pollRef.current)
                clearInterval(pollRef.current);
        };
    }, []);
    const handleConnect = useCallback(() => {
        if (pollRef.current)
            clearInterval(pollRef.current);
        setConnecting(true);
        setError(null);
        openBuilderConnectPopup({
            url: connectUrl ?? undefined,
            source: "builder_transcription_cta",
        });
        const start = Date.now();
        pollRef.current = setInterval(async () => {
            try {
                const r = await fetch(agentNativePath("/_agent-native/builder/status"));
                if (!r.ok)
                    return;
                const s = (await r.json());
                if (!mountedRef.current) {
                    clearInterval(pollRef.current);
                    return;
                }
                if (s.configured) {
                    clearInterval(pollRef.current);
                    setConfigured(true);
                    setConnecting(false);
                }
                else if (Date.now() - start > 5 * 60 * 1000) {
                    clearInterval(pollRef.current);
                    setConnecting(false);
                    setError("Didn't hear back from Builder. Allow popups and try again.");
                }
            }
            catch {
                // transient — keep polling
            }
        }, 2000);
    }, [connectUrl]);
    // Already connected or still loading — render nothing
    if (configured === null || configured)
        return null;
    return (_jsxs("div", { className: "flex items-center gap-2 rounded-md border border-border/50 bg-muted/30 px-3 py-2 text-xs text-muted-foreground", children: [_jsx(IconBolt, { size: 14, className: "shrink-0 text-muted-foreground/70", "aria-hidden": "true" }), _jsx("span", { className: "flex-1", children: connecting
                    ? "Waiting for Builder.io…"
                    : "Connect Builder.io for higher-quality transcription — free credits, no API key needed." }), error ? (_jsx("span", { className: "text-destructive text-[10px]", children: error })) : connecting ? (_jsx(IconLoader2, { size: 12, className: "shrink-0 animate-spin" })) : (_jsxs("button", { type: "button", onClick: handleConnect, className: "ml-auto shrink-0 inline-flex items-center gap-1 rounded bg-foreground px-2 py-1 text-[10px] font-semibold text-background hover:opacity-90 transition-opacity", children: ["Connect", _jsx(IconExternalLink, { size: 10 })] }))] }));
}
//# sourceMappingURL=BuilderTranscriptionCta.js.map