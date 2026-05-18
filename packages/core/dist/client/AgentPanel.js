import { jsx as _jsx, jsxs as _jsxs, Fragment as _Fragment } from "react/jsx-runtime";
/**
 * AgentPanel — unified agent component with chat, CLI, and workspace modes.
 *
 * A self-contained panel with no layout opinions — drop it into a sidebar,
 * popover, dialog, full page, or any container. It fills its parent via
 * flex and min-h-0.
 *
 * Features:
 * - Chat mode: assistant-ui powered chat with tool calls
 * - CLI mode: embedded xterm.js terminal (dev mode only)
 * - Toggle between modes via header buttons
 *
 * Usage:
 *   // In a sidebar
 *   <div style={{ width: 380 }}><AgentPanel /></div>
 *
 *   // In a popover
 *   <Popover><AgentPanel suggestions={[...]} /></Popover>
 *
 *   // Full page
 *   <AgentPanel className="h-screen" />
 */
import React, { useState, useEffect, useRef, useCallback, useMemo, lazy, Suspense, startTransition, } from "react";
import * as TooltipPrimitive from "@radix-ui/react-tooltip";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger, normalizeTooltipText, } from "./components/ui/tooltip.js";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuShortcut, DropdownMenuTrigger, } from "./components/ui/dropdown-menu.js";
import { IconMessageCircle, IconMessageDots, IconTerminal2, IconSettings, IconLayoutSidebarRightCollapse, IconLayoutGrid, IconCheck, IconPlus, IconX, IconDotsVertical, IconHistory, IconArrowsMaximize, IconArrowsMinimize, IconExternalLink, } from "@tabler/icons-react";
import { FeedbackButton } from "./FeedbackButton.js";
import { MultiTabAssistantChat, } from "./MultiTabAssistantChat.js";
import { useDevMode } from "./use-dev-mode.js";
import { useScreenRefreshKey } from "./use-db-sync.js";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { useLocation, useNavigate } from "react-router";
import { cn } from "./utils.js";
import { agentNativePath } from "./api-path.js";
import { getFrameOrigin, isInFrame, isTrustedFrameMessage } from "./frame.js";
import { getInitialAgentSidebarOpen, SIDEBAR_OPEN_KEY, } from "./agent-sidebar-state.js";
// Lazy-load AgentTerminal to avoid bundling xterm.js when not needed
const AgentTerminal = lazy(() => import("./terminal/index.js").then((m) => ({ default: m.AgentTerminal })));
function parentFrameTargetOrigin() {
    return getFrameOrigin() ?? window.location.origin;
}
function isAgentNativeDesktop() {
    if (typeof navigator === "undefined")
        return false;
    return /AgentNativeDesktop/i.test(navigator.userAgent);
}
// Lazy-load ResourcesPanel to avoid bundling when not needed
const ResourcesPanel = lazy(() => import("./resources/ResourcesPanel.js").then((m) => ({
    default: m.ResourcesPanel,
})));
// Lazy-load SettingsPanel to avoid bundling when not needed
const SettingsPanel = lazy(() => import("./settings/index.js").then((m) => ({
    default: m.SettingsPanel,
})));
// Lazy-load OnboardingPanel — only pulled in when onboarding is active.
const OnboardingPanel = lazy(() => import("./onboarding/OnboardingPanel.js").then((m) => ({
    default: m.OnboardingPanel,
})));
// Lazy-load SetupButton — the header entry-point that re-opens the
// onboarding panel after the user has dismissed it.
const SetupButton = lazy(() => import("./onboarding/SetupButton.js").then((m) => ({
    default: m.SetupButton,
})));
// Setup/onboarding widget is hidden until the UX is improved.
// Flip to `true` to restore the SetupButton in the header and the
// OnboardingPanel above the chat.
const SHOW_ONBOARDING = false;
const CLI_STORAGE_KEY = "agent-native-cli-command";
const CLI_DEFAULT = "claude";
const EXEC_MODE_KEY = "agent-native-exec-mode";
const AGENT_PANEL_FONT_FAMILY = 'ui-sans-serif, system-ui, -apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif';
const AGENT_PANEL_ROOT_STYLE = {
    fontFamily: AGENT_PANEL_FONT_FAMILY,
    fontSize: 13,
    lineHeight: 1.2,
};
const AGENT_PANEL_HEADER_CLASS = "relative z-[240] flex h-12 shrink-0 items-center justify-between gap-2 border-b border-border";
const AGENT_PANEL_HEADER_STYLE = {
    paddingLeft: 8,
    paddingRight: 8,
};
const AGENT_PANEL_CONTROL_STYLE = {
    fontSize: 12,
    lineHeight: 1,
};
const ACTIVATE_KEYS = new Set(["Enter", " "]);
function useAvailableClis() {
    const [clis, setClis] = useState([]);
    useEffect(() => {
        // Try to fetch available CLIs — endpoint is provided by the terminal plugin.
        // Returns 404 gracefully when the plugin isn't loaded.
        fetch(agentNativePath("/_agent-native/available-clis"))
            .then((r) => (r.ok ? r.json() : []))
            .then((data) => setClis(Array.isArray(data) ? data : []))
            .catch(() => { });
    }, []);
    return clis;
}
function useCliSelection(keyPrefix) {
    const cliKey = `${CLI_STORAGE_KEY}${keyPrefix}`;
    const [selected, setSelected] = useState(CLI_DEFAULT);
    useEffect(() => {
        try {
            const saved = localStorage.getItem(cliKey);
            if (saved)
                setSelected(saved);
        }
        catch { }
    }, [cliKey]);
    const select = (cmd) => {
        setSelected(cmd);
        try {
            localStorage.setItem(cliKey, cmd);
        }
        catch { }
    };
    return [selected, select];
}
// Detect dev mode at build time (Vite replaces this)
const IS_DEV = import.meta.env?.DEV === true;
// ─── Settings panel components moved to ./settings/ ────────────────────────
function IconTooltip({ content, children, }) {
    return (_jsx(TooltipPrimitive.Provider, { delayDuration: 250, children: _jsxs(TooltipPrimitive.Root, { children: [_jsx(TooltipPrimitive.Trigger, { asChild: true, children: children }), _jsx(TooltipPrimitive.Portal, { children: _jsxs(TooltipPrimitive.Content, { side: "bottom", sideOffset: 8, className: "z-[300] overflow-hidden rounded-md border border-border bg-popover px-2 py-1 text-[11px] text-foreground shadow-md", children: [normalizeTooltipText(content), _jsx(TooltipPrimitive.Arrow, { className: "fill-popover" })] }) })] }) }));
}
function useBuilderConnectUrl() {
    const [connectUrl, setConnectUrl] = useState(null);
    const [configured, setConfigured] = useState(false);
    useEffect(() => {
        let cancelled = false;
        // Track previous configured state so we only fanout the
        // `agent-engine:configured-changed` event on a real false→true
        // transition. Without this, every `/builder/status` response with
        // `configured: true` dispatched the event, our own `onConfigured`
        // listener caught it (because we both fire AND listen on the same
        // global), refresh fired again, and we'd loop forever.
        let lastConfigured = false;
        const refresh = () => {
            fetch(agentNativePath("/_agent-native/builder/status"))
                .then((res) => (res.ok ? res.json() : null))
                .then((data) => {
                if (cancelled || !data)
                    return;
                if (data.connectUrl)
                    setConnectUrl(data.connectUrl);
                const nextConfigured = !!data.configured;
                setConfigured(nextConfigured);
                if (nextConfigured && !lastConfigured) {
                    lastConfigured = true;
                    // Tell other listeners (the agent panel's "Use Builder" CTA
                    // lives in a different React tree than the connect-flow popup
                    // poller, so a fresh status read here is the only thing that
                    // flips its UI). Dispatch only on transition so listeners
                    // that share this hook don't bounce the event back here.
                    window.dispatchEvent(new CustomEvent("agent-engine:configured-changed", {
                        detail: { source: "builder-status" },
                    }));
                }
                else if (!nextConfigured) {
                    lastConfigured = false;
                }
            })
                .catch(() => { });
        };
        refresh();
        // The "Use Builder" CTA opens Builder in a `<a target="_blank">` tab
        // (not a popup), so the previous one-shot fetch never noticed the
        // connect succeeded when the user came back to the original tab.
        const onFocus = () => refresh();
        const onVisibility = () => {
            if (document.visibilityState === "visible")
                refresh();
        };
        const onConfigured = (e) => {
            // Ignore our own dispatch — refresh() already wrote the new state.
            // Other dispatchers (the connect-flow popup poller, an external
            // tab that completed connect, etc.) get the refresh they need.
            const detail = e.detail;
            if (detail?.source === "builder-status")
                return;
            refresh();
        };
        window.addEventListener("focus", onFocus);
        document.addEventListener("visibilitychange", onVisibility);
        window.addEventListener("agent-engine:configured-changed", onConfigured);
        let channel = null;
        try {
            channel = new BroadcastChannel(`builder-connect:${window.location.host}`);
            channel.onmessage = (e) => {
                const data = e.data;
                if (data?.type === "builder-connect-success")
                    refresh();
            };
        }
        catch {
            // BroadcastChannel missing — focus/visibility refresh still covers it.
        }
        const onMessage = (e) => {
            if (e.origin !== window.location.origin)
                return;
            const data = e.data;
            if (data?.type === "builder-connect-success")
                refresh();
        };
        window.addEventListener("message", onMessage);
        return () => {
            cancelled = true;
            window.removeEventListener("focus", onFocus);
            document.removeEventListener("visibilitychange", onVisibility);
            window.removeEventListener("agent-engine:configured-changed", onConfigured);
            window.removeEventListener("message", onMessage);
            channel?.close();
        };
    }, []);
    return { connectUrl, configured };
}
function useClientOnly() {
    const [mounted, setMounted] = useState(false);
    useEffect(() => setMounted(true), []);
    return mounted;
}
function CodeAccessUnavailablePanel({ title, description, ctaLabel, ctaHref, secondaryCtaLabel = "Use Builder", secondaryCtaHref, compact = false, }) {
    const { connectUrl: builderConnectUrl } = useBuilderConnectUrl();
    const builderHref = secondaryCtaHref ?? builderConnectUrl ?? "https://builder.io";
    return (_jsxs("div", { className: cn("rounded-lg border border-border bg-muted/35 text-center", compact ? "mx-3 mt-2 px-3 py-2.5" : "max-w-[300px] px-4 py-4"), children: [_jsx("div", { className: cn("mx-auto flex items-center justify-center rounded-full bg-background text-muted-foreground", compact ? "mb-2 h-8 w-8" : "mb-3 h-10 w-10"), children: _jsx(IconTerminal2, { className: compact ? "h-4 w-4" : "h-5 w-5" }) }), _jsx("p", { className: "text-sm font-medium text-foreground", children: title }), _jsx("p", { className: cn("mt-1 text-muted-foreground", compact ? "text-[11px] leading-snug" : "text-xs leading-relaxed"), children: description }), _jsxs("div", { className: "mt-3 flex flex-wrap items-center justify-center gap-2", children: [ctaHref ? (_jsxs("a", { href: ctaHref, target: "_blank", rel: "noreferrer", className: "inline-flex items-center gap-1.5 rounded-md bg-foreground px-3 py-1.5 text-xs font-medium text-background hover:opacity-90", children: [ctaLabel, _jsx(IconExternalLink, { className: "h-3 w-3" })] })) : null, _jsxs("a", { href: builderHref, target: "_blank", rel: "noreferrer", className: "inline-flex items-center gap-1.5 rounded-md border border-border bg-background px-3 py-1.5 text-xs font-medium text-foreground hover:bg-accent", children: [secondaryCtaLabel, _jsx(IconExternalLink, { className: "h-3 w-3" })] })] })] }));
}
function AgentPanelInner({ defaultMode = "chat", className, apiUrl, emptyStateText, suggestions, showHeader = true, onCollapse, isFullscreen, onToggleFullscreen, devAppUrl, storageKey, scope, chatNotice, codeAccess, }) {
    const mounted = useClientOnly();
    const keyPrefix = storageKey ? `:${storageKey}` : "";
    const execModeKey = `${EXEC_MODE_KEY}${keyPrefix}`;
    const panelModeKey = `agent-native-panel-mode${keyPrefix}`;
    const isMac = useMemo(() => typeof navigator !== "undefined" &&
        /Mac|iPhone|iPad/.test(navigator.userAgent), []);
    const closeTabHint = isMac ? "\u2303W" : "Alt+W";
    const closeAllTabsHint = isMac ? "\u2303\u2325W" : "Ctrl+Alt+W";
    const [execMode, setExecMode] = useState(() => {
        try {
            const saved = localStorage.getItem(execModeKey);
            if (saved === "build" || saved === "plan")
                return saved;
        }
        catch { }
        return "build";
    });
    const switchExecMode = useCallback((next) => {
        setExecMode(next);
        try {
            localStorage.setItem(execModeKey, next);
        }
        catch { }
        window.dispatchEvent(new CustomEvent("agent-panel:exec-mode-change", {
            detail: { mode: next },
        }));
    }, [execModeKey]);
    const [mode, setMode] = useState(() => {
        try {
            const saved = localStorage.getItem(panelModeKey);
            if (saved === "chat" ||
                saved === "cli" ||
                saved === "resources" ||
                saved === "settings")
                return saved;
        }
        catch { }
        return defaultMode;
    });
    useEffect(() => {
        try {
            localStorage.setItem(panelModeKey, mode);
        }
        catch { }
    }, [mode, panelModeKey]);
    const [settingsSection, setSettingsSection] = useState({ section: null, requestKey: 0 });
    const switchMode = useCallback((m) => {
        startTransition(() => setMode(m));
    }, []);
    const activateOnKeyDown = useCallback((activate) => (event) => {
        if (!ACTIVATE_KEYS.has(event.key))
            return;
        event.preventDefault();
        activate();
    }, []);
    // Listen for mode changes from the frame parent (via AgentSidebar)
    useEffect(() => {
        function handler(e) {
            const detail = e.detail;
            if (detail?.mode)
                switchMode(detail.mode);
        }
        window.addEventListener("agent-panel:set-mode", handler);
        return () => window.removeEventListener("agent-panel:set-mode", handler);
    }, [switchMode]);
    // Open settings tab when requested (replaces the old popover open event)
    useEffect(() => {
        function handleOpenSettings(event) {
            const section = event.detail
                ?.section;
            setSettingsSection((prev) => ({
                section: section ?? null,
                requestKey: prev.requestKey + 1,
            }));
            switchMode("settings");
        }
        window.addEventListener("agent-panel:open-settings", handleOpenSettings);
        return () => window.removeEventListener("agent-panel:open-settings", handleOpenSettings);
    }, [switchMode]);
    // CLI terminal tabs (ephemeral — not persisted to SQL)
    const [cliTabs, setCliTabs] = useState(["cli-1"]);
    const [activeCliTab, setActiveCliTab] = useState("cli-1");
    const cliCounter = useRef(1);
    const addCliTab = useCallback(() => {
        const id = `cli-${++cliCounter.current}`;
        setCliTabs((prev) => [...prev, id]);
        setActiveCliTab(id);
    }, []);
    const closeCliTab = useCallback((id) => {
        setCliTabs((prev) => {
            if (prev.length <= 1) {
                // Last tab — replace with a new one (acts as "clear")
                const newId = `cli-${++cliCounter.current}`;
                setActiveCliTab(newId);
                return [newId];
            }
            const next = prev.filter((t) => t !== id);
            if (id === activeCliTab) {
                const idx = prev.indexOf(id);
                setActiveCliTab(next[Math.min(idx, next.length - 1)]);
            }
            return next;
        });
    }, [activeCliTab]);
    const closeOtherCliTabs = useCallback((id) => {
        setCliTabs([id]);
        setActiveCliTab(id);
    }, []);
    const closeAllCliTabs = useCallback(() => {
        const id = `cli-${++cliCounter.current}`;
        setCliTabs([id]);
        setActiveCliTab(id);
    }, []);
    // Tab close shortcuts. Avoid Cmd+W (browser/OS) and (on Windows) Ctrl+W.
    //   Mac:           Ctrl+W → close tab,  Ctrl+Alt+W → close all
    //   Windows/Linux: Alt+W  → close tab,  Ctrl+Alt+W → close all
    // Use e.code (physical key) — on Mac, Alt+W inserts ∑ and e.key isn't "w".
    useEffect(() => {
        const handleKeyDown = (e) => {
            if (e.code !== "KeyW" || e.metaKey || e.shiftKey)
                return;
            const isCloseAll = e.ctrlKey && e.altKey;
            const isCloseOne = isMac
                ? e.ctrlKey && !e.altKey
                : e.altKey && !e.ctrlKey;
            if (!isCloseAll && !isCloseOne)
                return;
            e.preventDefault();
            if (mode === "chat") {
                window.dispatchEvent(new CustomEvent(isCloseAll
                    ? "agent-chat:close-all-tabs"
                    : "agent-chat:close-current-tab"));
            }
            else if (mode === "cli") {
                if (isCloseAll)
                    closeAllCliTabs();
                else if (activeCliTab)
                    closeCliTab(activeCliTab);
            }
        };
        document.addEventListener("keydown", handleKeyDown);
        return () => document.removeEventListener("keydown", handleKeyDown);
    }, [mode, activeCliTab, closeCliTab, closeAllCliTabs, isMac]);
    const availableClis = useAvailableClis();
    const [selectedCli, selectCli] = useCliSelection(keyPrefix);
    const selectedLabel = availableClis.find((c) => c.command === selectedCli)?.label || selectedCli;
    const { isDevMode, canToggle, setDevMode } = useDevMode(apiUrl);
    const inferredCodeAccessEnabled = !isDevMode || isAgentNativeDesktop() || isInFrame();
    const codeAccessEnabled = codeAccess?.enabled ?? inferredCodeAccessEnabled;
    const codeUnavailableTitle = codeAccess?.unavailableTitle ?? "Open Desktop to edit code";
    const codeUnavailableDescription = codeAccess?.unavailableDescription ??
        "Source-code changes, workspace files, and CLI access are available in the Brain Desktop app.";
    const codeUnavailableCtaLabel = codeAccess?.unavailableCtaLabel ?? "Download Desktop";
    const codeUnavailableCtaHref = codeAccess?.unavailableCtaHref ?? "https://github.com/Shashank2577/agent-native";
    const codeUnavailableSecondaryCtaLabel = codeAccess?.unavailableSecondaryCtaLabel ?? "Use Builder";
    const codeUnavailableSecondaryCtaHref = codeAccess?.unavailableSecondaryCtaHref;
    const canUseCodeTools = isDevMode && codeAccessEnabled;
    // Hide the CLI tab when embedded in the Builder.io frame — code editing
    // there happens via Builder, and the CLI panel only offers a Download
    // Desktop CTA, which adds clutter without value.
    const showCliMode = (isDevMode || !codeAccessEnabled) && !isInFrame();
    useEffect(() => {
        if (mode === "cli" && !showCliMode)
            switchMode("chat");
    }, [mode, showCliMode, switchMode]);
    // Notify frame when dev mode changes — use both a local CustomEvent (for
    // when AgentPanel is rendered directly in the frame) AND postMessage (for
    // when AgentPanel is inside the iframe and needs to cross the boundary).
    const prevIsDevMode = useRef(isDevMode);
    useEffect(() => {
        if (prevIsDevMode.current !== isDevMode) {
            prevIsDevMode.current = isDevMode;
            window.dispatchEvent(new CustomEvent("agent-panel:dev-mode-change", {
                detail: { isDevMode },
            }));
            // Cross iframe boundary to the frame parent
            if (window.parent !== window) {
                window.parent.postMessage({ type: "agentNative.devModeChange", data: { isDevMode } }, parentFrameTargetOrigin());
            }
        }
    }, [isDevMode]);
    const isLocalhost = mounted &&
        typeof window !== "undefined" &&
        (window.location.hostname === "localhost" ||
            window.location.hostname === "127.0.0.1" ||
            window.location.hostname === "::1");
    const showDevToggle = canToggle && isLocalhost;
    const renderModeButtons = useCallback((activeMode) => (_jsx(TooltipProvider, { delayDuration: 200, children: _jsxs("div", { className: "flex shrink-0 items-center gap-1", children: [_jsxs(Tooltip, { children: [_jsx(TooltipTrigger, { asChild: true, children: _jsxs("button", { onClick: () => switchMode("chat"), "aria-label": "Chat mode", className: cn("flex items-center gap-1 rounded-md px-2 py-1 text-[12px] leading-none", activeMode === "chat"
                                    ? "bg-accent text-foreground"
                                    : "text-muted-foreground hover:bg-accent/50 hover:text-foreground"), style: AGENT_PANEL_CONTROL_STYLE, children: [_jsx(IconMessageCircle, { size: 14 }), "Chat"] }) }), _jsx(TooltipContent, { children: "Chat mode" })] }), showCliMode && (_jsxs(Tooltip, { children: [_jsx(TooltipTrigger, { asChild: true, children: _jsxs("button", { onClick: () => switchMode("cli"), "aria-label": "CLI terminal mode", className: cn("flex items-center gap-1 rounded-md px-2 py-1 text-[12px] leading-none", activeMode === "cli"
                                    ? "bg-accent text-foreground"
                                    : "text-muted-foreground hover:bg-accent/50 hover:text-foreground"), style: AGENT_PANEL_CONTROL_STYLE, children: [_jsx(IconTerminal2, { size: 14 }), "CLI"] }) }), _jsx(TooltipContent, { children: codeAccessEnabled
                                ? "CLI terminal mode"
                                : "Open Desktop to use CLI" })] })), _jsxs(Tooltip, { children: [_jsx(TooltipTrigger, { asChild: true, children: _jsxs("button", { onClick: () => switchMode("resources"), "aria-label": "Workspace files, agents, skills, and tasks", className: cn("flex items-center gap-1 rounded-md px-2 py-1 text-[12px] leading-none", activeMode === "resources"
                                    ? "bg-accent text-foreground"
                                    : "text-muted-foreground hover:bg-accent/50 hover:text-foreground"), style: AGENT_PANEL_CONTROL_STYLE, children: [_jsx(IconLayoutGrid, { size: 14 }), "Workspace"] }) }), _jsx(TooltipContent, { children: codeAccessEnabled
                                ? "Workspace files, agents, skills, and tasks"
                                : "Open Desktop to use Workspace" })] }), _jsxs(Tooltip, { children: [_jsx(TooltipTrigger, { asChild: true, children: _jsx("button", { onClick: () => switchMode("settings"), "aria-label": "Setup and configuration", className: cn("flex items-center justify-center rounded-md px-1.5 py-1", activeMode === "settings"
                                    ? "bg-accent text-foreground"
                                    : "text-muted-foreground hover:bg-accent/50 hover:text-foreground"), children: _jsx(IconSettings, { size: 14 }) }) }), _jsx(TooltipContent, { children: "Setup and configuration" })] })] }) })), [codeAccessEnabled, showCliMode]);
    const renderHeaderActions = useCallback(() => (_jsxs("div", { className: "flex shrink-0 items-center gap-1.5", children: [SHOW_ONBOARDING && canUseCodeTools && (_jsx(Suspense, { fallback: null, children: _jsx(SetupButton, {}) })), _jsx(FeedbackButton, { variant: "icon", side: "bottom", align: "end" }), onToggleFullscreen && (_jsx(IconTooltip, { content: isFullscreen ? "Exit fullscreen" : "Fullscreen", children: _jsx("button", { onClick: onToggleFullscreen, "aria-label": isFullscreen ? "Exit fullscreen" : "Enter fullscreen", className: "flex h-6 w-6 items-center justify-center rounded text-muted-foreground hover:text-foreground hover:bg-accent/50", children: isFullscreen ? (_jsx(IconArrowsMinimize, { size: 14 })) : (_jsx(IconArrowsMaximize, { size: 14 })) }) })), onCollapse && (_jsx(IconTooltip, { content: "Collapse sidebar", children: _jsx("button", { onClick: onCollapse, "aria-label": "Collapse sidebar", className: "flex h-6 w-6 items-center justify-center rounded text-muted-foreground hover:text-foreground hover:bg-accent/50", children: _jsx(IconLayoutSidebarRightCollapse, { size: 14 }) }) }))] })), [onCollapse, canUseCodeTools, onToggleFullscreen, isFullscreen]);
    const [tabMenuOpen, setTabMenuOpen] = useState(null);
    const [cliPickerOpen, setCliPickerOpen] = useState(false);
    // Ref callback: scroll the active tab into view in the overflow container.
    // Uses getBoundingClientRect for reliable positioning regardless of offsetParent.
    const activeTabRefCb = useCallback((el) => {
        if (!el)
            return;
        const container = el.parentElement;
        if (!container)
            return;
        // Use rAF so layout is settled after React commit
        requestAnimationFrame(() => {
            const containerRect = container.getBoundingClientRect();
            const tabRect = el.getBoundingClientRect();
            if (tabRect.left < containerRect.left) {
                container.scrollLeft += tabRect.left - containerRect.left;
            }
            else if (tabRect.right > containerRect.right) {
                container.scrollLeft += tabRect.right - containerRect.right;
            }
        });
    }, []);
    const renderChatHeader = useCallback(({ tabs, activeTabId, setActiveTabId, addTab, closeTab, closeOtherTabs, closeAllTabs, showHistory, toggleHistory, }) => (_jsxs("div", { className: "flex flex-col shrink-0", children: [_jsxs("div", { className: AGENT_PANEL_HEADER_CLASS, style: AGENT_PANEL_HEADER_STYLE, children: [_jsx("div", { className: "flex min-w-0 flex-1 items-center gap-1 overflow-hidden", children: renderModeButtons(mode) }), _jsx("div", { className: "flex items-center gap-0.5", children: renderHeaderActions() })] }), mode === "chat" && chatNotice ? (_jsx("div", { className: "border-b border-border", children: chatNotice })) : null, (mode === "chat" || (mode === "cli" && canUseCodeTools)) &&
                (() => {
                    // Compute parent/child tab groups for the sub-tab bar
                    const activeTab = tabs.find((t) => t.id === activeTabId);
                    // The "focus parent" is the parent thread for the active context
                    const focusParentId = activeTab?.parentThreadId || activeTabId;
                    const childTabs = tabs.filter((t) => t.parentThreadId === focusParentId);
                    const hasSubTabs = childTabs.length > 0;
                    // Main row: only show top-level (non-child) tabs
                    const mainTabs = tabs.filter((t) => !t.parentThreadId);
                    return (_jsxs(_Fragment, { children: [_jsxs("div", { className: "flex items-center px-2 py-1 border-b border-border gap-0.5", children: [_jsx("div", { className: "agent-tabs-scroll flex items-center gap-0.5 min-w-0 overflow-x-auto flex-1", children: mode === "chat"
                                            ? mainTabs.map((tab) => {
                                                // Highlight the parent tab if a child is active
                                                const isActive = tab.id === activeTabId ||
                                                    (tab.id === focusParentId &&
                                                        activeTab?.parentThreadId === tab.id);
                                                return (_jsxs("div", { role: "button", tabIndex: 0, ref: isActive ? activeTabRefCb : undefined, onClick: () => setActiveTabId(tab.id), onKeyDown: activateOnKeyDown(() => setActiveTabId(tab.id)), className: cn("agent-tab relative flex shrink-0 items-center gap-1 rounded-md px-2.5 py-1.5 text-[11px] font-medium cursor-pointer max-w-[150px]", isActive
                                                        ? "bg-accent text-foreground"
                                                        : "text-muted-foreground hover:bg-accent hover:text-foreground"), children: [_jsx("span", { className: "truncate pr-1", children: tab.label }), tab.status === "running" && (_jsx("span", { className: "h-1.5 w-1.5 shrink-0 rounded-full bg-muted-foreground/50 animate-pulse" })), _jsx("button", { type: "button", "aria-label": "Close tab", onClick: (e) => {
                                                                e.stopPropagation();
                                                                closeTab(tab.id);
                                                            }, className: "agent-tab-close flex items-center justify-end text-muted-foreground hover:text-foreground", style: {
                                                                position: "absolute",
                                                                right: 0,
                                                                top: 0,
                                                                bottom: 0,
                                                                width: 28,
                                                                paddingRight: 6,
                                                                borderRadius: "0 6px 6px 0",
                                                                background: "linear-gradient(to right, transparent, hsl(var(--accent)) 40%)",
                                                            }, children: _jsx(IconX, { size: 10 }) })] }, tab.id));
                                            })
                                            : cliTabs.map((id, i) => (_jsxs("div", { role: "button", tabIndex: 0, ref: id === activeCliTab ? activeTabRefCb : undefined, onClick: () => setActiveCliTab(id), onKeyDown: activateOnKeyDown(() => setActiveCliTab(id)), className: cn("agent-tab relative flex shrink-0 items-center gap-1 rounded-md px-2.5 py-1.5 text-[11px] font-medium cursor-pointer", id === activeCliTab
                                                    ? "bg-accent text-foreground"
                                                    : "text-muted-foreground hover:bg-accent hover:text-foreground"), children: [_jsxs("span", { children: ["Terminal ", i + 1] }), _jsx("button", { type: "button", "aria-label": "Close tab", onClick: (e) => {
                                                            e.stopPropagation();
                                                            closeCliTab(id);
                                                        }, className: "agent-tab-close flex items-center justify-end text-muted-foreground hover:text-foreground", style: {
                                                            position: "absolute",
                                                            right: 0,
                                                            top: 0,
                                                            bottom: 0,
                                                            width: 28,
                                                            paddingRight: 6,
                                                            borderRadius: "0 6px 6px 0",
                                                            background: "linear-gradient(to right, transparent, hsl(var(--accent)) 40%)",
                                                        }, children: _jsx(IconX, { size: 10 }) })] }, id))) }), _jsxs("div", { className: "flex items-center gap-0.5 shrink-0 ml-auto", children: [mode === "chat" && (_jsxs(_Fragment, { children: [_jsx(IconTooltip, { content: "New chat", children: _jsx("button", { onClick: addTab, "aria-label": "New chat", className: "flex h-5 w-5 items-center justify-center rounded text-muted-foreground hover:text-foreground hover:bg-accent/50", children: _jsx(IconPlus, { size: 14 }) }) }), toggleHistory && (_jsx(IconTooltip, { content: "All chats", children: _jsx("button", { onClick: toggleHistory, "aria-label": "All chats", className: cn("flex h-5 w-5 items-center justify-center rounded text-muted-foreground hover:text-foreground hover:bg-accent/50", showHistory && "bg-accent text-foreground"), children: _jsx(IconHistory, { size: 14 }) }) })), _jsxs(DropdownMenu, { open: tabMenuOpen === "__chat_global", onOpenChange: (open) => setTabMenuOpen(open ? "__chat_global" : null), children: [_jsx(DropdownMenuTrigger, { asChild: true, children: _jsx("button", { className: cn("flex h-5 w-5 items-center justify-center rounded text-muted-foreground hover:text-foreground hover:bg-accent/50", tabMenuOpen === "__chat_global" &&
                                                                        "bg-accent text-foreground"), "aria-label": "Chat tab options", children: _jsx(IconDotsVertical, { size: 14 }) }) }), _jsxs(DropdownMenuContent, { align: "end", sideOffset: 4, className: "w-44", children: [_jsxs(DropdownMenuItem, { onSelect: () => closeTab(activeTabId), children: ["Close Tab", _jsx(DropdownMenuShortcut, { children: closeTabHint })] }), _jsx(DropdownMenuItem, { onSelect: () => closeOtherTabs(activeTabId), children: "Close Other Tabs" }), _jsxs(DropdownMenuItem, { onSelect: () => closeAllTabs(), children: ["Close All Tabs", _jsx(DropdownMenuShortcut, { children: closeAllTabsHint })] })] })] })] })), mode === "cli" && (_jsxs(_Fragment, { children: [_jsx(IconTooltip, { content: "New terminal", children: _jsx("button", { onClick: addCliTab, "aria-label": "New terminal", className: "flex h-5 w-5 items-center justify-center rounded text-muted-foreground hover:text-foreground hover:bg-accent/50", children: _jsx(IconPlus, { size: 14 }) }) }), availableClis.length > 0 && (_jsxs(DropdownMenu, { open: cliPickerOpen, onOpenChange: setCliPickerOpen, children: [_jsx(DropdownMenuTrigger, { asChild: true, children: _jsx("button", { "aria-label": `Select CLI, currently ${selectedLabel}`, className: cn("flex h-5 w-5 items-center justify-center rounded text-muted-foreground hover:text-foreground hover:bg-accent/50", cliPickerOpen && "bg-accent text-foreground"), children: _jsx(IconSettings, { size: 14 }) }) }), _jsx(DropdownMenuContent, { align: "end", sideOffset: 4, className: "w-48", children: availableClis.map((cli) => (_jsxs(DropdownMenuItem, { onSelect: () => selectCli(cli.command), className: cn(cli.command === selectedCli
                                                                        ? "font-medium"
                                                                        : "text-muted-foreground"), children: [cli.command === selectedCli ? (_jsx(IconCheck, { size: 12, className: "shrink-0" })) : (_jsx("span", { className: "w-3" })), cli.label] }, cli.command))) })] })), _jsxs(DropdownMenu, { open: tabMenuOpen === "__cli_global", onOpenChange: (open) => setTabMenuOpen(open ? "__cli_global" : null), children: [_jsx(DropdownMenuTrigger, { asChild: true, children: _jsx("button", { className: cn("flex h-5 w-5 items-center justify-center rounded text-muted-foreground hover:text-foreground hover:bg-accent/50", tabMenuOpen === "__cli_global" &&
                                                                        "bg-accent text-foreground"), "aria-label": "Terminal tab options", children: _jsx(IconDotsVertical, { size: 14 }) }) }), _jsxs(DropdownMenuContent, { align: "end", sideOffset: 4, className: "w-44", children: [_jsxs(DropdownMenuItem, { onSelect: () => closeCliTab(activeCliTab), children: ["Close Tab", _jsx(DropdownMenuShortcut, { children: closeTabHint })] }), _jsx(DropdownMenuItem, { onSelect: () => closeOtherCliTabs(activeCliTab), children: "Close Other Tabs" }), _jsxs(DropdownMenuItem, { onSelect: () => closeAllCliTabs(), children: ["Close All Tabs", _jsx(DropdownMenuShortcut, { children: closeAllTabsHint })] })] })] })] }))] })] }), mode === "chat" && hasSubTabs && (_jsx("div", { className: "flex items-center px-2 py-0.5 border-b border-border gap-0.5 bg-muted/30", children: _jsxs("div", { className: "agent-tabs-scroll flex items-center gap-0.5 min-w-0 overflow-x-auto flex-1", children: [_jsx("div", { role: "button", tabIndex: 0, onClick: () => setActiveTabId(focusParentId), onKeyDown: activateOnKeyDown(() => setActiveTabId(focusParentId)), className: cn("flex shrink-0 items-center gap-1 rounded-md px-2 py-1 text-[10px] font-medium cursor-pointer", activeTabId === focusParentId
                                                ? "bg-accent text-foreground"
                                                : "text-muted-foreground hover:bg-accent hover:text-foreground"), children: "Main" }), childTabs.map((tab) => (_jsxs("div", { role: "button", tabIndex: 0, ref: tab.id === activeTabId ? activeTabRefCb : undefined, onClick: () => setActiveTabId(tab.id), onKeyDown: activateOnKeyDown(() => setActiveTabId(tab.id)), className: cn("agent-tab relative flex shrink-0 items-center gap-1 rounded-md px-2 py-1 text-[10px] font-medium cursor-pointer max-w-[140px]", tab.id === activeTabId
                                                ? "bg-accent text-foreground"
                                                : "text-muted-foreground hover:bg-accent hover:text-foreground"), children: [_jsx("span", { className: "truncate pr-1", children: tab.subAgentName || tab.label }), tab.status === "running" && (_jsx("span", { className: "h-1 w-1 shrink-0 rounded-full bg-muted-foreground/50 animate-pulse" })), _jsx("button", { type: "button", "aria-label": "Close tab", onClick: (e) => {
                                                        e.stopPropagation();
                                                        closeTab(tab.id);
                                                    }, className: "agent-tab-close flex items-center justify-end text-muted-foreground hover:text-foreground", style: {
                                                        position: "absolute",
                                                        right: 0,
                                                        top: 0,
                                                        bottom: 0,
                                                        width: 24,
                                                        paddingRight: 4,
                                                        borderRadius: "0 6px 6px 0",
                                                        background: "linear-gradient(to right, transparent, hsl(var(--accent)) 40%)",
                                                    }, children: _jsx(IconX, { size: 8 }) })] }, tab.id)))] }) }))] }));
                })()] })), [
        mode,
        renderHeaderActions,
        renderModeButtons,
        chatNotice,
        canUseCodeTools,
        cliTabs,
        activeCliTab,
        addCliTab,
        closeCliTab,
        closeOtherCliTabs,
        closeAllCliTabs,
        tabMenuOpen,
        availableClis,
        selectedCli,
        selectedLabel,
        selectCli,
        cliPickerOpen,
        closeTabHint,
        closeAllTabsHint,
    ]);
    return (_jsxs("div", { className: cn("agent-panel-root flex flex-1 flex-col min-h-0 h-full text-[13px] leading-[1.2] antialiased", className), style: AGENT_PANEL_ROOT_STYLE, "data-agent-fullscreen": isFullscreen ? "true" : undefined, children: [_jsx("style", { dangerouslySetInnerHTML: {
                    __html: ".agent-tab-close{opacity:0}.agent-tab:hover .agent-tab-close{opacity:1}" +
                        ".agent-tabs-scroll{scrollbar-width:none;-ms-overflow-style:none;}" +
                        ".agent-tabs-scroll::-webkit-scrollbar{display:none;}" +
                        `[data-agent-fullscreen='true'] .agent-thread-content,` +
                        `[data-agent-fullscreen='true'] .agent-composer-area{` +
                        `max-width:${FULLSCREEN_CONTENT_MAX_PX}px;` +
                        `margin-left:auto;margin-right:auto;width:100%;}`,
                } }), SHOW_ONBOARDING && mounted && canUseCodeTools && (_jsx(Suspense, { fallback: null, children: _jsx(OnboardingPanel, {}) })), _jsx("div", { className: cn("flex flex-col min-h-0", mode === "chat" ? "flex-1" : "shrink-0"), children: mounted && (_jsx(MultiTabAssistantChat, { apiUrl: apiUrl, showHeader: false, renderHeader: showHeader ? renderChatHeader : undefined, renderOverlay: undefined, contentHidden: mode !== "chat", emptyStateText: emptyStateText, suggestions: suggestions, onSwitchToCli: () => switchMode("cli"), execMode: execMode, onExecModeChange: switchExecMode, storageKey: storageKey, scope: scope })) }), canUseCodeTools
                ? mode === "cli" &&
                    cliTabs.map((id) => (_jsx("div", { className: "min-h-0 relative flex-1", style: {
                            display: id === activeCliTab ? undefined : "none",
                        }, children: _jsx(Suspense, { fallback: _jsx("div", { className: "flex items-center justify-center h-full text-muted-foreground text-sm", children: "Loading terminal..." }), children: _jsx(AgentTerminal, { command: selectedCli, hideInFrame: false, className: "h-full", style: { background: "transparent" } }) }) }, id)))
                : mode === "cli" && (_jsx("div", { className: "flex flex-1 flex-col items-center justify-center min-h-0 px-6 gap-3", children: _jsx(CodeAccessUnavailablePanel, { title: codeAccessEnabled
                            ? "CLI requires dev mode"
                            : codeUnavailableTitle, description: codeAccessEnabled
                            ? "Run this app locally with pnpm dev or use Builder.io to access the CLI terminal."
                            : codeUnavailableDescription, ctaLabel: codeUnavailableCtaLabel, ctaHref: codeAccessEnabled ? undefined : codeUnavailableCtaHref, secondaryCtaLabel: codeUnavailableSecondaryCtaLabel, secondaryCtaHref: codeUnavailableSecondaryCtaHref }) })), mode === "resources" && (_jsx("div", { className: "flex-1 min-h-0", children: codeAccessEnabled ? (_jsx(Suspense, { fallback: _jsx("div", { className: "flex h-full flex-col min-h-0", children: _jsx("div", { className: "flex shrink-0 items-center justify-between border-b border-border px-2 py-1.5", children: _jsxs("div", { className: "flex items-center gap-1", children: [_jsx("div", { className: "h-5 w-16 rounded bg-muted animate-pulse" }), _jsx("div", { className: "h-5 w-14 rounded bg-muted animate-pulse" })] }) }) }), children: _jsx(ResourcesPanel, {}) })) : (_jsx("div", { className: "flex h-full items-center justify-center px-6", children: _jsx(CodeAccessUnavailablePanel, { title: "Open Desktop to use Workspace", description: codeUnavailableDescription, ctaLabel: codeUnavailableCtaLabel, ctaHref: codeUnavailableCtaHref, secondaryCtaLabel: codeUnavailableSecondaryCtaLabel, secondaryCtaHref: codeUnavailableSecondaryCtaHref }) })) })), mode === "settings" && (_jsx("div", { className: "flex flex-col flex-1 min-h-0", children: _jsx(Suspense, { fallback: _jsxs("div", { className: "p-3 space-y-2", children: [_jsx("div", { className: "h-10 w-full rounded-lg bg-muted animate-pulse" }), _jsx("div", { className: "h-10 w-full rounded-lg bg-muted animate-pulse" }), _jsx("div", { className: "h-10 w-full rounded-lg bg-muted animate-pulse" })] }), children: _jsx(SettingsPanel, { isDevMode: isDevMode, onToggleDevMode: () => setDevMode(!isDevMode), showDevToggle: showDevToggle, devAppUrl: devAppUrl, initialSection: settingsSection.section, sectionRequestKey: settingsSection.requestKey }) }) }))] }));
}
// ─── Resize handle ──────────────────────────────────────────────────────────
const SIDEBAR_STORAGE_KEY = "agent-native-sidebar-width";
const SIDEBAR_FULLSCREEN_KEY = "agent-native-sidebar-fullscreen";
const SIDEBAR_MIN = 280;
const SIDEBAR_MAX = 700;
const SIDEBAR_OVERLAY_Z_INDEX = 70;
const SIDEBAR_FULLSCREEN_Z_INDEX = 90;
/** Max width of the centered chat column in fullscreen mode (Claude-style). */
const FULLSCREEN_CONTENT_MAX_PX = 760;
function ResizeHandle({ position, onDrag, }) {
    const ref = useRef(null);
    const dragging = useRef(false);
    const lastX = useRef(0);
    const onDragRef = useRef(onDrag);
    onDragRef.current = onDrag;
    const GRAB_ZONE = 5; // px on each side of the border
    // All drag logic runs via document-level listeners so the 1px-wide
    // element doesn't need to capture pointer events itself.
    useEffect(() => {
        const el = ref.current;
        if (!el)
            return;
        let cursorActive = false;
        function onMouseDown(e) {
            const rect = el.getBoundingClientRect();
            const dist = Math.abs(e.clientX - (rect.left + rect.width / 2));
            if (dist > GRAB_ZONE)
                return;
            e.preventDefault();
            dragging.current = true;
            lastX.current = e.clientX;
            document.body.style.cursor = "col-resize";
            document.body.style.userSelect = "none";
        }
        function onMouseMove(e) {
            if (dragging.current) {
                const delta = e.clientX - lastX.current;
                lastX.current = e.clientX;
                onDragRef.current(position === "left" ? delta : -delta);
                return;
            }
            // Hover cursor
            const rect = el.getBoundingClientRect();
            const dist = Math.abs(e.clientX - (rect.left + rect.width / 2));
            const near = dist <= GRAB_ZONE;
            if (near && !cursorActive) {
                cursorActive = true;
                document.body.style.cursor = "col-resize";
            }
            else if (!near && cursorActive) {
                cursorActive = false;
                document.body.style.cursor = "";
            }
        }
        function onMouseUp() {
            if (!dragging.current)
                return;
            dragging.current = false;
            document.body.style.cursor = "";
            document.body.style.userSelect = "";
        }
        document.addEventListener("mousedown", onMouseDown);
        document.addEventListener("mousemove", onMouseMove);
        document.addEventListener("mouseup", onMouseUp);
        return () => {
            document.removeEventListener("mousedown", onMouseDown);
            document.removeEventListener("mousemove", onMouseMove);
            document.removeEventListener("mouseup", onMouseUp);
            if (cursorActive)
                document.body.style.cursor = "";
        };
    }, [position]);
    return (_jsx("div", { ref: ref, className: cn("relative z-20 shrink-0 w-px touch-none select-none transition-colors", "bg-border hover:bg-accent active:bg-accent"), style: { cursor: "col-resize" } }));
}
/**
 * Remounts its children whenever the framework's `refresh-screen` tool is
 * invoked. Used inside AgentSidebar so the main content area re-fetches
 * without disturbing the chat sidebar's in-flight state.
 *
 * Two mechanisms work together here:
 *
 *  1. Before the remount, every react-query cache entry is marked stale
 *     via `invalidateQueries({ refetchType: "none" })`. This does NOT
 *     trigger a refetch on its own, so active queries elsewhere (chat
 *     sidebar, left nav) keep their current data — they'll refetch only
 *     on their next natural trigger.
 *  2. The React `key` then bumps, unmounting and remounting the subtree.
 *     On remount, child components re-subscribe to their queries, see
 *     the data is stale, and refetch — regardless of configured
 *     `staleTime`. This is what makes the dashboard pick up the agent's
 *     edits even when the query uses `staleTime: 30_000` or similar.
 */
/**
 * Syncs the current URL (pathname + search + hash) to application_state
 * under `__url__`, and processes one-shot URL-update commands the agent
 * writes to `__set_url__`. Lives inside AgentSidebar so every framework
 * template gets URL visibility + URL-write capability for its agent
 * without per-template wiring.
 *
 * Two directions:
 *   UI → state  — on route change, write `{ pathname, search, hash,
 *                 searchParams }` to `__url__`. The production agent reads
 *                 this and includes it in the auto-injected `<current-url>`
 *                 block, so the agent always knows what page the user is
 *                 on, including filter/search params like `?f_date=2026-01`.
 *
 *   state → UI  — the framework's `set-search-params` / `set-url-path`
 *                 tools write a command to `__set_url__`. This hook reads
 *                 the command, applies it via react-router, then deletes
 *                 the key. The UI reacts in one tick, no page reload.
 */
function URLSync() {
    const location = useLocation();
    const navigate = useNavigate();
    const queryClient = useQueryClient();
    // Outbound: write the current URL to app-state whenever it changes.
    React.useEffect(() => {
        const searchParams = {};
        for (const [k, v] of new URLSearchParams(location.search).entries()) {
            searchParams[k] = v;
        }
        const body = {
            pathname: location.pathname,
            search: location.search,
            hash: location.hash,
            searchParams,
        };
        fetch(agentNativePath("/_agent-native/application-state/__url__"), {
            method: "PUT",
            keepalive: true,
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify(body),
        }).catch(() => { });
    }, [location.pathname, location.search, location.hash]);
    // Inbound: poll for URL-update commands from the agent. `useDbSync`
    // invalidates this key on every relevant app-state event, so default
    // `structuralSharing: true` is critical — without it, repeated reads of the
    // same stale command (when the consume-DELETE below races against the next
    // invalidation) churned the useEffect and re-applied the navigation in a
    // tight loop. With structural sharing on, the previous reference is reused
    // when the JSON is unchanged so the useEffect only fires when the command
    // actually changes; the `lastProcessedDedupKeyRef` below covers the residual
    // race window after the cache is cleared to `null`.
    const { data: command } = useQuery({
        queryKey: ["__set_url__"],
        queryFn: async () => {
            try {
                const res = await fetch(agentNativePath("/_agent-native/application-state/__set_url__"));
                if (!res.ok || res.status === 204)
                    return null;
                const text = await res.text();
                if (!text)
                    return null;
                const data = JSON.parse(text);
                return data ?? null;
            }
            catch {
                return null;
            }
        },
        refetchInterval: 2_000,
        retry: false,
    });
    const lastProcessedDedupKeyRef = React.useRef(null);
    React.useEffect(() => {
        if (!command)
            return;
        const cmd = command;
        const dedupKey = cmd._writeId ??
            JSON.stringify({
                pathname: cmd.pathname,
                searchParams: cmd.searchParams,
                mergeSearchParams: cmd.mergeSearchParams,
                hash: cmd.hash,
            });
        if (lastProcessedDedupKeyRef.current === dedupKey) {
            // Same command we already handled — the DELETE below races against the
            // next polling refetch, so when it loses the same command can show up
            // again on the next tick. Re-fire DELETE and bail rather than navigate
            // again.
            fetch(agentNativePath("/_agent-native/application-state/__set_url__"), {
                method: "DELETE",
                headers: { "X-Agent-Native-CSRF": "1" },
            }).catch(() => { });
            queryClient.setQueryData(["__set_url__"], null);
            return;
        }
        lastProcessedDedupKeyRef.current = dedupKey;
        // Delete the one-shot command before applying so duplicate events
        // don't cause repeated navigation.
        fetch(agentNativePath("/_agent-native/application-state/__set_url__"), {
            method: "DELETE",
            headers: { "X-Agent-Native-CSRF": "1" },
        }).catch(() => { });
        try {
            const current = new URL(window.location.href);
            const nextPath = cmd.pathname ?? current.pathname;
            const nextSearch = cmd.mergeSearchParams !== false
                ? new URLSearchParams(current.search)
                : new URLSearchParams();
            if (cmd.searchParams) {
                for (const [k, v] of Object.entries(cmd.searchParams)) {
                    if (v === null || v === "")
                        nextSearch.delete(k);
                    else
                        nextSearch.set(k, v);
                }
            }
            const nextHash = cmd.hash ?? current.hash;
            const qs = nextSearch.toString();
            const url = nextPath + (qs ? `?${qs}` : "") + (nextHash || "");
            // Skip the navigation if the URL is already at the target state —
            // avoids needless react-router work and any revalidation side-effects
            // that come with it.
            // Mark that the agent just wrote the URL so consumers (e.g. a
            // dashboard restoring saved filter defaults) can skip any auto-
            // restore that would clobber the agent's change. Set this BEFORE
            // the same-URL short-circuit — a no-op nav is still an explicit
            // "agent authored this state" signal that consumers depend on.
            try {
                sessionStorage.setItem("__agentUrlAppliedAt__", String(Date.now()));
            }
            catch {
                // sessionStorage unavailable — not fatal.
            }
            const currentUrl = current.pathname + (current.search || "") + (current.hash || "");
            if (url === currentUrl) {
                queryClient.setQueryData(["__set_url__"], null);
                return;
            }
            // Replace rather than push so repeated agent URL updates don't
            // clutter the history stack and can't trigger extra remounts from
            // router navigation lifecycle.
            navigate(url, { replace: true });
        }
        catch {
            // Malformed command — ignore.
        }
        queryClient.setQueryData(["__set_url__"], null);
    }, [command, navigate, queryClient]);
    return null;
}
function ScreenRefreshBoundary({ children }) {
    const key = useScreenRefreshKey();
    const queryClient = useQueryClient();
    const lastKeyRef = React.useRef(key);
    if (key !== lastKeyRef.current) {
        lastKeyRef.current = key;
        // Mark every cached query stale without kicking off a refetch. The
        // subtree-level refetches happen naturally when the new tree mounts
        // below and child components re-subscribe.
        queryClient.invalidateQueries({ refetchType: "none" });
    }
    return _jsx(React.Fragment, { children: children }, key);
}
class AgentPanelErrorBoundary extends React.Component {
    state = { error: null };
    static getDerivedStateFromError(error) {
        return { error };
    }
    componentDidCatch(error, errorInfo) {
        console.error("[agent-native] Agent panel crashed", error, errorInfo);
    }
    render() {
        if (!this.state.error)
            return this.props.children;
        return (_jsxs("div", { className: "flex h-full flex-col items-center justify-center gap-3 p-6 text-center", children: [_jsxs("div", { className: "max-w-[260px] space-y-1", children: [_jsx("p", { className: "text-sm font-medium text-foreground", children: "Agent panel hit an internal UI error." }), _jsx("p", { className: "text-xs leading-relaxed text-muted-foreground", children: "The app is still usable. Reset the panel to reload the chat UI." })] }), _jsx("button", { type: "button", className: "rounded-md border border-border bg-background px-3 py-1.5 text-xs font-medium text-foreground hover:bg-accent", onClick: () => {
                        this.setState({ error: null });
                        this.props.onReset();
                    }, children: "Reset agent panel" })] }));
    }
}
export function AgentPanel(props) {
    const [resetKey, setResetKey] = useState(0);
    const resetPanel = useCallback(() => {
        try {
            const keyPrefix = props.storageKey ? `:${props.storageKey}` : "";
            localStorage.setItem(`agent-native-panel-mode${keyPrefix}`, "chat");
        }
        catch { }
        setResetKey((key) => key + 1);
    }, [props.storageKey]);
    return (_jsx(TooltipProvider, { delayDuration: 200, children: _jsx(AgentPanelErrorBoundary, { onReset: resetPanel, children: _jsx(AgentPanelInner, { ...props }, resetKey) }) }));
}
/**
 * Wraps app content with a toggleable agent sidebar.
 * Use AgentToggleButton in your header to open/close it.
 */
export function AgentSidebar({ children, emptyStateText = "How can I help you?", suggestions, defaultSidebarWidth, sidebarWidth, position = "right", defaultOpen = false, animateMobile = false, scope, }) {
    const initialWidth = defaultSidebarWidth ?? sidebarWidth ?? 380;
    const [open, setOpen] = useState(() => getInitialAgentSidebarOpen(defaultOpen));
    const [presentationMode, setPresentationMode] = useState(false);
    const [width, setWidth] = useState(initialWidth);
    const [fullscreen, setFullscreen] = useState(() => {
        // Force-disable on mobile: a Claude-style centered column makes no sense
        // when the sidebar already covers most of the viewport.
        if (typeof window !== "undefined" &&
            window.matchMedia("(max-width: 767px)").matches) {
            return false;
        }
        try {
            return localStorage.getItem(SIDEBAR_FULLSCREEN_KEY) === "true";
        }
        catch {
            return false;
        }
    });
    // Track mobile viewport so we can switch to overlay mode.
    const [isMobile, setIsMobile] = useState(() => typeof window !== "undefined" &&
        window.matchMedia("(max-width: 767px)").matches);
    useEffect(() => {
        const mq = window.matchMedia("(max-width: 767px)");
        const handler = (e) => setIsMobile(e.matches);
        mq.addEventListener("change", handler);
        return () => mq.removeEventListener("change", handler);
    }, []);
    useEffect(() => {
        try {
            const saved = localStorage.getItem(SIDEBAR_STORAGE_KEY);
            if (saved) {
                const n = parseInt(saved, 10);
                if (n >= SIDEBAR_MIN && n <= SIDEBAR_MAX)
                    setWidth(n);
            }
        }
        catch { }
    }, []);
    const setOpenPersisted = useCallback((next) => {
        setOpen((prev) => {
            const value = typeof next === "function" ? next(prev) : next;
            try {
                localStorage.setItem(SIDEBAR_OPEN_KEY, String(value));
            }
            catch { }
            return value;
        });
    }, []);
    const toggleFullscreen = useCallback(() => {
        setFullscreen((prev) => {
            const next = !prev;
            try {
                localStorage.setItem(SIDEBAR_FULLSCREEN_KEY, String(next));
            }
            catch { }
            return next;
        });
    }, []);
    // Track whether the frame is controlling the sidebar (code mode = frame active).
    // Default to true when inside an iframe — assume the frame sidebar is active
    // until told otherwise. This prevents both sidebars flashing after hot reloads.
    const [frameCodeMode, setFrameCodeMode] = useState(() => typeof window !== "undefined" && window.parent !== window);
    useEffect(() => {
        const toggleHandler = () => {
            if (frameCodeMode && window.parent !== window) {
                // Forward toggle to frame parent — the frame sidebar handles it
                window.parent.postMessage({ type: "agentNative.toggleSidebar" }, parentFrameTargetOrigin());
            }
            else {
                setOpenPersisted((prev) => !prev);
            }
        };
        const openHandler = () => {
            if (frameCodeMode && window.parent !== window) {
                window.parent.postMessage({ type: "agentNative.toggleSidebar", data: { open: true } }, parentFrameTargetOrigin());
            }
            else {
                setOpenPersisted(true);
            }
        };
        const closeHandler = () => {
            if (frameCodeMode && window.parent !== window) {
                window.parent.postMessage({ type: "agentNative.toggleSidebar", data: { open: false } }, parentFrameTargetOrigin());
            }
            else {
                setOpenPersisted(false);
            }
        };
        window.addEventListener("agent-panel:toggle", toggleHandler);
        window.addEventListener("agent-panel:open", openHandler);
        window.addEventListener("agent-panel:close", closeHandler);
        return () => {
            window.removeEventListener("agent-panel:toggle", toggleHandler);
            window.removeEventListener("agent-panel:open", openHandler);
            window.removeEventListener("agent-panel:close", closeHandler);
        };
    }, [setOpenPersisted, frameCodeMode]);
    // Listen for sidebar mode commands from the frame parent.
    // When frame is in "code" mode, hide the app sidebar.
    // When frame is in "app" mode, show the app sidebar, sync width and panel mode.
    useEffect(() => {
        if (window.parent === window)
            return; // Not in an iframe
        function handleMessage(event) {
            if (event.data?.type !== "agentNative.sidebarMode")
                return;
            if (event.source !== window.parent || !isTrustedFrameMessage(event))
                return;
            const { mode, appMode, width: frameWidth, open: frameOpen, } = event.data.data || {};
            if (mode === "code") {
                // Frame is showing its own sidebar — hide the app's
                setFrameCodeMode(true);
                setOpenPersisted(false);
            }
            else if (mode === "app") {
                // Frame deferred to the app — show and sync width + mode
                setFrameCodeMode(false);
                if (frameOpen !== false) {
                    setOpenPersisted(true);
                }
                if (frameWidth &&
                    frameWidth >= SIDEBAR_MIN &&
                    frameWidth <= SIDEBAR_MAX) {
                    setWidth(frameWidth);
                }
                // Sync the panel mode from frame tab selection
                if (appMode === "cli" ||
                    appMode === "resources" ||
                    appMode === "chat") {
                    window.dispatchEvent(new CustomEvent("agent-panel:set-mode", {
                        detail: { mode: appMode },
                    }));
                }
            }
        }
        window.addEventListener("message", handleMessage);
        return () => window.removeEventListener("message", handleMessage);
    }, [setOpenPersisted]);
    // Cmd+I / Ctrl+I to focus the agent chat. If the user has selected text,
    // capture it into application_state under `pending-selection-context` so
    // the agent's next turn includes it as immediate context to act on.
    useEffect(() => {
        const handleKeyDown = (e) => {
            if ((e.metaKey || e.ctrlKey) && e.key === "i") {
                e.preventDefault();
                let selectionText = "";
                try {
                    selectionText = window.getSelection()?.toString().trim() ?? "";
                }
                catch { }
                if (selectionText) {
                    fetch(agentNativePath("/_agent-native/application-state/pending-selection-context"), {
                        method: "PUT",
                        keepalive: true,
                        headers: { "Content-Type": "application/json" },
                        body: JSON.stringify({
                            text: selectionText,
                            capturedAt: Date.now(),
                        }),
                    }).catch(() => { });
                    window.dispatchEvent(new CustomEvent("agent-panel:selection-attached", {
                        detail: { text: selectionText, length: selectionText.length },
                    }));
                }
                focusAgentChat();
            }
        };
        document.addEventListener("keydown", handleKeyDown);
        return () => document.removeEventListener("keydown", handleKeyDown);
    }, []);
    // Hide sidebar during presentation mode
    useEffect(() => {
        const handler = (event) => {
            if (event.data?.type !== "agentNative.presentationMode")
                return;
            if (event.source !== window.parent || !isTrustedFrameMessage(event))
                return;
            setPresentationMode(event.data.data?.active === true);
        };
        window.addEventListener("message", handler);
        return () => window.removeEventListener("message", handler);
    }, []);
    const handleDrag = useCallback((delta) => {
        setWidth((prev) => {
            const next = Math.min(SIDEBAR_MAX, Math.max(SIDEBAR_MIN, prev + delta));
            try {
                localStorage.setItem(SIDEBAR_STORAGE_KEY, String(next));
            }
            catch { }
            return next;
        });
    }, []);
    const isLeft = position === "left";
    // Fullscreen only applies on desktop — on mobile the existing overlay is
    // already viewport-covering, so the maximize button is hidden and the
    // mounted state ignores any persisted value.
    const effectiveFullscreen = fullscreen && !isMobile;
    // On desktop the resize handle is also the visual divider. Avoid painting a
    // second panel border next to it.
    const showResizeHandle = !isMobile && !effectiveFullscreen && open;
    // On mobile the sidebar floats as a fixed overlay so the content below isn't
    // squashed. On desktop it participates in the flex layout as before, except
    // in fullscreen mode where it overlays the entire viewport (Claude-style).
    let panelStyle;
    if (isMobile) {
        panelStyle = {
            ...AGENT_PANEL_ROOT_STYLE,
            position: "fixed",
            top: 0,
            [isLeft ? "left" : "right"]: 0,
            height: "100%",
            width,
            maxWidth: "85vw",
            maxHeight: "100vh",
            zIndex: SIDEBAR_OVERLAY_Z_INDEX,
            background: "hsl(var(--background))",
            borderLeft: isLeft ? "none" : "1px solid hsl(var(--border))",
            borderRight: isLeft ? "1px solid hsl(var(--border))" : "none",
            display: animateMobile || open ? "flex" : "none",
            transform: animateMobile
                ? open
                    ? "translateX(0)"
                    : `translateX(${isLeft ? "-" : ""}calc(100% + 1px))`
                : undefined,
            pointerEvents: animateMobile && !open ? "none" : undefined,
            willChange: animateMobile ? "transform" : undefined,
        };
    }
    else if (effectiveFullscreen) {
        panelStyle = {
            ...AGENT_PANEL_ROOT_STYLE,
            position: "fixed",
            inset: 0,
            width: "100%",
            maxHeight: "100vh",
            zIndex: SIDEBAR_FULLSCREEN_Z_INDEX,
            background: "hsl(var(--background))",
            display: open ? "flex" : "none",
        };
    }
    else {
        panelStyle = {
            ...AGENT_PANEL_ROOT_STYLE,
            width,
            maxHeight: "100vh",
            borderLeft: isLeft || showResizeHandle ? "none" : "1px solid hsl(var(--border))",
            borderRight: !isLeft || showResizeHandle ? "none" : "1px solid hsl(var(--border))",
            display: open ? "flex" : "none",
        };
    }
    // Always render the sidebar panel (even when closed) so MultiTabAssistantChat
    // stays mounted and can receive messages (e.g. from voice dictation) while
    // the sidebar is visually hidden. When the user opens the sidebar they'll see
    // any in-progress or completed conversations.
    const sidebar = (_jsxs(_Fragment, { children: [showResizeHandle && !isLeft && (_jsx(ResizeHandle, { position: position, onDrag: handleDrag })), _jsx("div", { className: cn("agent-sidebar-panel flex shrink-0 flex-col overflow-hidden text-[13px] leading-[1.2] antialiased", animateMobile &&
                    isMobile &&
                    "shadow-2xl transition-transform duration-[260ms] ease-[cubic-bezier(0.32,0.72,0,1)] motion-reduce:transition-none"), style: panelStyle, inert: isMobile && !open ? true : undefined, "aria-hidden": isMobile && !open ? true : undefined, children: _jsx(AgentPanel, { emptyStateText: emptyStateText, suggestions: suggestions, onCollapse: () => setOpenPersisted(false), isFullscreen: effectiveFullscreen, onToggleFullscreen: isMobile ? undefined : toggleFullscreen, scope: scope }) }), showResizeHandle && isLeft && (_jsx(ResizeHandle, { position: position, onDrag: handleDrag }))] }));
    return (_jsxs("div", { className: "flex min-w-0 flex-1 h-screen overflow-hidden", children: [isMobile && !presentationMode && (animateMobile || open) && (_jsx("div", { className: cn("fixed inset-0 bg-black/40", animateMobile &&
                    "transition-opacity duration-200 motion-reduce:transition-none", animateMobile && !open && "pointer-events-none opacity-0", animateMobile && open && "opacity-100"), style: { zIndex: SIDEBAR_OVERLAY_Z_INDEX - 1 }, onClick: () => setOpenPersisted(false) })), _jsx(URLSync, {}), isLeft && !presentationMode ? sidebar : null, _jsx("div", { className: "flex flex-1 flex-col overflow-auto min-w-0", children: _jsx(ScreenRefreshBoundary, { children: children }) }), !isLeft && !presentationMode ? sidebar : null] }));
}
/**
 * Focus the agent chat composer input.
 * Opens the sidebar if closed, then focuses the text input.
 */
export function focusAgentChat() {
    window.dispatchEvent(new Event("agent-panel:open"));
    // Wait for sidebar to render, then focus the composer
    requestAnimationFrame(() => {
        const panel = document.querySelector(".agent-sidebar-panel");
        if (!panel)
            return;
        const prosemirror = panel.querySelector(".ProseMirror");
        if (prosemirror) {
            prosemirror.focus();
            return;
        }
        const textarea = panel.querySelector("textarea");
        if (textarea)
            textarea.focus();
    });
}
/**
 * Button to toggle the agent sidebar. Place this in your app's header/toolbar.
 * Dispatches a custom event that AgentSidebar listens for.
 */
export function AgentToggleButton({ className }) {
    return (_jsx(TooltipProvider, { delayDuration: 200, children: _jsxs(Tooltip, { children: [_jsx(TooltipTrigger, { asChild: true, children: _jsx("button", { type: "button", "aria-label": "Toggle agent", onClick: () => window.dispatchEvent(new Event("agent-panel:toggle")), className: cn("inline-flex h-8 w-8 shrink-0 items-center justify-center rounded-md text-muted-foreground transition-colors hover:bg-accent/40 hover:text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring", className), children: _jsx(IconMessageDots, { size: 20, "aria-hidden": true }) }) }), _jsx(TooltipContent, { children: "Toggle agent" })] }) }));
}
//# sourceMappingURL=AgentPanel.js.map