import { jsx as _jsx, jsxs as _jsxs } from "react/jsx-runtime";
/**
 * <DevOverlay /> — the framework dev/configuration panel.
 *
 * Templates render this once at the root of their app. The user toggles it
 * with Cmd+Ctrl+A (also exposed as `useDevOverlayShortcut`). Panels register
 * via `registerDevPanel`; values for option-style controls persist to
 * localStorage via `useDevOption`.
 *
 * Visibility note: the overlay only mounts when the host explicitly opens it
 * via the keybinding (or the `open` prop). It is dev-only by convention —
 * shipping with the keybinding active in prod is fine because nothing renders
 * unless invoked.
 */
import { useCallback, useEffect, useState, useSyncExternalStore, } from "react";
import { IconChevronDown, IconChevronRight, IconLoader2, IconRefresh, IconTrash, IconX, } from "@tabler/icons-react";
import { listDevPanels, subscribeDevPanels } from "./registry.js";
import { clearAllDevOverlayStorage, useDevOption, DEV_OVERLAY_STORAGE_PREFIX, } from "./use-dev-option.js";
import { useDevOverlayShortcut } from "./use-dev-overlay-shortcut.js";
import "./builtins.js";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger, } from "../components/ui/tooltip.js";
const PANEL_OPEN_KEY = `${DEV_OVERLAY_STORAGE_PREFIX}open`;
const COLLAPSED_KEY_PREFIX = `${DEV_OVERLAY_STORAGE_PREFIX}collapsed-`;
export function DevOverlay({ open, onOpenChange } = {}) {
    const [internalOpen, setInternalOpen] = useState(false);
    const isControlled = open !== undefined;
    const isOpen = isControlled ? open : internalOpen;
    const setOpen = useCallback((next) => {
        if (!isControlled)
            setInternalOpen(next);
        onOpenChange?.(next);
    }, [isControlled, onOpenChange]);
    useDevOverlayShortcut(useCallback(() => setOpen(!isOpen), [isOpen, setOpen]));
    // Esc closes (only when overlay is the topmost UI — skip when typing).
    useEffect(() => {
        if (!isOpen)
            return;
        const onKey = (e) => {
            if (e.key !== "Escape")
                return;
            const target = e.target;
            if (target &&
                (target.tagName === "INPUT" ||
                    target.tagName === "TEXTAREA" ||
                    target.isContentEditable)) {
                return;
            }
            setOpen(false);
        };
        document.addEventListener("keydown", onKey);
        return () => document.removeEventListener("keydown", onKey);
    }, [isOpen, setOpen]);
    if (!isOpen)
        return null;
    return _jsx(DevOverlayPanel, { onClose: () => setOpen(false) });
}
function DevOverlayPanel({ onClose }) {
    const panels = useSyncExternalStore(subscribeDevPanels, listDevPanels, listDevPanels);
    const shortcutHint = typeof navigator !== "undefined" &&
        /Mac|iPhone|iPad/.test(navigator.userAgent)
        ? "Cmd+Ctrl+A"
        : "Ctrl+Alt+A";
    return (_jsx(TooltipProvider, { delayDuration: 200, children: _jsxs("div", { style: styles.shell, role: "dialog", "aria-label": "Dev overlay", children: [_jsxs("div", { style: styles.header, children: [_jsxs("div", { children: [_jsx("div", { style: styles.headerTitle, children: "Dev Overlay" }), _jsxs("div", { style: styles.headerSub, children: [shortcutHint, " \u00B7 localStorage-backed"] })] }), _jsxs(Tooltip, { children: [_jsx(TooltipTrigger, { asChild: true, children: _jsx("button", { type: "button", style: styles.iconBtn, onClick: onClose, "aria-label": "Close", children: _jsx(IconX, { size: 16 }) }) }), _jsx(TooltipContent, { children: "Close (Esc)" })] })] }), _jsx("div", { style: styles.body, children: panels.length === 0 ? (_jsxs("div", { style: styles.empty, children: ["No panels registered. Call ", _jsx("code", { children: "registerDevPanel(...)" }), " from your template to add options here."] })) : (panels.map((panel) => _jsx(DevPanelCard, { panel: panel }, panel.id))) }), _jsx("div", { style: styles.footer, children: _jsxs(Tooltip, { children: [_jsx(TooltipTrigger, { asChild: true, children: _jsxs("button", { type: "button", style: { ...styles.footerBtn, ...styles.footerBtnDanger }, onClick: () => {
                                        clearAllDevOverlayStorage();
                                    }, children: [_jsx(IconTrash, { size: 13 }), "Clear all dev-overlay values"] }) }), _jsx(TooltipContent, { children: "Reset every dev-overlay value back to its default" })] }) })] }) }));
}
function DevPanelCard({ panel }) {
    const [collapsedRaw, setCollapsedRaw] = useState(() => {
        if (typeof window === "undefined")
            return false;
        try {
            return (window.localStorage.getItem(`${COLLAPSED_KEY_PREFIX}${panel.id}`) ===
                "1");
        }
        catch {
            return false;
        }
    });
    const setCollapsed = (next) => {
        setCollapsedRaw(next);
        try {
            window.localStorage.setItem(`${COLLAPSED_KEY_PREFIX}${panel.id}`, next ? "1" : "0");
        }
        catch {
            // ignore — collapsed state is just UX sugar
        }
    };
    return (_jsxs("div", { style: styles.panel, children: [_jsxs("button", { type: "button", style: styles.panelHeader, onClick: () => setCollapsed(!collapsedRaw), children: [collapsedRaw ? (_jsx(IconChevronRight, { size: 14 })) : (_jsx(IconChevronDown, { size: 14 })), _jsx("span", { style: styles.panelLabel, children: panel.label })] }), !collapsedRaw && (_jsxs("div", { style: styles.panelBody, children: [panel.description && (_jsx("div", { style: styles.panelDesc, children: panel.description })), (panel.options ?? []).map((option) => (_jsx(DevOptionRow, { panelId: panel.id, option: option }, option.id))), panel.render ? (_jsx("div", { style: styles.customRender, children: panel.render() })) : null] }))] }));
}
function DevOptionRow({ panelId, option, }) {
    if (option.type === "boolean") {
        return _jsx(DevBooleanRow, { panelId: panelId, option: option });
    }
    if (option.type === "select") {
        return _jsx(DevSelectRow, { panelId: panelId, option: option });
    }
    if (option.type === "string") {
        return _jsx(DevStringRow, { panelId: panelId, option: option });
    }
    return _jsx(DevActionRow, { option: option });
}
function DevBooleanRow({ panelId, option, }) {
    const [value, setValue] = useDevOption(panelId, option.id, option.default ?? false);
    return (_jsxs("label", { style: styles.row, children: [_jsxs("div", { style: styles.rowLabels, children: [_jsx("div", { style: styles.rowLabel, children: option.label }), option.description && (_jsx("div", { style: styles.rowDesc, children: option.description }))] }), _jsx("input", { type: "checkbox", checked: !!value, onChange: (e) => {
                    const next = e.target.checked;
                    setValue(next);
                    option.onChange?.(next);
                }, style: styles.checkbox })] }));
}
function DevSelectRow({ panelId, option, }) {
    const [value, setValue] = useDevOption(panelId, option.id, option.default ?? option.choices[0]?.value ?? "");
    return (_jsxs("div", { style: styles.row, children: [_jsxs("div", { style: styles.rowLabels, children: [_jsx("div", { style: styles.rowLabel, children: option.label }), option.description && (_jsx("div", { style: styles.rowDesc, children: option.description }))] }), _jsx("select", { value: value, onChange: (e) => {
                    const next = e.target.value;
                    setValue(next);
                    option.onChange?.(next);
                }, style: styles.select, children: option.choices.map((c) => (_jsx("option", { value: c.value, children: c.label }, c.value))) })] }));
}
function DevStringRow({ panelId, option, }) {
    const [value, setValue] = useDevOption(panelId, option.id, option.default ?? "");
    return (_jsxs("div", { style: { ...styles.row, alignItems: "stretch", flexDirection: "column" }, children: [_jsxs("div", { style: styles.rowLabels, children: [_jsx("div", { style: styles.rowLabel, children: option.label }), option.description && (_jsx("div", { style: styles.rowDesc, children: option.description }))] }), _jsx("input", { type: "text", value: value, placeholder: option.placeholder, onChange: (e) => {
                    const next = e.target.value;
                    setValue(next);
                    option.onChange?.(next);
                }, style: styles.input })] }));
}
function DevActionRow({ option }) {
    const [busy, setBusy] = useState(false);
    return (_jsxs("div", { style: styles.row, children: [_jsxs("div", { style: styles.rowLabels, children: [_jsx("div", { style: styles.rowLabel, children: option.label }), option.description && (_jsx("div", { style: styles.rowDesc, children: option.description }))] }), _jsxs("button", { type: "button", disabled: busy, onClick: async () => {
                    setBusy(true);
                    try {
                        await option.onClick();
                    }
                    finally {
                        setBusy(false);
                    }
                }, style: {
                    ...styles.actionBtn,
                    ...(option.destructive ? styles.actionBtnDanger : {}),
                }, children: [busy ? (_jsx(IconLoader2, { size: 13, style: { animation: "spin 1s linear infinite" } })) : (_jsx(IconRefresh, { size: 13 })), option.buttonLabel ?? option.label] })] }));
}
// Shadow / border styles tuned to read well over both light and dark app
// chrome — the overlay is dev-only so we don't bother with theme tokens.
const styles = {
    shell: {
        position: "fixed",
        top: 16,
        right: 16,
        width: 380,
        maxWidth: "calc(100vw - 32px)",
        // Sized to content; capped so it never spills off-screen on small windows.
        maxHeight: "calc(100vh - 32px)",
        background: "rgba(20, 20, 23, 0.96)",
        color: "#f4f4f5",
        border: "1px solid rgba(255,255,255,0.08)",
        borderRadius: 12,
        boxShadow: "0 24px 60px rgba(0,0,0,0.5)",
        backdropFilter: "blur(12px)",
        WebkitBackdropFilter: "blur(12px)",
        fontFamily: "-apple-system, BlinkMacSystemFont, system-ui, 'Segoe UI', sans-serif",
        fontSize: 13,
        zIndex: 2147483646,
        display: "flex",
        flexDirection: "column",
        overflow: "hidden",
    },
    header: {
        display: "flex",
        alignItems: "flex-start",
        justifyContent: "space-between",
        padding: "14px 16px",
        borderBottom: "1px solid rgba(255,255,255,0.06)",
    },
    headerTitle: { fontWeight: 600, fontSize: 14 },
    headerSub: { fontSize: 11, opacity: 0.55, marginTop: 2 },
    iconBtn: {
        background: "transparent",
        border: "none",
        color: "inherit",
        cursor: "pointer",
        padding: 4,
        borderRadius: 6,
        display: "inline-flex",
        alignItems: "center",
    },
    body: {
        padding: 12,
        overflowY: "auto",
        flex: 1,
        // Required to let `overflow-y: auto` actually scroll inside a flex column.
        // Without this, flex children grow to fit content and the scroll never
        // engages.
        minHeight: 0,
        display: "flex",
        flexDirection: "column",
        gap: 8,
    },
    empty: {
        padding: 16,
        fontSize: 12,
        opacity: 0.7,
        background: "rgba(255,255,255,0.03)",
        borderRadius: 8,
        border: "1px dashed rgba(255,255,255,0.1)",
    },
    panel: {
        background: "rgba(255,255,255,0.03)",
        border: "1px solid rgba(255,255,255,0.06)",
        borderRadius: 8,
        overflow: "hidden",
    },
    panelHeader: {
        display: "flex",
        alignItems: "center",
        gap: 6,
        width: "100%",
        background: "transparent",
        border: "none",
        color: "inherit",
        padding: "10px 12px",
        cursor: "pointer",
        fontSize: 13,
        textAlign: "left",
    },
    panelLabel: { fontWeight: 600 },
    panelBody: {
        padding: "0 12px 12px",
        display: "flex",
        flexDirection: "column",
        gap: 10,
    },
    panelDesc: { fontSize: 11, opacity: 0.65, lineHeight: 1.4 },
    customRender: { marginTop: 4 },
    row: {
        display: "flex",
        alignItems: "center",
        justifyContent: "space-between",
        gap: 12,
    },
    rowLabels: {
        display: "flex",
        flexDirection: "column",
        gap: 2,
        flex: 1,
        minWidth: 0,
    },
    rowLabel: { fontSize: 13 },
    rowDesc: { fontSize: 11, opacity: 0.6, lineHeight: 1.4 },
    checkbox: {
        width: 16,
        height: 16,
        cursor: "pointer",
        accentColor: "#3b82f6",
    },
    select: {
        background: "rgba(255,255,255,0.06)",
        color: "inherit",
        border: "1px solid rgba(255,255,255,0.1)",
        borderRadius: 6,
        padding: "4px 8px",
        fontSize: 12,
        minWidth: 120,
        cursor: "pointer",
    },
    input: {
        background: "rgba(255,255,255,0.06)",
        color: "inherit",
        border: "1px solid rgba(255,255,255,0.1)",
        borderRadius: 6,
        padding: "6px 8px",
        fontSize: 12,
        width: "100%",
        boxSizing: "border-box",
    },
    actionBtn: {
        display: "inline-flex",
        alignItems: "center",
        gap: 6,
        background: "rgba(59,130,246,0.15)",
        color: "#bfdbfe",
        border: "1px solid rgba(59,130,246,0.3)",
        borderRadius: 6,
        padding: "5px 10px",
        fontSize: 12,
        cursor: "pointer",
        fontWeight: 500,
    },
    actionBtnDanger: {
        background: "rgba(239,68,68,0.15)",
        color: "#fecaca",
        border: "1px solid rgba(239,68,68,0.3)",
    },
    footer: {
        padding: 10,
        borderTop: "1px solid rgba(255,255,255,0.06)",
        display: "flex",
        justifyContent: "flex-end",
    },
    footerBtn: {
        display: "inline-flex",
        alignItems: "center",
        gap: 6,
        background: "transparent",
        color: "inherit",
        border: "1px solid rgba(255,255,255,0.12)",
        borderRadius: 6,
        padding: "5px 10px",
        fontSize: 11,
        cursor: "pointer",
    },
    footerBtnDanger: { color: "#fecaca", borderColor: "rgba(239,68,68,0.3)" },
};
// Inject keyframes for the spinner once.
if (typeof document !== "undefined" &&
    !document.getElementById("agent-native-dev-overlay-keyframes")) {
    const styleEl = document.createElement("style");
    styleEl.id = "agent-native-dev-overlay-keyframes";
    styleEl.textContent = "@keyframes spin { to { transform: rotate(360deg); } }";
    document.head.appendChild(styleEl);
}
//# sourceMappingURL=DevOverlay.js.map