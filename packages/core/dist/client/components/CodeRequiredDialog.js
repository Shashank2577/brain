import { jsx as _jsx, jsxs as _jsxs } from "react/jsx-runtime";
import { useEffect, useCallback, useState } from "react";
import { createPortal } from "react-dom";
import { IconPackageExport, IconCode, IconExternalLink, IconX, IconLoader2, } from "@tabler/icons-react";
import { agentNativePath } from "../api-path.js";
import { trackEvent } from "../analytics.js";
import { withBuilderConnectTrackingParams } from "../settings/useBuilderStatus.js";
const DESKTOP_DOWNLOAD_URL = "https://www.agent-native.com/download";
function useBuilderConnected() {
    const [connected, setConnected] = useState(false);
    const [cloudAgentsAvailable, setCloudAgentsAvailable] = useState(false);
    const [connectUrl, setConnectUrl] = useState(null);
    useEffect(() => {
        fetch(agentNativePath("/_agent-native/builder/status"))
            .then((r) => (r.ok ? r.json() : null))
            .then((data) => {
            if (data) {
                setConnected(!!data.configured);
                setCloudAgentsAvailable(!!data.builderEnabled);
                setConnectUrl(data.cliAuthUrl || data.connectUrl || null);
            }
        })
            .catch(() => { });
    }, []);
    return { connected, cloudAgentsAvailable, connectUrl };
}
/**
 * Modal shown when a user tries to use a code-requiring feature where local
 * source access is unavailable. Offers two paths: Agent Native Desktop or the
 * Builder.io agent.
 * Uses inline styles (no Radix/Tailwind dependency).
 */
export function CodeRequiredDialog({ open, onClose, featureLabel, }) {
    const { connected: builderConnected, cloudAgentsAvailable, connectUrl, } = useBuilderConnected();
    const [submitting, setSubmitting] = useState(false);
    const [branchUrl, setBranchUrl] = useState(null);
    const [error, setError] = useState(null);
    const builderHref = withBuilderConnectTrackingParams(connectUrl || agentNativePath("/_agent-native/builder/connect"), { source: "code_required_dialog", flow: "background_agent" });
    const handleKeyDown = useCallback((e) => {
        if (e.key === "Escape")
            onClose();
    }, [onClose]);
    useEffect(() => {
        if (open) {
            document.addEventListener("keydown", handleKeyDown);
            return () => document.removeEventListener("keydown", handleKeyDown);
        }
    }, [open, handleKeyDown]);
    useEffect(() => {
        if (open) {
            setSubmitting(false);
            setBranchUrl(null);
            setError(null);
        }
    }, [open]);
    const handleBuilderAgent = async () => {
        if (!builderConnected) {
            // Open settings tab
            window.dispatchEvent(new Event("agent-panel:open-settings"));
            onClose();
            return;
        }
        setSubmitting(true);
        setError(null);
        try {
            const res = await fetch(agentNativePath("/_agent-native/builder/agents-run"), {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({
                    userMessage: featureLabel || "Make the requested code changes to this app",
                }),
            });
            if (!res.ok) {
                const body = await res.json().catch(() => ({}));
                throw new Error(body?.error || `Failed (${res.status})`);
            }
            const data = await res.json();
            setBranchUrl(data.url || null);
        }
        catch (err) {
            setError(err?.message || "Failed to create branch");
        }
        finally {
            setSubmitting(false);
        }
    };
    if (!open || typeof document === "undefined")
        return null;
    return createPortal(_jsx("div", { style: s.backdrop, onClick: onClose, children: _jsxs("div", { style: s.dialog, onClick: (e) => e.stopPropagation(), role: "dialog", "aria-modal": "true", children: [_jsxs("div", { style: s.header, children: [_jsx("div", { style: s.iconWrap, children: _jsx(IconPackageExport, { size: 20 }) }), _jsxs("div", { children: [_jsx("h2", { style: s.title, children: "Code changes required" }), _jsx("p", { style: s.subtitle, children: featureLabel
                                        ? `"${featureLabel}" creates or modifies source code, which needs Desktop or Builder from this surface.`
                                        : "This action creates or modifies source code, which needs Desktop or Builder from this surface." })] })] }), _jsxs("div", { style: s.options, children: [_jsxs("a", { href: DESKTOP_DOWNLOAD_URL, target: "_blank", rel: "noreferrer", style: { ...s.optionCard, ...s.optionLink }, onMouseEnter: (e) => Object.assign(e.currentTarget.style, s.optionCardHover), onMouseLeave: (e) => Object.assign(e.currentTarget.style, { borderColor: "#e5e7eb" }), children: [_jsx("div", { style: s.optionIcon, children: _jsx(IconCode, { size: 24 }) }), _jsxs("div", { style: s.optionText, children: [_jsx("span", { style: s.optionTitle, children: "Use Brain Desktop" }), _jsx("span", { style: s.optionDesc, children: "Open the project in the desktop app to enable source edits and CLI access." })] })] }), builderConnected && cloudAgentsAvailable ? (_jsxs("button", { style: {
                                ...s.optionCard,
                                ...(submitting
                                    ? { opacity: 0.7, pointerEvents: "none" }
                                    : {}),
                            }, onMouseEnter: (e) => Object.assign(e.currentTarget.style, s.optionCardHover), onMouseLeave: (e) => Object.assign(e.currentTarget.style, { borderColor: "#e5e7eb" }), onClick: handleBuilderAgent, children: [_jsx("div", { style: s.optionIcon, children: submitting ? (_jsx(IconLoader2, { size: 24, style: { animation: "spin 1s linear infinite" } })) : (_jsx(IconExternalLink, { size: 24 })) }), _jsxs("div", { style: s.optionText, children: [_jsx("span", { style: s.optionTitle, children: "Use Builder.io Agent" }), _jsx("span", { style: s.optionDesc, children: "Let our cloud agent make the changes for you. You'll get a link to preview and deploy." })] })] })) : builderConnected ? (_jsxs("div", { style: {
                                ...s.optionCard,
                                cursor: "default",
                                opacity: 0.85,
                            }, children: [_jsx("div", { style: s.optionIcon, children: _jsx(IconExternalLink, { size: 24 }) }), _jsxs("div", { style: s.optionText, children: [_jsx("span", { style: s.optionTitle, children: "Builder Cloud Agents coming soon" }), _jsx("span", { style: s.optionDesc, children: "You don't have access yet. Use the desktop app or your local clone for this code change." })] }), _jsx("span", { style: s.badge, children: "Coming soon" })] })) : (_jsxs("a", { href: builderHref, target: "_blank", rel: "noreferrer", onClick: () => {
                                trackEvent("builder connect clicked", {
                                    feature: "builder",
                                    stage: "client",
                                    source: "code_required_dialog",
                                    flow: "background_agent",
                                    connect_url_kind: connectUrl ? "provided" : "default",
                                });
                            }, style: { ...s.optionCard, ...s.optionLink }, onMouseEnter: (e) => Object.assign(e.currentTarget.style, s.optionCardHover), onMouseLeave: (e) => Object.assign(e.currentTarget.style, {
                                borderColor: "#e5e7eb",
                            }), children: [_jsx("div", { style: s.optionIcon, children: _jsx(IconExternalLink, { size: 24 }) }), _jsxs("div", { style: s.optionText, children: [_jsx("span", { style: s.optionTitle, children: "Connect Builder.io" }), _jsx("span", { style: s.optionDesc, children: "Connect Builder to enable cloud-based code changes from this app." })] }), !connectUrl && _jsx("span", { style: s.badge, children: "Setup required" })] }))] }), branchUrl && (_jsxs("div", { style: s.result, children: [_jsx("span", { style: { fontSize: 13, fontWeight: 600 }, children: "Branch created" }), _jsx("a", { href: branchUrl, target: "_blank", rel: "noopener noreferrer", style: s.resultLink, children: branchUrl })] })), error && (_jsx("p", { style: { color: "#ef4444", fontSize: 12, marginTop: 12 }, children: error })), _jsx("button", { style: s.closeButton, onClick: onClose, "aria-label": "Close", children: _jsx(IconX, { size: 16 }) })] }) }), document.body);
}
const s = {
    backdrop: {
        position: "fixed",
        inset: 0,
        background: "rgba(0, 0, 0, 0.5)",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        zIndex: 99999,
        padding: "16px",
    },
    dialog: {
        position: "relative",
        background: "#fff",
        borderRadius: "12px",
        maxWidth: "460px",
        width: "100%",
        padding: "24px",
        boxShadow: "0 20px 25px -5px rgba(0,0,0,.1), 0 8px 10px -6px rgba(0,0,0,.1)",
        fontFamily: '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif',
        color: "#111827",
    },
    header: {
        display: "flex",
        gap: "14px",
        alignItems: "flex-start",
        marginBottom: "20px",
    },
    iconWrap: {
        flexShrink: 0,
        width: "40px",
        height: "40px",
        borderRadius: "10px",
        background: "#f3f4f6",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        color: "#6b7280",
    },
    title: {
        margin: 0,
        fontSize: "16px",
        fontWeight: 600,
        lineHeight: "1.4",
    },
    subtitle: {
        margin: "4px 0 0",
        fontSize: "13px",
        color: "#6b7280",
        lineHeight: "1.5",
    },
    options: {
        display: "flex",
        flexDirection: "column",
        gap: "10px",
    },
    optionCard: {
        position: "relative",
        display: "flex",
        alignItems: "flex-start",
        gap: "14px",
        padding: "14px",
        border: "1px solid #e5e7eb",
        borderRadius: "10px",
        background: "transparent",
        cursor: "pointer",
        textAlign: "left",
        width: "100%",
        fontSize: "inherit",
        fontFamily: "inherit",
        color: "inherit",
    },
    optionCardHover: {
        borderColor: "#a5b4fc",
    },
    optionLink: {
        textDecoration: "none",
        boxSizing: "border-box",
    },
    optionIcon: {
        flexShrink: 0,
        color: "#00B5FF",
        marginTop: "2px",
    },
    optionText: {
        display: "flex",
        flexDirection: "column",
        gap: "2px",
    },
    optionTitle: {
        fontSize: "14px",
        fontWeight: 600,
    },
    optionDesc: {
        fontSize: "12px",
        color: "#6b7280",
        lineHeight: "1.5",
    },
    code: {
        background: "#f3f4f6",
        padding: "1px 5px",
        borderRadius: "4px",
        fontSize: "11px",
        fontFamily: "monospace",
    },
    badge: {
        position: "absolute",
        top: "10px",
        right: "10px",
        fontSize: "10px",
        fontWeight: 600,
        color: "#00B5FF",
        background: "#e0f2fe",
        padding: "2px 8px",
        borderRadius: "99px",
        textTransform: "uppercase",
        letterSpacing: "0.5px",
    },
    closeButton: {
        position: "absolute",
        top: "12px",
        right: "12px",
        background: "transparent",
        border: "none",
        cursor: "pointer",
        padding: "6px",
        borderRadius: "6px",
        color: "#9ca3af",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
    },
    result: {
        marginTop: "16px",
        padding: "12px",
        borderRadius: "8px",
        border: "1px solid #22c55e40",
        background: "#f0fdf4",
        display: "flex",
        flexDirection: "column",
        gap: "4px",
    },
    resultLink: {
        fontSize: "12px",
        color: "#00B5FF",
        textDecoration: "none",
        wordBreak: "break-all",
    },
};
//# sourceMappingURL=CodeRequiredDialog.js.map