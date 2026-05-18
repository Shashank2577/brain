import { jsx as _jsx, jsxs as _jsxs, Fragment as _Fragment } from "react/jsx-runtime";
import { agentNativePath } from "../api-path.js";
import { Suspense, lazy, useState, useEffect, useCallback, useRef, } from "react";
import * as SelectPrimitive from "@radix-ui/react-select";
import { IconChevronDown, IconCheck, IconExternalLink, IconBrain, IconBrowser, IconGitBranch, IconCloud, IconDatabase, IconShield, IconPlugConnected, IconTopologyRing2, IconLoader2, IconUpload, IconCoin, IconMail, IconKey, IconMicrophone, IconEyeOff, IconBolt, IconGauge, IconUserCircle, IconApps, } from "@tabler/icons-react";
import { SettingsSection } from "./SettingsSection.js";
import { useBuilderConnectFlow, useBuilderStatus, } from "./useBuilderStatus.js";
import { BuilderBMark } from "../builder-mark.js";
import { AgentsSection } from "./AgentsSection.js";
import { UsageSection } from "./UsageSection.js";
import { SecretsSection } from "./SecretsSection.js";
import { VoiceTranscriptionSection } from "./VoiceTranscriptionSection.js";
import { DemoModeSection } from "./DemoModeSection.js";
import { AutomationsSection } from "./AutomationsSection.js";
import { PROVIDER_ENV_PLACEHOLDERS } from "../../agent/engine/provider-env-vars.js";
import { Tooltip, TooltipContent, TooltipTrigger, } from "../components/ui/tooltip.js";
import { useSession } from "../use-session.js";
import { uploadAvatar, useAvatarUrl } from "../use-avatar.js";
const IntegrationsPanel = lazy(() => import("../integrations/IntegrationsPanel.js").then((m) => ({
    default: m.IntegrationsPanel,
})));
// ─── Shared helpers ─────────────────────────────────────────────────────────
function SettingsSkeleton({ lines = 3 }) {
    return (_jsx("div", { className: "space-y-3 animate-pulse", children: Array.from({ length: lines }, (_, i) => (_jsxs("div", { className: "space-y-1.5", children: [_jsx("div", { className: "h-3 rounded bg-muted-foreground/10", style: { width: i === 0 ? "30%" : i === 1 ? "100%" : "60%" } }), i < 2 && (_jsx("div", { className: "h-9 rounded-md border border-border bg-muted-foreground/5" }))] }, i))) }));
}
const CONTROL_STYLE = {
    fontSize: 12,
    lineHeight: 1,
};
function SettingsSelect({ label, labelAdornment, value, options, onValueChange, }) {
    const selected = options.find((option) => option.value === value);
    return (_jsxs("div", { className: "space-y-1.5", children: [_jsxs("div", { className: "flex items-center justify-between", children: [_jsx("p", { className: "text-[12px] font-medium text-foreground", children: label }), labelAdornment] }), _jsxs(SelectPrimitive.Root, { value: value, onValueChange: onValueChange, children: [_jsxs(SelectPrimitive.Trigger, { className: "flex h-9 w-full items-center justify-between rounded-md border border-border bg-background px-3 text-left text-[12px] text-foreground outline-none transition-colors hover:bg-accent/40 data-[placeholder]:text-muted-foreground", "aria-label": label, style: CONTROL_STYLE, children: [_jsx(SelectPrimitive.Value, { children: selected?.label ?? value }), _jsx(SelectPrimitive.Icon, { asChild: true, children: _jsx(IconChevronDown, { size: 14, className: "text-muted-foreground" }) })] }), _jsx(SelectPrimitive.Portal, { children: _jsx(SelectPrimitive.Content, { position: "popper", sideOffset: 6, className: "z-[9999] w-[var(--radix-select-trigger-width)] overflow-hidden rounded-lg border border-border bg-popover shadow-lg", children: _jsx(SelectPrimitive.Viewport, { className: "p-1", children: options.map((option) => (_jsxs(SelectPrimitive.Item, { value: option.value, className: "relative flex w-full cursor-pointer select-none items-start gap-2 rounded-md px-8 py-2.5 text-[12px] outline-none data-[highlighted]:bg-accent/60 data-[state=checked]:bg-accent/40", style: CONTROL_STYLE, children: [_jsx("span", { className: "absolute left-2 top-2.5 flex h-4 w-4 items-center justify-center text-muted-foreground", children: _jsx(SelectPrimitive.ItemIndicator, { children: _jsx(IconCheck, { size: 14 }) }) }), _jsxs("div", { className: "flex min-w-0 flex-col", children: [_jsx(SelectPrimitive.ItemText, { children: _jsx("span", { className: "text-foreground", children: option.label }) }), option.description ? (_jsx("span", { className: "mt-0.5 text-[11px] leading-relaxed text-muted-foreground", children: option.description })) : null] })] }, option.value))) }) }) })] })] }));
}
// ─── Disconnect button for the Builder card's connected state ───────────────
//
// Two-step confirmation: first click arms the button ("Confirm?"), second
// click actually disconnects. Arm auto-reverts after 4s of idle so a user
// who wandered off doesn't come back to a disconnect waiting for them.
//
// Hits /_agent-native/builder/disconnect which removes request-scoped
// Builder credentials from app_secrets. Deployment env credentials are left
// alone and remain as fallback. On success we dispatch
// `agent-engine:configured-changed` so dependent cards refresh inline.
function DisconnectBuilderButton() {
    const { status } = useBuilderStatus();
    const [phase, setPhase] = useState("idle");
    const [err, setErr] = useState(null);
    const armedTimerRef = useRef(null);
    const clearArmedTimer = useCallback(() => {
        if (armedTimerRef.current) {
            clearTimeout(armedTimerRef.current);
            armedTimerRef.current = null;
        }
    }, []);
    useEffect(() => {
        return () => clearArmedTimer();
    }, [clearArmedTimer]);
    const performDisconnect = useCallback(async () => {
        setPhase("busy");
        setErr(null);
        clearArmedTimer();
        try {
            const res = await fetch(agentNativePath("/_agent-native/builder/disconnect"), {
                method: "POST",
                headers: { "Content-Type": "application/json" },
            });
            // Parse defensively — a nitro 404 fallback returns HTML, not JSON,
            // and res.json() on that would throw.
            const text = await res.text();
            let body = {};
            if (text) {
                try {
                    body = JSON.parse(text);
                }
                catch {
                    // Non-JSON response — likely a 404/HTML fallback.
                }
            }
            if (!res.ok) {
                throw new Error(body.error || `Failed (${res.status}). Is dev:all up to date?`);
            }
            if (body.ok !== true) {
                throw new Error(body.error || "Disconnect didn't confirm ok");
            }
            if (body.warnings && Object.keys(body.warnings).length > 0) {
                // Disconnect flag persisted (we only reach here when ok:true), so
                // the user IS disconnected — but some ancillary cleanup failed.
                // Log so it's visible during dev; don't block the success path.
                console.warn("[builder-disconnect] completed with warnings:", body.warnings);
            }
            window.dispatchEvent(new CustomEvent("agent-engine:configured-changed"));
            setPhase("idle");
        }
        catch (e) {
            setErr(e instanceof Error ? e.message : "Disconnect failed");
            setPhase("idle");
        }
    }, [clearArmedTimer]);
    const handleDisconnectClick = useCallback(() => {
        if (phase === "busy")
            return;
        if (phase === "idle") {
            // First click — arm the button. Auto-revert after 4s to avoid a
            // stale "confirm" state someone else could hit by accident.
            setPhase("armed");
            setErr(null);
            clearArmedTimer();
            armedTimerRef.current = setTimeout(() => {
                setPhase("idle");
                armedTimerRef.current = null;
            }, 4000);
            return;
        }
        // phase === "armed" — user confirmed, actually disconnect.
        void performDisconnect();
    }, [phase, performDisconnect, clearArmedTimer]);
    const handleCancel = useCallback(() => {
        clearArmedTimer();
        setPhase("idle");
    }, [clearArmedTimer]);
    // When only the deploy fallback is active there is nothing request-scoped
    // for this button to remove. The early return MUST come after every hook
    // above to satisfy rules-of-hooks.
    if (status?.credentialSource === "env")
        return null;
    if (phase === "armed") {
        return (_jsxs(_Fragment, { children: [_jsx("button", { type: "button", onClick: handleDisconnectClick, className: "inline-flex items-center gap-1 rounded border border-destructive/40 bg-destructive/10 px-2 py-0.5 text-[10px] font-medium text-destructive hover:bg-destructive/20", children: "Confirm disconnect" }), _jsx("button", { type: "button", onClick: handleCancel, className: "inline-flex items-center gap-1 rounded border border-border px-2 py-0.5 text-[10px] text-muted-foreground hover:text-foreground hover:bg-accent/40", children: "Cancel" })] }));
    }
    return (_jsxs(_Fragment, { children: [_jsx("button", { type: "button", onClick: handleDisconnectClick, disabled: phase === "busy", className: "inline-flex items-center gap-1 rounded border border-border px-2 py-0.5 text-[10px] text-muted-foreground hover:text-foreground hover:bg-accent/40 disabled:opacity-60 disabled:cursor-wait", "aria-busy": phase === "busy", children: phase === "busy" ? (_jsxs(_Fragment, { children: [_jsx(IconLoader2, { size: 10, className: "animate-spin" }), "Disconnecting\u2026"] })) : ("Disconnect") }), err && _jsx("span", { className: "text-[10px] text-destructive", children: err })] }));
}
// ─── "Connect Builder.io" card (shared across all sections) ─────────────────
function UseBuilderCard({ builderFlow, connectUrl, connected, orgName, envManaged, credentialSource, trackingSource = "settings_panel_builder_card", trackingFlow = "connect_llm", label = "Connect Builder.io", subtitle = "Free credits to start — no API key needed.", dim, }) {
    const effectiveConnected = connected || builderFlow.configured;
    const effectiveOrgName = builderFlow.orgName ?? orgName;
    const bgClass = dim ? "" : "bg-accent/30";
    if (effectiveConnected) {
        return (_jsxs("div", { className: `rounded-md border border-border px-2.5 py-2 ${bgClass}`, children: [_jsxs("div", { className: "flex items-center justify-between", children: [_jsx("div", { className: "text-[11px] font-medium text-foreground", children: "Builder.io" }), _jsxs("span", { className: "flex items-center gap-1 text-[10px] text-green-500", children: [_jsx(IconCheck, { size: 10 }), "Connected"] })] }), effectiveOrgName && (_jsx("p", { className: "text-[10px] text-muted-foreground mt-0.5", children: effectiveOrgName })), envManaged ? (_jsx("p", { className: "text-[10px] text-muted-foreground mt-1", children: credentialSource === "env"
                        ? "Deployment fallback is available. Connect your own account to override it."
                        : "Using your connected Builder account. Deployment fallback is still available." })) : null, connectUrl || credentialSource !== "env" ? (_jsxs("div", { className: "flex items-center gap-2 mt-2.5", children: [connectUrl && (_jsxs("button", { type: "button", onClick: () => builderFlow.start({ trackingSource, trackingFlow }), disabled: builderFlow.connecting, className: "inline-flex items-center gap-1 rounded border border-border px-2 py-0.5 text-[10px] no-underline text-muted-foreground hover:text-foreground hover:bg-accent/40 disabled:opacity-60", children: [builderFlow.connecting
                                    ? "Connecting..."
                                    : credentialSource === "env"
                                        ? "Connect account"
                                        : "Reconnect", _jsx(IconExternalLink, { size: 10 })] })), credentialSource !== "env" ? _jsx(DisconnectBuilderButton, {}) : null] })) : null] }));
    }
    if (!connectUrl)
        return null;
    return (_jsx("button", { type: "button", onClick: () => builderFlow.start({ trackingSource, trackingFlow }), disabled: builderFlow.connecting, className: `block w-full rounded-md border border-border px-3 py-3 text-left no-underline bg-gradient-to-br from-teal-500/10 via-transparent to-transparent hover:border-foreground/30 transition-colors disabled:cursor-wait disabled:opacity-70`, children: _jsxs("div", { className: "flex items-start gap-2.5", children: [_jsx("div", { className: "flex h-7 w-7 shrink-0 items-center justify-center rounded-md bg-foreground text-background", children: _jsx(BuilderBMark, { className: "h-3.5 w-3.5" }) }), _jsxs("div", { className: "flex-1 min-w-0", children: [_jsxs("div", { className: "flex items-center gap-1.5 flex-wrap", children: [_jsx("span", { className: "text-[12px] font-semibold text-foreground", children: builderFlow.connecting ? "Connecting Builder.io..." : label }), builderFlow.connecting && (_jsx(IconLoader2, { size: 12, className: "shrink-0 animate-spin text-muted-foreground" }))] }), _jsx("p", { className: "text-[10.5px] text-muted-foreground mt-0.5 leading-snug", children: subtitle }), builderFlow.error && (_jsx("p", { className: "mt-1 text-[10px] text-destructive", children: builderFlow.error }))] }), _jsx(IconExternalLink, { size: 12, className: "shrink-0 text-muted-foreground mt-0.5" })] }) }));
}
// ─── Manual setup card ──────────────────────────────────────────────────────
function ManualSetupCard({ hint, docsUrl, docsLabel = "Read the docs", children, dim, sourceBadge, }) {
    return (_jsxs("div", { className: `rounded-md border border-border px-2.5 py-2 ${dim ? "" : "bg-accent/30"}`, children: [_jsxs("div", { className: "flex items-center justify-between mb-1", children: [_jsx("div", { className: "text-[11px] font-medium text-foreground", children: "Set up manually" }), sourceBadge ? (_jsxs("span", { className: "flex items-center gap-1 text-[10px] text-green-500", children: [_jsx(IconCheck, { size: 10 }), sourceBadge] })) : null] }), hint && (_jsx("p", { className: "text-[10px] text-muted-foreground mb-1.5", children: hint })), children, docsUrl && (_jsxs("a", { href: docsUrl, target: "_blank", rel: "noopener noreferrer", className: "inline-flex items-center gap-1 mt-1.5 rounded border border-border px-2.5 py-1 text-[10px] font-medium no-underline text-muted-foreground hover:text-foreground hover:bg-accent/40", children: [docsLabel, _jsx(IconExternalLink, { size: 10 })] }))] }));
}
// ─── LLM helpers ────────────────────────────────────────────────────────────
function friendlyModelName(model) {
    const claude = model.match(/^claude-(opus|sonnet|haiku)-(\d+)-(\d+)(?:-\d{8,})?$/);
    if (claude) {
        const tier = claude[1][0].toUpperCase() + claude[1].slice(1);
        return `${tier} ${claude[2]}.${claude[3]}`;
    }
    if (model.startsWith("gpt-"))
        return `GPT-${model.slice(4)}`;
    if (/^o\d/.test(model))
        return model;
    const gemini = model.match(/^gemini-(.+?)(?:-preview)?$/);
    if (gemini) {
        const parts = gemini[1]
            .split("-")
            .map((s) => s[0].toUpperCase() + s.slice(1))
            .join(" ");
        return `Gemini ${parts}${model.endsWith("-preview") ? " (preview)" : ""}`;
    }
    return model;
}
function computeSourceBadge(args) {
    const { settingsConfigured, settingsStatus } = args;
    if (args.builderConnected)
        return "Connected via Builder";
    if (settingsConfigured) {
        if (settingsStatus?.source === "env") {
            return `Connected via ${settingsStatus.envVar ?? args.envVar ?? "env"}`;
        }
        return "Connected via template (server-side)";
    }
    if (args.envConfigured)
        return `Connected via ${args.envVar ?? "env"}`;
    return undefined;
}
function latestModelsOnly(models) {
    const seen = new Set();
    return models.filter((m) => {
        const claude = m.match(/^claude-(opus|sonnet|haiku)-/);
        if (claude) {
            if (seen.has(claude[1]))
                return false;
            seen.add(claude[1]);
            return true;
        }
        const gemini = m.match(/^gemini-(\d+(?:\.\d+)?)-(.+?)(?:-preview)?$/);
        if (gemini) {
            const family = gemini[2];
            if (seen.has(`gemini-${family}`))
                return false;
            seen.add(`gemini-${family}`);
            return true;
        }
        return true;
    });
}
const PROVIDER_DOCS = {
    anthropic: "https://console.anthropic.com/settings/keys",
    "ai-sdk:anthropic": "https://console.anthropic.com/settings/keys",
    "ai-sdk:openai": "https://platform.openai.com/api-keys",
    "ai-sdk:google": "https://aistudio.google.com/apikey",
    "ai-sdk:openrouter": "https://openrouter.ai/keys",
    "ai-sdk:groq": "https://console.groq.com/keys",
    "ai-sdk:mistral": "https://console.mistral.ai/api-keys/",
    "ai-sdk:cohere": "https://dashboard.cohere.com/api-keys",
};
function LLMSectionInner({ builderFlow, builderLoading, connectUrl, connected, orgName, envManaged, credentialSource, open, onToggle, }) {
    const [envKeys, setEnvKeys] = useState([]);
    const [apiKey, setApiKey] = useState("");
    const [saving, setSaving] = useState(false);
    const [saved, setSaved] = useState(false);
    const [engines, setEngines] = useState([]);
    const [currentEngine, setCurrentEngine] = useState("anthropic");
    const [currentModel, setCurrentModel] = useState("");
    const [selectedEngine, setSelectedEngine] = useState("anthropic");
    const [selectedModel, setSelectedModel] = useState("");
    const [applyNote, setApplyNote] = useState(false);
    const [testing, setTesting] = useState(false);
    const [testResult, setTestResult] = useState(null);
    const [settingsStatus, setSettingsStatus] = useState(null);
    const [disconnectError, setDisconnectError] = useState(null);
    const [envLoaded, setEnvLoaded] = useState(false);
    const [enginesLoaded, setEnginesLoaded] = useState(false);
    const [statusLoaded, setStatusLoaded] = useState(false);
    const initialLoading = !envLoaded || !enginesLoaded || !statusLoaded || !!builderLoading;
    useEffect(() => {
        fetch(agentNativePath("/_agent-native/env-status"))
            .then((r) => (r.ok ? r.json() : []))
            .then(setEnvKeys)
            .catch(() => { })
            .finally(() => setEnvLoaded(true));
    }, [saved]);
    const notifyConfigChanged = useCallback(() => {
        window.dispatchEvent(new CustomEvent("agent-engine:configured-changed"));
    }, []);
    const refreshSettingsStatus = useCallback(() => {
        fetch(agentNativePath("/_agent-native/agent-engine/status"))
            .then((r) => (r.ok ? r.json() : null))
            .then((data) => {
            if (data?.configured &&
                typeof data.engine === "string" &&
                (data.source === "env" || data.source === "settings")) {
                setSettingsStatus({
                    engine: data.engine,
                    source: data.source,
                    envVar: typeof data.envVar === "string" ? data.envVar : null,
                });
            }
            else {
                setSettingsStatus(null);
            }
        })
            .catch(() => { })
            .finally(() => setStatusLoaded(true));
    }, []);
    useEffect(() => {
        refreshSettingsStatus();
    }, [refreshSettingsStatus]);
    useEffect(() => {
        fetch(agentNativePath("/_agent-native/actions/manage-agent-engine"), {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ action: "list" }),
        })
            .then((r) => (r.ok ? r.json() : null))
            .then((data) => {
            if (!data)
                return;
            setEngines(data.engines ?? []);
            const cur = data.current ?? {};
            setCurrentEngine(cur.engine ?? "anthropic");
            setCurrentModel(cur.model ?? "");
            setSelectedEngine(cur.engine ?? "anthropic");
            setSelectedModel(cur.model ?? "");
        })
            .catch(() => { })
            .finally(() => setEnginesLoaded(true));
    }, []);
    const selectedEngineInfo = engines.find((e) => e.name === selectedEngine);
    const envVar = selectedEngineInfo?.requiredEnvVars?.[0];
    const envConfigured = envVar
        ? (envKeys.find((k) => k.key === envVar)?.configured ?? false)
        : false;
    const settingsConfigured = settingsStatus != null && settingsStatus.engine === currentEngine;
    const builderConnected = connected || builderFlow.configured;
    const anyKeyConfigured = envConfigured || builderConnected || settingsConfigured;
    const sourceBadge = computeSourceBadge({
        settingsConfigured,
        settingsStatus,
        envConfigured,
        envVar,
        builderConnected,
    });
    const engineChanged = selectedEngine !== currentEngine || selectedModel !== currentModel;
    // Hide the Anthropic-via-AI-SDK alias (redundant with the native entry)
    // and Ollama (no API key to set here). The currently-selected engine is
    // always kept so a stale setting doesn't vanish from the picker.
    const providerOptions = engines
        .filter((e) => e.name === selectedEngine ||
        (e.name !== "ai-sdk:anthropic" && e.name !== "ai-sdk:ollama"))
        .map((e) => ({ value: e.name, label: e.label }));
    const modelOptions = latestModelsOnly(selectedEngineInfo?.supportedModels ?? []).map((m) => ({ value: m, label: friendlyModelName(m) }));
    const handleSave = async () => {
        if (!apiKey.trim() || !envVar)
            return;
        setSaving(true);
        try {
            const res = await fetch(agentNativePath("/_agent-native/env-vars"), {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({
                    vars: [{ key: envVar, value: apiKey.trim() }],
                }),
            });
            if (res.ok) {
                setSaved(true);
                setApiKey("");
                refreshSettingsStatus();
                notifyConfigChanged();
                setTimeout(() => setSaved(false), 2000);
            }
        }
        finally {
            setSaving(false);
        }
    };
    const handleDisconnect = async () => {
        setDisconnectError(null);
        try {
            const res = await fetch(agentNativePath("/_agent-native/agent-engine/disconnect"), {
                method: "POST",
            });
            if (res.ok) {
                setTestResult(null);
                setApplyNote(false);
                refreshSettingsStatus();
                notifyConfigChanged();
                return;
            }
            const body = (await res.json().catch(() => null));
            setDisconnectError(body?.error ??
                (res.status === 401
                    ? "You must be signed in to disconnect."
                    : `Disconnect failed (HTTP ${res.status})`));
        }
        catch (err) {
            setDisconnectError(err instanceof Error ? err.message : String(err));
        }
    };
    const handleTest = async () => {
        setTesting(true);
        setTestResult(null);
        try {
            const res = await fetch(agentNativePath("/_agent-native/actions/manage-agent-engine"), {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({
                    action: "test",
                    engine: selectedEngine,
                    model: selectedModel || selectedEngineInfo?.defaultModel,
                }),
            });
            // The action endpoint wraps tool output; some paths return the JSON
            // string as-is, others wrap in { result }. Accept either shape.
            const data = await res.json();
            const parsed = typeof data === "string"
                ? JSON.parse(data)
                : typeof data?.result === "string"
                    ? JSON.parse(data.result)
                    : data;
            if (parsed?.ok) {
                setTestResult({
                    ok: true,
                    latencyMs: parsed.latencyMs ?? 0,
                    model: parsed.model ?? selectedModel,
                });
            }
            else {
                setTestResult({
                    ok: false,
                    error: parsed?.error ?? "Test failed (no error message)",
                });
            }
        }
        catch (err) {
            setTestResult({
                ok: false,
                error: err instanceof Error ? err.message : String(err),
            });
        }
        finally {
            setTesting(false);
        }
    };
    const handleApply = async () => {
        try {
            const res = await fetch(agentNativePath("/_agent-native/actions/manage-agent-engine"), {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({
                    action: "set",
                    engine: selectedEngine,
                    model: selectedModel,
                }),
            });
            if (res.ok) {
                setCurrentEngine(selectedEngine);
                setCurrentModel(selectedModel);
                setApplyNote(true);
                refreshSettingsStatus();
                notifyConfigChanged();
                setTimeout(() => setApplyNote(false), 4000);
            }
        }
        catch { }
    };
    return (_jsx(SettingsSection, { icon: _jsx(IconBrain, { size: 14 }), title: "LLM", subtitle: "Connect any major LLM \u2014 Claude, GPT, Gemini, and more.", required: true, connected: initialLoading ? undefined : anyKeyConfigured, open: open, onToggle: onToggle, children: initialLoading ? (_jsx(SettingsSkeleton, { lines: 3 })) : (_jsxs("div", { className: "space-y-2", children: [_jsx(UseBuilderCard, { builderFlow: builderFlow, connectUrl: connectUrl, connected: connected, orgName: orgName, envManaged: envManaged, credentialSource: credentialSource, trackingSource: "llm_settings", trackingFlow: "connect_llm", label: "Connect Builder.io" }), !builderConnected && (_jsx(ManualSetupCard, { hint: "Choose your AI provider and model.", docsUrl: PROVIDER_DOCS[selectedEngine], sourceBadge: sourceBadge, docsLabel: "Get an API key", children: _jsxs("div", { className: "space-y-2 mb-1", children: [_jsx(SettingsSelect, { label: "Provider", value: selectedEngine, options: providerOptions, onValueChange: (val) => {
                                    setSelectedEngine(val);
                                    const info = engines.find((e) => e.name === val);
                                    setSelectedModel(info?.defaultModel ?? "");
                                    setApiKey("");
                                } }), _jsxs("div", { className: "space-y-1.5", children: [_jsx("p", { className: "text-[12px] font-medium text-foreground", children: "Model" }), _jsx("input", { type: "text", list: `model-suggestions-${selectedEngine}`, value: selectedModel, onChange: (e) => setSelectedModel(e.target.value), placeholder: selectedEngineInfo?.defaultModel ?? "e.g. model-id", spellCheck: false, autoComplete: "off", className: "flex h-9 w-full rounded-md border border-border bg-background px-3 text-[12px] text-foreground outline-none transition-colors hover:bg-accent/40 focus:ring-1 focus:ring-accent placeholder:text-muted-foreground/50", style: CONTROL_STYLE }), modelOptions.length > 0 && (_jsx("datalist", { id: `model-suggestions-${selectedEngine}`, children: modelOptions.map((opt) => (_jsx("option", { value: opt.value, label: opt.label }, opt.value))) }))] }), envVar && envConfigured ? (_jsxs("div", { className: "flex items-center gap-1.5 text-[10px] text-green-500", children: [_jsx(IconCheck, { size: 10 }), envVar, " configured"] })) : envVar ? (_jsxs("div", { className: "flex gap-1.5", children: [_jsx("input", { type: "password", value: apiKey, onChange: (e) => setApiKey(e.target.value), onKeyDown: (e) => {
                                            if (e.key === "Enter")
                                                handleSave();
                                        }, placeholder: PROVIDER_ENV_PLACEHOLDERS[envVar] ?? "...", className: "flex-1 rounded border border-border bg-background px-2 py-1 text-[11px] text-foreground outline-none placeholder:text-muted-foreground/50 focus:ring-1 focus:ring-accent" }), _jsx("button", { onClick: handleSave, disabled: !apiKey.trim() || saving, className: "rounded bg-accent px-2 py-1 text-[10px] font-medium text-foreground hover:bg-accent/80 disabled:opacity-40", children: saving ? (_jsx(IconLoader2, { size: 10, className: "animate-spin" })) : saved ? (_jsx(IconCheck, { size: 10 })) : ("Save") })] })) : null, _jsxs("div", { className: "flex items-center gap-2", children: [_jsx("button", { onClick: handleTest, disabled: testing, className: "rounded border border-border px-2.5 py-1 text-[10px] font-medium text-foreground hover:bg-accent/40 disabled:opacity-40", children: testing ? (_jsxs("span", { className: "flex items-center gap-1", children: [_jsx(IconLoader2, { size: 10, className: "animate-spin" }), "Testing\u2026"] })) : ("Test") }), engineChanged && (_jsx("button", { onClick: handleApply, className: "rounded bg-accent px-2.5 py-1 text-[10px] font-medium text-foreground hover:bg-accent/80", children: "Apply" })), settingsStatus != null && (_jsxs(Tooltip, { children: [_jsx(TooltipTrigger, { asChild: true, children: _jsx("button", { onClick: handleDisconnect, className: "ml-auto rounded border border-border px-2.5 py-1 text-[10px] font-medium text-muted-foreground hover:bg-destructive/10 hover:text-destructive hover:border-destructive/40", children: "Disconnect" }) }), _jsx(TooltipContent, { children: "Clear the saved engine \u2014 the app will fall back to the default until you re-apply." })] }))] }), testResult && testResult.ok && (_jsxs("p", { className: "flex items-center gap-1 text-[10px] text-green-500", children: [_jsx(IconCheck, { size: 10 }), "Test passed \u2014 ", testResult.latencyMs, "ms"] })), testResult && testResult.ok === false && (_jsxs("p", { className: "text-[10px] text-destructive", children: ["Test failed: ", testResult.error] })), disconnectError && (_jsxs("p", { className: "text-[10px] text-destructive", children: ["Disconnect failed: ", disconnectError] })), applyNote && (_jsx("p", { className: "text-[10px] text-muted-foreground", children: "Changes take effect on next conversation" }))] }) }))] })) }));
}
function friendlyAppName(appId) {
    return appId
        .split("-")
        .filter(Boolean)
        .map((part) => part[0]?.toUpperCase() + part.slice(1))
        .join(" ");
}
function AppModelDefaultsSectionInner({ open, onToggle, }) {
    const [settings, setSettings] = useState(null);
    const [selectedEngine, setSelectedEngine] = useState("");
    const [selectedModel, setSelectedModel] = useState("");
    const [loading, setLoading] = useState(true);
    const [saving, setSaving] = useState(false);
    const [saved, setSaved] = useState(false);
    const [error, setError] = useState(null);
    const load = useCallback(() => {
        let cancelled = false;
        setLoading(true);
        fetch(agentNativePath("/_agent-native/agent-model-defaults"))
            .then((r) => (r.ok ? r.json() : null))
            .then((data) => {
            if (cancelled || !data)
                return;
            setSettings(data);
            const firstConfigured = data.engines.find((engine) => engine.configured) ?? data.engines[0];
            const nextEngine = data.engine ?? firstConfigured?.name ?? "";
            const nextEngineInfo = data.engines.find((engine) => engine.name === nextEngine) ??
                firstConfigured;
            setSelectedEngine(nextEngine);
            setSelectedModel(data.model ?? nextEngineInfo?.defaultModel ?? "");
        })
            .catch(() => { })
            .finally(() => {
            if (!cancelled)
                setLoading(false);
        });
        return () => {
            cancelled = true;
        };
    }, []);
    useEffect(() => load(), [load]);
    const selectedEngineInfo = settings?.engines.find((engine) => engine.name === selectedEngine) ?? null;
    const engineOptions = (settings?.engines ?? [])
        .filter((engine) => engine.name === selectedEngine ||
        (engine.name !== "ai-sdk:anthropic" && engine.name !== "ai-sdk:ollama"))
        .map((engine) => ({
        value: engine.name,
        label: engine.name === "builder"
            ? "Builder.io Gateway"
            : engine.label || engine.name,
        description: engine.configured
            ? "Configured for this workspace"
            : "Credentials not detected yet",
    }));
    const modelOptions = latestModelsOnly(selectedEngineInfo?.supportedModels ?? []).map((model) => ({ value: model, label: friendlyModelName(model) }));
    const hasPendingChange = !!settings &&
        settings.canUpdate &&
        !!selectedEngine &&
        !!selectedModel.trim() &&
        (selectedEngine !== settings.engine ||
            selectedModel.trim() !== settings.model);
    const hasAppDefault = settings?.source !== "default";
    const scopeLabel = settings?.scope === "org"
        ? settings.orgName
            ? `${settings.orgName} organization`
            : "organization"
        : "your account";
    const notifyChanged = () => {
        window.dispatchEvent(new CustomEvent("agent-engine:configured-changed"));
    };
    const save = async () => {
        if (!hasPendingChange)
            return;
        setSaving(true);
        setSaved(false);
        setError(null);
        try {
            const res = await fetch(agentNativePath("/_agent-native/agent-model-defaults"), {
                method: "PUT",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({
                    engine: selectedEngine,
                    model: selectedModel.trim(),
                }),
            });
            const body = await res.json().catch(() => ({}));
            if (!res.ok)
                throw new Error(body?.error ?? `Save failed (${res.status})`);
            const next = body;
            setSettings(next);
            setSelectedEngine(next.engine ?? selectedEngine);
            setSelectedModel(next.model ?? selectedModel.trim());
            setSaved(true);
            notifyChanged();
            setTimeout(() => setSaved(false), 2000);
        }
        catch (err) {
            setError(err instanceof Error ? err.message : "Save failed");
        }
        finally {
            setSaving(false);
        }
    };
    const reset = async () => {
        if (!settings?.canUpdate || !hasAppDefault)
            return;
        setSaving(true);
        setSaved(false);
        setError(null);
        try {
            const res = await fetch(agentNativePath("/_agent-native/agent-model-defaults"), { method: "DELETE" });
            const body = await res.json().catch(() => ({}));
            if (!res.ok)
                throw new Error(body?.error ?? `Reset failed (${res.status})`);
            const next = body;
            setSettings(next);
            const fallback = next.engines.find((engine) => engine.configured);
            setSelectedEngine(next.engine ?? fallback?.name ?? selectedEngine);
            setSelectedModel(next.model ?? fallback?.defaultModel ?? selectedModel);
            notifyChanged();
        }
        catch (err) {
            setError(err instanceof Error ? err.message : "Reset failed");
        }
        finally {
            setSaving(false);
        }
    };
    return (_jsx(SettingsSection, { id: settingsSectionDomId("app-models"), icon: _jsx(IconApps, { size: 14 }), title: "App Default Model", subtitle: "Choose the default model for this app/template when no one-off composer model is selected.", connected: loading ? undefined : hasAppDefault, open: open, onToggle: onToggle, children: loading ? (_jsx(SettingsSkeleton, { lines: 2 })) : settings ? (_jsx("div", { className: "space-y-2", children: _jsxs("div", { className: "rounded-md border border-border bg-accent/20 px-2.5 py-2", children: [_jsxs("div", { className: "mb-2 flex items-center justify-between gap-2", children: [_jsxs("div", { className: "min-w-0", children: [_jsx("p", { className: "truncate text-[11px] font-medium text-foreground", children: friendlyAppName(settings.appId) || "This app" }), _jsx("p", { className: "mt-0.5 text-[10px] text-muted-foreground", children: hasAppDefault
                                            ? `Applies to ${scopeLabel}.`
                                            : "Using the global LLM default." })] }), _jsx("span", { className: "shrink-0 rounded-full bg-background px-2 py-0.5 text-[10px] font-medium text-muted-foreground", children: settings.source })] }), _jsxs("div", { className: "space-y-2", children: [_jsx(SettingsSelect, { label: "Provider", value: selectedEngine, options: engineOptions, onValueChange: (value) => {
                                    setSelectedEngine(value);
                                    const info = settings.engines.find((engine) => engine.name === value);
                                    setSelectedModel(info?.defaultModel ?? "");
                                    setError(null);
                                } }), _jsxs("div", { className: "space-y-1.5", children: [_jsx("p", { className: "text-[12px] font-medium text-foreground", children: "Model" }), _jsx("input", { type: "text", list: `app-model-suggestions-${selectedEngine}`, value: selectedModel, disabled: !settings.canUpdate || saving, onChange: (event) => {
                                            setSelectedModel(event.target.value);
                                            setError(null);
                                        }, onKeyDown: (event) => {
                                            if (event.key === "Enter" && hasPendingChange)
                                                void save();
                                        }, placeholder: selectedEngineInfo?.defaultModel ?? "model-id", spellCheck: false, autoComplete: "off", className: "flex h-9 w-full rounded-md border border-border bg-background px-3 text-[12px] text-foreground outline-none transition-colors hover:bg-accent/40 focus:ring-1 focus:ring-accent placeholder:text-muted-foreground/50 disabled:opacity-60", style: CONTROL_STYLE }), modelOptions.length > 0 && (_jsx("datalist", { id: `app-model-suggestions-${selectedEngine}`, children: modelOptions.map((option) => (_jsx("option", { value: option.value, label: option.label }, option.value))) }))] }), _jsxs("div", { className: "flex items-center gap-1.5", children: [_jsx("button", { type: "button", onClick: save, disabled: !hasPendingChange || saving, className: "inline-flex h-8 items-center gap-1 rounded bg-accent px-2.5 text-[10px] font-medium text-foreground hover:bg-accent/80 disabled:opacity-40", children: saving ? (_jsx(IconLoader2, { size: 10, className: "animate-spin" })) : saved ? (_jsx(IconCheck, { size: 10 })) : ("Save") }), _jsx("button", { type: "button", onClick: reset, disabled: !settings.canUpdate || !hasAppDefault || saving, className: "h-8 rounded border border-border px-2.5 text-[10px] font-medium text-muted-foreground hover:bg-accent/40 hover:text-foreground disabled:opacity-40", children: "Reset" })] })] }), !settings.canUpdate && (_jsx("p", { className: "mt-2 text-[10px] text-muted-foreground", children: "Only organization owners and admins can change app model defaults." })), selectedEngineInfo && !selectedEngineInfo.configured && (_jsx("p", { className: "mt-2 text-[10px] text-muted-foreground", children: "Credentials for this provider were not detected; runtime will fall back if the model cannot be used." })), error && (_jsx("p", { className: "mt-2 text-[10px] text-destructive", children: error }))] }) })) : (_jsx("p", { className: "text-[10px] text-muted-foreground", children: "App model defaults are unavailable." })) }));
}
// ─── Email Section ──────────────────────────────────────────────────────────
function EmailSectionInner({ open, onToggle, }) {
    const [envKeys, setEnvKeys] = useState([]);
    const [resendKey, setResendKey] = useState("");
    const [sendgridKey, setSendgridKey] = useState("");
    const [fromAddr, setFromAddr] = useState("");
    const [saving, setSaving] = useState(false);
    const [saved, setSaved] = useState(false);
    const [emailProvider, setEmailProvider] = useState("resend");
    const [envLoaded, setEnvLoaded] = useState(false);
    useEffect(() => {
        fetch(agentNativePath("/_agent-native/env-status"))
            .then((r) => (r.ok ? r.json() : []))
            .then(setEnvKeys)
            .catch(() => { })
            .finally(() => setEnvLoaded(true));
    }, [saved]);
    const resendConfigured = envKeys.find((k) => k.key === "RESEND_API_KEY")?.configured ?? false;
    const sendgridConfigured = envKeys.find((k) => k.key === "SENDGRID_API_KEY")?.configured ?? false;
    const fromConfigured = envKeys.find((k) => k.key === "EMAIL_FROM")?.configured ?? false;
    const anyConfigured = resendConfigured || sendgridConfigured;
    useEffect(() => {
        if (sendgridConfigured && !resendConfigured) {
            setEmailProvider("sendgrid");
        }
    }, [resendConfigured, sendgridConfigured]);
    const save = async (vars) => {
        setSaving(true);
        try {
            const res = await fetch(agentNativePath("/_agent-native/env-vars"), {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ vars }),
            });
            if (res.ok) {
                setSaved(true);
                setResendKey("");
                setSendgridKey("");
                setFromAddr("");
                setTimeout(() => setSaved(false), 2000);
            }
        }
        finally {
            setSaving(false);
        }
    };
    const saveResend = () => {
        const vars = [];
        if (resendKey.trim())
            vars.push({ key: "RESEND_API_KEY", value: resendKey.trim() });
        if (fromAddr.trim())
            vars.push({ key: "EMAIL_FROM", value: fromAddr.trim() });
        if (vars.length)
            save(vars);
    };
    const saveSendgrid = () => {
        const vars = [];
        if (sendgridKey.trim())
            vars.push({ key: "SENDGRID_API_KEY", value: sendgridKey.trim() });
        if (fromAddr.trim())
            vars.push({ key: "EMAIL_FROM", value: fromAddr.trim() });
        if (vars.length)
            save(vars);
    };
    return (_jsx(SettingsSection, { icon: _jsx(IconMail, { size: 14 }), title: "Email", subtitle: "Needed before deploy for password resets, team invitations, and share notifications. Local development can run without it.", connected: !envLoaded ? undefined : anyConfigured, open: open, onToggle: onToggle, children: !envLoaded ? (_jsx(SettingsSkeleton, { lines: 2 })) : (_jsxs("div", { className: "space-y-2", children: [_jsxs("label", { className: "block space-y-1", children: [_jsx("span", { className: "text-[10px] uppercase tracking-wide text-muted-foreground", children: "Provider" }), _jsxs("select", { value: emailProvider, onChange: (e) => setEmailProvider(e.target.value), className: "w-full rounded border border-border bg-background px-2 py-1 text-[11px] text-foreground outline-none focus:ring-1 focus:ring-accent", children: [_jsx("option", { value: "resend", children: "Resend" }), _jsx("option", { value: "sendgrid", children: "SendGrid" })] })] }), emailProvider === "resend" ? (_jsxs(ManualSetupCard, { hint: "Use Resend for transactional email.", docsUrl: "https://resend.com/api-keys", docsLabel: "Get a Resend key", children: [resendConfigured ? (_jsxs("div", { className: "mb-1 flex items-center gap-1.5 text-[10px] text-green-500", children: [_jsx(IconCheck, { size: 10 }), "RESEND_API_KEY configured"] })) : (_jsxs("div", { className: "mb-1 flex gap-1.5", children: [_jsx("input", { type: "password", value: resendKey, onChange: (e) => setResendKey(e.target.value), onKeyDown: (e) => {
                                        if (e.key === "Enter")
                                            saveResend();
                                    }, placeholder: "re_...", className: "flex-1 rounded border border-border bg-background px-2 py-1 text-[11px] text-foreground outline-none placeholder:text-muted-foreground/50 focus:ring-1 focus:ring-accent" }), _jsx("button", { onClick: saveResend, disabled: !resendKey.trim() || saving, className: "rounded bg-accent px-2 py-1 text-[10px] font-medium text-foreground hover:bg-accent/80 disabled:opacity-40", children: saving ? (_jsx(IconLoader2, { size: 10, className: "animate-spin" })) : saved ? (_jsx(IconCheck, { size: 10 })) : ("Save") })] })), fromConfigured ? (_jsxs("div", { className: "flex items-center gap-1.5 text-[10px] text-green-500", children: [_jsx(IconCheck, { size: 10 }), "EMAIL_FROM configured"] })) : (_jsxs("div", { className: "flex gap-1.5", children: [_jsx("input", { type: "text", value: fromAddr, onChange: (e) => setFromAddr(e.target.value), onKeyDown: (e) => {
                                        if (e.key === "Enter")
                                            saveResend();
                                    }, placeholder: "From address - e.g. Acme <hi@acme.com>", className: "flex-1 rounded border border-border bg-background px-2 py-1 text-[11px] text-foreground outline-none placeholder:text-muted-foreground/50 focus:ring-1 focus:ring-accent" }), !resendConfigured ? null : (_jsx("button", { onClick: saveResend, disabled: !fromAddr.trim() || saving, className: "rounded bg-accent px-2 py-1 text-[10px] font-medium text-foreground hover:bg-accent/80 disabled:opacity-40", children: saving ? (_jsx(IconLoader2, { size: 10, className: "animate-spin" })) : saved ? (_jsx(IconCheck, { size: 10 })) : ("Save") }))] }))] })) : (_jsxs(ManualSetupCard, { hint: "Use SendGrid for transactional email. SendGrid requires a verified from address.", docsUrl: "https://app.sendgrid.com/settings/api_keys", docsLabel: "Get a SendGrid key", children: [sendgridConfigured ? (_jsxs("div", { className: "mb-1 flex items-center gap-1.5 text-[10px] text-green-500", children: [_jsx(IconCheck, { size: 10 }), "SENDGRID_API_KEY configured"] })) : (_jsxs("div", { className: "mb-1 flex gap-1.5", children: [_jsx("input", { type: "password", value: sendgridKey, onChange: (e) => setSendgridKey(e.target.value), onKeyDown: (e) => {
                                        if (e.key === "Enter")
                                            saveSendgrid();
                                    }, placeholder: "SG....", className: "flex-1 rounded border border-border bg-background px-2 py-1 text-[11px] text-foreground outline-none placeholder:text-muted-foreground/50 focus:ring-1 focus:ring-accent" }), _jsx("button", { onClick: saveSendgrid, disabled: !sendgridKey.trim() || saving, className: "rounded bg-accent px-2 py-1 text-[10px] font-medium text-foreground hover:bg-accent/80 disabled:opacity-40", children: saving ? (_jsx(IconLoader2, { size: 10, className: "animate-spin" })) : saved ? (_jsx(IconCheck, { size: 10 })) : ("Save") })] })), fromConfigured ? (_jsxs("div", { className: "flex items-center gap-1.5 text-[10px] text-green-500", children: [_jsx(IconCheck, { size: 10 }), "EMAIL_FROM configured"] })) : (_jsxs("div", { className: "flex gap-1.5", children: [_jsx("input", { type: "text", value: fromAddr, onChange: (e) => setFromAddr(e.target.value), onKeyDown: (e) => {
                                        if (e.key === "Enter")
                                            saveSendgrid();
                                    }, placeholder: "From address - e.g. Acme <hi@acme.com>", className: "flex-1 rounded border border-border bg-background px-2 py-1 text-[11px] text-foreground outline-none placeholder:text-muted-foreground/50 focus:ring-1 focus:ring-accent" }), !sendgridConfigured ? null : (_jsx("button", { onClick: saveSendgrid, disabled: !fromAddr.trim() || saving, className: "rounded bg-accent px-2 py-1 text-[10px] font-medium text-foreground hover:bg-accent/80 disabled:opacity-40", children: saving ? (_jsx(IconLoader2, { size: 10, className: "animate-spin" })) : saved ? (_jsx(IconCheck, { size: 10 })) : ("Save") }))] }))] }))] })) }));
}
function AgentLimitsSectionInner({ open, onToggle, }) {
    const [settings, setSettings] = useState(null);
    const [value, setValue] = useState("");
    const [loading, setLoading] = useState(true);
    const [saving, setSaving] = useState(false);
    const [saved, setSaved] = useState(false);
    const [error, setError] = useState(null);
    const load = useCallback(() => {
        let cancelled = false;
        setLoading(true);
        fetch(agentNativePath("/_agent-native/agent-loop-settings"))
            .then((r) => (r.ok ? r.json() : null))
            .then((data) => {
            if (cancelled || !data)
                return;
            setSettings(data);
            setValue(String(data.maxIterations));
        })
            .catch(() => { })
            .finally(() => {
            if (!cancelled)
                setLoading(false);
        });
        return () => {
            cancelled = true;
        };
    }, []);
    useEffect(() => load(), [load]);
    useEffect(() => {
        const handler = (event) => {
            const detail = event.detail;
            if (!detail?.maxIterations)
                return;
            setSettings(detail);
            setValue(String(detail.maxIterations));
        };
        window.addEventListener("agent-loop-settings:changed", handler);
        return () => window.removeEventListener("agent-loop-settings:changed", handler);
    }, []);
    const numericValue = Number(value);
    const hasPendingChange = !!settings &&
        settings.canUpdate &&
        Number.isInteger(numericValue) &&
        numericValue !== settings.maxIterations;
    const scopeLabel = settings?.scope === "org"
        ? settings.orgName
            ? `${settings.orgName} organization`
            : "organization"
        : "your account";
    const save = async () => {
        if (!settings?.canUpdate)
            return;
        setSaving(true);
        setSaved(false);
        setError(null);
        try {
            const res = await fetch(agentNativePath("/_agent-native/agent-loop-settings"), {
                method: "PUT",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ maxIterations: numericValue }),
            });
            const body = await res.json().catch(() => ({}));
            if (!res.ok) {
                throw new Error(body?.error ?? `Save failed (${res.status})`);
            }
            setSettings(body);
            setValue(String(body.maxIterations));
            setSaved(true);
            window.dispatchEvent(new CustomEvent("agent-loop-settings:changed", { detail: body }));
            setTimeout(() => setSaved(false), 2000);
        }
        catch (err) {
            setError(err instanceof Error ? err.message : "Save failed");
        }
        finally {
            setSaving(false);
        }
    };
    const reset = async () => {
        if (!settings?.canUpdate)
            return;
        setSaving(true);
        setSaved(false);
        setError(null);
        try {
            const res = await fetch(agentNativePath("/_agent-native/agent-loop-settings"), { method: "DELETE" });
            const body = await res.json().catch(() => ({}));
            if (!res.ok) {
                throw new Error(body?.error ?? `Reset failed (${res.status})`);
            }
            setSettings(body);
            setValue(String(body.maxIterations));
            window.dispatchEvent(new CustomEvent("agent-loop-settings:changed", { detail: body }));
        }
        catch (err) {
            setError(err instanceof Error ? err.message : "Reset failed");
        }
        finally {
            setSaving(false);
        }
    };
    return (_jsx(SettingsSection, { icon: _jsx(IconGauge, { size: 14 }), title: "Agent Limits", subtitle: "Control how long a single agent response can work before pausing.", connected: loading
            ? undefined
            : settings
                ? settings.maxIterations !== settings.defaultMaxIterations
                : false, open: open, onToggle: onToggle, children: loading ? (_jsx(SettingsSkeleton, { lines: 2 })) : settings ? (_jsx("div", { className: "space-y-2", children: _jsxs("div", { className: "rounded-md border border-border px-2.5 py-2 bg-accent/20", children: [_jsxs("div", { className: "flex items-center justify-between gap-2", children: [_jsxs("div", { children: [_jsx("p", { className: "text-[11px] font-medium text-foreground", children: "Max iterations" }), _jsxs("p", { className: "mt-0.5 text-[10px] text-muted-foreground", children: ["Applies to ", scopeLabel, ". Default is", " ", settings.defaultMaxIterations.toLocaleString(), "."] })] }), _jsx("span", { className: "rounded-full bg-background px-2 py-0.5 text-[10px] font-medium text-muted-foreground", children: settings.source })] }), _jsxs("div", { className: "mt-2 flex items-center gap-1.5", children: [_jsx("input", { type: "number", min: settings.minMaxIterations, max: settings.maxMaxIterations, value: value, disabled: !settings.canUpdate || saving, onChange: (e) => {
                                    setValue(e.target.value);
                                    setError(null);
                                }, onKeyDown: (e) => {
                                    if (e.key === "Enter" && hasPendingChange)
                                        void save();
                                }, className: "h-8 min-w-0 flex-1 rounded border border-border bg-background px-2 text-[11px] text-foreground outline-none focus:ring-1 focus:ring-accent disabled:opacity-60" }), _jsx("button", { type: "button", onClick: save, disabled: !hasPendingChange || saving, className: "inline-flex h-8 items-center gap-1 rounded bg-accent px-2.5 text-[10px] font-medium text-foreground hover:bg-accent/80 disabled:opacity-40", children: saving ? (_jsx(IconLoader2, { size: 10, className: "animate-spin" })) : saved ? (_jsx(IconCheck, { size: 10 })) : ("Save") }), _jsx("button", { type: "button", onClick: reset, disabled: !settings.canUpdate ||
                                    saving ||
                                    settings.maxIterations === settings.defaultMaxIterations, className: "h-8 rounded border border-border px-2.5 text-[10px] font-medium text-muted-foreground hover:bg-accent/40 hover:text-foreground disabled:opacity-40", children: "Reset" })] }), !settings.canUpdate && (_jsx("p", { className: "mt-2 text-[10px] text-muted-foreground", children: "Only organization owners and admins can change this limit." })), error && (_jsx("p", { className: "mt-2 text-[10px] text-destructive", children: error }))] }) })) : (_jsx("p", { className: "text-[10px] text-muted-foreground", children: "Agent limit settings are unavailable." })) }));
}
const SETTINGS_SECTION_IDS = new Set([
    "account",
    "llm",
    "app-models",
    "limits",
    "voice",
    "demo-mode",
    "automations",
    "secrets",
    "hosting",
    "database",
    "uploads",
    "auth",
    "email",
    "browser",
    "background",
    "integrations",
    "usage",
    "a2a",
]);
function normalizeSettingsSection(value) {
    const normalized = value?.replace(/^#/, "").toLowerCase() ?? "";
    if (!normalized)
        return null;
    if (normalized.startsWith("secrets"))
        return "secrets";
    if (normalized === "workspace" ||
        normalized === "workspace-settings" ||
        normalized === "organization" ||
        normalized === "org") {
        return "secrets";
    }
    if (normalized === "agent-engine")
        return "llm";
    if (normalized === "agent-model-defaults" ||
        normalized === "app-model-defaults" ||
        normalized === "models") {
        return "app-models";
    }
    if (normalized === "agent-limits" || normalized === "loop-settings") {
        return "limits";
    }
    return SETTINGS_SECTION_IDS.has(normalized)
        ? normalized
        : null;
}
function settingsSectionDomId(section) {
    return `agent-settings-section-${section}`;
}
function initialOpenSection() {
    if (typeof window === "undefined")
        return "llm";
    return normalizeSettingsSection(window.location.hash) ?? "llm";
}
const environmentOptions = [
    {
        value: "production",
        label: "Production",
        description: "App tools only; code, bash, and files require Builder or a local clone.",
    },
    {
        value: "development",
        label: "Development",
        description: "Full access to code editing, bash, and files.",
    },
];
function CapabilityStatusRow({ label, value, active, }) {
    return (_jsxs("div", { className: "flex items-center justify-between gap-2 text-[10px]", children: [_jsxs("span", { className: "flex items-center gap-1.5 text-muted-foreground", children: [_jsx("span", { className: `h-1.5 w-1.5 rounded-full ${active ? "bg-green-500" : "bg-muted-foreground/30"}`, "aria-hidden": "true" }), label] }), _jsx("span", { className: "min-w-0 truncate text-right text-foreground", children: value })] }));
}
function CapabilityStatusStrip({ isDevMode, builderConnected, builderLoading, builderBranchesAvailable, onOpenLlm, }) {
    const codeAvailable = isDevMode || (builderConnected && builderBranchesAvailable);
    const codeLabel = isDevMode
        ? "Local tools"
        : builderConnected && builderBranchesAvailable
            ? "Builder branches"
            : "Desktop/local";
    return (_jsxs("div", { className: "rounded-md border border-border bg-muted/20 px-2.5 py-2", children: [_jsx("div", { className: "mb-1.5 text-[10px] font-medium text-muted-foreground", children: "Available now" }), _jsxs("div", { className: "space-y-1.5", children: [_jsx(CapabilityStatusRow, { label: "App", value: "Chat + actions", active: true }), _jsx(CapabilityStatusRow, { label: "Code", value: codeLabel, active: codeAvailable }), _jsx(CapabilityStatusRow, { label: "Builder", active: builderConnected, value: builderLoading ? ("Checking...") : builderConnected ? ("Connected") : (_jsx("button", { type: "button", onClick: onOpenLlm, className: "rounded border border-border px-1.5 py-0.5 text-[10px] text-muted-foreground transition-colors hover:bg-accent/40 hover:text-foreground", children: "Connect" })) })] })] }));
}
function AccountSectionInner({ open, onToggle, }) {
    const { session, isLoading } = useSession();
    const email = session?.email;
    const avatarUrl = useAvatarUrl(email);
    const fileInputRef = useRef(null);
    const [uploading, setUploading] = useState(false);
    const [status, setStatus] = useState("idle");
    const displayName = session?.name || email || "Signed out";
    const initials = (session?.name || email || "?")
        .split(/[ @._-]+/)
        .filter(Boolean)
        .slice(0, 2)
        .map((part) => part[0]?.toUpperCase())
        .join("");
    const handleAvatarChange = async (event) => {
        const file = event.target.files?.[0];
        event.target.value = "";
        if (!file || !email)
            return;
        setUploading(true);
        setStatus("idle");
        try {
            await uploadAvatar(file, email);
            setStatus("saved");
        }
        catch {
            setStatus("error");
        }
        finally {
            setUploading(false);
        }
    };
    return (_jsx(SettingsSection, { icon: _jsx(IconUserCircle, { size: 14 }), title: "Account", subtitle: "Your profile photo and signed-in identity.", open: open, onToggle: onToggle, children: _jsxs("div", { className: "flex items-center gap-3", children: [_jsx("div", { className: "flex h-12 w-12 shrink-0 items-center justify-center overflow-hidden rounded-full border border-border bg-accent text-[13px] font-semibold text-muted-foreground", children: avatarUrl ? (_jsx("img", { src: avatarUrl, alt: "", className: "h-full w-full object-cover" })) : (initials) }), _jsxs("div", { className: "min-w-0 flex-1", children: [_jsx("p", { className: "truncate text-[12px] font-medium text-foreground", children: isLoading ? "Loading..." : displayName }), email && (_jsx("p", { className: "truncate text-[11px] text-muted-foreground", children: email })), status === "saved" && (_jsx("p", { className: "mt-1 text-[11px] text-green-600 dark:text-green-400", children: "Photo updated" })), status === "error" && (_jsx("p", { className: "mt-1 text-[11px] text-destructive", children: "Could not update photo" }))] }), _jsx("input", { ref: fileInputRef, type: "file", accept: "image/*", className: "hidden", onChange: handleAvatarChange }), _jsx("button", { type: "button", disabled: !email || uploading, onClick: () => fileInputRef.current?.click(), className: "inline-flex h-8 shrink-0 items-center justify-center rounded-md border border-border bg-background px-3 text-[12px] font-medium text-foreground transition-colors hover:bg-accent/50 disabled:cursor-not-allowed disabled:opacity-50", children: uploading ? "Uploading..." : "Change photo" })] }) }));
}
export function SettingsPanel({ isDevMode, onToggleDevMode, showDevToggle, devAppUrl, initialSection, sectionRequestKey, }) {
    const { status: builder, loading: builderLoading } = useBuilderStatus();
    const connected = builder?.configured ?? false;
    const connectUrl = builder?.cliAuthUrl ?? builder?.connectUrl;
    const orgName = builder?.orgName;
    const envManaged = !!builder?.envManaged;
    const credentialSource = builder?.credentialSource;
    const builderBranchesAvailable = !!builder?.builderEnabled;
    const builderFlow = useBuilderConnectFlow({
        popupUrl: connectUrl,
        trackingSource: "settings_panel_builder_card",
    });
    // Detect whether the app registered any secrets — controls whether the
    // "API Keys & Connections" section renders at all.
    const [focusSecretKey, setFocusSecretKey] = useState(undefined);
    // Accordion: only one section open at a time (null = all closed)
    const [openSection, setOpenSection] = useState(initialOpenSection);
    const toggle = (id) => setOpenSection((prev) => (prev === id ? null : id));
    const scrollSectionIntoView = useCallback((section) => {
        window.requestAnimationFrame(() => {
            document.getElementById(settingsSectionDomId(section))?.scrollIntoView({
                block: "start",
                behavior: "smooth",
            });
        });
    }, []);
    const openSettingsSection = useCallback((section, scroll = false) => {
        setOpenSection(section);
        if (scroll)
            scrollSectionIntoView(section);
    }, [scrollSectionIntoView]);
    useEffect(() => {
        const section = normalizeSettingsSection(initialSection);
        if (!section)
            return;
        if (section !== "secrets")
            setFocusSecretKey(undefined);
        openSettingsSection(section, true);
    }, [initialSection, sectionRequestKey, openSettingsSection]);
    // Support `#secrets:<KEY>` hash fragments from the onboarding CTA — opens
    // the section and focuses the matching input.
    useEffect(() => {
        if (typeof window === "undefined")
            return;
        const handleHash = () => {
            const hash = window.location.hash?.replace(/^#/, "") ?? "";
            const section = normalizeSettingsSection(hash);
            if (!section)
                return;
            if (hash.startsWith("secrets:") || hash === "secrets") {
                const key = hash.slice("secrets:".length);
                setFocusSecretKey(key || undefined);
            }
            else {
                setFocusSecretKey(undefined);
            }
            openSettingsSection(section, true);
        };
        handleHash();
        window.addEventListener("hashchange", handleHash);
        return () => window.removeEventListener("hashchange", handleHash);
    }, [openSettingsSection]);
    return (_jsxs("div", { className: "flex-1 min-h-0 overflow-y-auto p-3 space-y-2", style: { overflowY: "auto" }, children: [(showDevToggle || devAppUrl) && (_jsx("div", { className: "space-y-2 pb-2 border-b border-border mb-2", children: showDevToggle && (_jsx(SettingsSelect, { label: "Environment", labelAdornment: devAppUrl ? (_jsxs(Tooltip, { children: [_jsx(TooltipTrigger, { asChild: true, children: _jsx("a", { href: devAppUrl, target: "_blank", rel: "noopener noreferrer", "aria-label": "Open app in new tab", className: "flex items-center text-muted-foreground hover:text-foreground", children: _jsx(IconExternalLink, { size: 14 }) }) }), _jsx(TooltipContent, { children: "Open app in new tab" })] })) : undefined, value: isDevMode ? "development" : "production", options: environmentOptions, onValueChange: (next) => {
                        const nextIsDev = next === "development";
                        if (nextIsDev !== isDevMode)
                            onToggleDevMode();
                    } })) })), _jsx(CapabilityStatusStrip, { isDevMode: isDevMode, builderConnected: connected, builderLoading: builderLoading, builderBranchesAvailable: builderBranchesAvailable, onOpenLlm: () => openSettingsSection("llm", true) }), _jsx(AccountSectionInner, { open: openSection === "account", onToggle: () => toggle("account") }), _jsx(LLMSectionInner, { builderFlow: builderFlow, builderLoading: builderLoading, connectUrl: connectUrl, connected: connected, orgName: orgName, envManaged: envManaged, credentialSource: credentialSource, open: openSection === "llm", onToggle: () => toggle("llm") }), _jsx(AppModelDefaultsSectionInner, { open: openSection === "app-models", onToggle: () => toggle("app-models") }), _jsx(AgentLimitsSectionInner, { open: openSection === "limits", onToggle: () => toggle("limits") }), _jsx(SettingsSection, { icon: _jsx(IconMicrophone, { size: 14 }), title: "Voice Transcription", subtitle: "How the composer microphone turns your voice into text.", open: openSection === "voice", onToggle: () => toggle("voice"), children: _jsx(VoiceTranscriptionSection, {}) }), _jsx(SettingsSection, { icon: _jsx(IconEyeOff, { size: 14 }), title: "Demo mode", subtitle: "Replace names, emails, and numbers with realistic fake data everywhere \u2014 in the UI and what the agent sees. IDs and structure are preserved so the app keeps working.", open: openSection === "demo-mode", onToggle: () => toggle("demo-mode"), children: _jsx(DemoModeSection, {}) }), _jsx(SettingsSection, { icon: _jsx(IconBolt, { size: 14 }), title: "Automations", subtitle: "Event-triggered and scheduled automations.", open: openSection === "automations", onToggle: () => toggle("automations"), children: _jsx(AutomationsSection, {}) }), _jsx(SettingsSection, { id: settingsSectionDomId("secrets"), icon: _jsx(IconKey, { size: 14 }), title: "API Keys & Connections", subtitle: "Service credentials and automation keys.", open: openSection === "secrets", onToggle: () => toggle("secrets"), children: _jsx(SecretsSection, { focusKey: focusSecretKey }) }), _jsx(SettingsSection, { icon: _jsx(IconCloud, { size: 14 }), title: "Hosting", subtitle: "Deploy your app to the cloud.", connected: connected, open: openSection === "hosting", onToggle: () => toggle("hosting"), children: _jsxs("div", { className: "space-y-2", children: [_jsx(UseBuilderCard, { builderFlow: builderFlow, connectUrl: connectUrl, connected: connected, orgName: orgName, envManaged: envManaged, credentialSource: credentialSource, trackingSource: "hosting_settings", trackingFlow: "hosting" }), _jsx(ManualSetupCard, { hint: "Deploy manually to Netlify, Vercel, Cloudflare, or any Nitro-supported target.", docsUrl: "https://www.builder.io/c/docs/agent-native-deployment", dim: connected })] }) }), _jsx(SettingsSection, { icon: _jsx(IconDatabase, { size: 14 }), title: "Database", subtitle: "Connect a cloud database for persistent storage.", connected: connected, open: openSection === "database", onToggle: () => toggle("database"), children: _jsxs("div", { className: "space-y-2", children: [_jsx(UseBuilderCard, { builderFlow: builderFlow, connectUrl: connectUrl, connected: connected, orgName: orgName, envManaged: envManaged, credentialSource: credentialSource, trackingSource: "database_settings", trackingFlow: "database" }), _jsx(ManualSetupCard, { hint: "Set DATABASE_URL in your .env to connect Neon, Supabase, Turso, or any Postgres/SQLite database.", docsUrl: "https://www.builder.io/c/docs/agent-native-database", dim: connected })] }) }), _jsx(SettingsSection, { icon: _jsx(IconUpload, { size: 14 }), title: "File uploads", subtitle: "Where user-uploaded files (avatars, chat attachments) are stored.", connected: connected, open: openSection === "uploads", onToggle: () => toggle("uploads"), children: _jsxs("div", { className: "space-y-2", children: [_jsx(UseBuilderCard, { builderFlow: builderFlow, connectUrl: connectUrl, connected: connected, orgName: orgName, envManaged: envManaged, credentialSource: credentialSource, trackingSource: "file_upload_settings", trackingFlow: "file_upload" }), _jsx(ManualSetupCard, { hint: "Without a provider, files are stored as base64 in your database. Fine for dev, not recommended for production.", docsUrl: "https://www.builder.io/c/docs/agent-native-file-uploads", dim: connected })] }) }), _jsx(SettingsSection, { icon: _jsx(IconShield, { size: 14 }), title: "Authentication", subtitle: "Set up user authentication and access control.", connected: connected, open: openSection === "auth", onToggle: () => toggle("auth"), children: _jsxs("div", { className: "space-y-2", children: [_jsx(UseBuilderCard, { builderFlow: builderFlow, connectUrl: connectUrl, connected: connected, orgName: orgName, envManaged: envManaged, credentialSource: credentialSource, trackingSource: "auth_settings", trackingFlow: "auth" }), _jsx(ManualSetupCard, { hint: "Configure Better Auth with BETTER_AUTH_SECRET and optional Google/GitHub OAuth providers.", docsUrl: "https://www.builder.io/c/docs/agent-native-authentication", dim: connected })] }) }), _jsx(EmailSectionInner, { open: openSection === "email", onToggle: () => toggle("email") }), _jsx(SettingsSection, { icon: _jsx(IconBrowser, { size: 14 }), title: "Browser Automation", subtitle: "Let agents control a real browser for web tasks.", connected: connected, open: openSection === "browser", onToggle: () => toggle("browser"), children: _jsx(UseBuilderCard, { builderFlow: builderFlow, connectUrl: connectUrl, connected: connected, orgName: orgName, envManaged: envManaged, credentialSource: credentialSource, trackingSource: "browser_settings", trackingFlow: "browser_automation" }) }), builderBranchesAvailable && (_jsx(SettingsSection, { icon: _jsx(IconGitBranch, { size: 14 }), title: "Background Agent", subtitle: "Make code changes from production mode via Builder.", connected: connected, open: openSection === "background", onToggle: () => toggle("background"), children: _jsx(UseBuilderCard, { builderFlow: builderFlow, connectUrl: connectUrl, connected: connected, orgName: orgName, envManaged: envManaged, credentialSource: credentialSource, trackingSource: "background_agent_settings", trackingFlow: "background_agent" }) })), _jsx(SettingsSection, { icon: _jsx(IconPlugConnected, { size: 14 }), title: "Integrations", subtitle: "Connect messaging platforms and external services.", open: openSection === "integrations", onToggle: () => toggle("integrations"), children: _jsx(Suspense, { fallback: null, children: _jsx(IntegrationsPanel, {}) }) }), _jsx(SettingsSection, { icon: _jsx(IconCoin, { size: 14 }), title: "Usage", subtitle: "Track token consumption and estimated cost \u2014 broken down by chat, automations, and background jobs.", open: openSection === "usage", onToggle: () => toggle("usage"), children: _jsx(UsageSection, {}) }), _jsx(SettingsSection, { icon: _jsx(IconTopologyRing2, { size: 14 }), title: "Connected Agents (A2A)", subtitle: "Manage remote agents connected via the A2A protocol.", open: openSection === "a2a", onToggle: () => toggle("a2a"), children: _jsx(AgentsSection, {}) })] }));
}
//# sourceMappingURL=SettingsPanel.js.map