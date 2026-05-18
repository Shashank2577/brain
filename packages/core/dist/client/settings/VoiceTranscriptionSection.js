import { jsx as _jsx, jsxs as _jsxs } from "react/jsx-runtime";
/**
 * <VoiceTranscriptionSection /> — source + cleanup settings for voice input.
 *
 * Writes the selection to application_state under `voice-transcription-prefs`
 * so the composer's `useVoiceDictation` hook picks it up on next record. The
 * legacy `provider` field is still written alongside `transcriptionMode` so
 * older clients continue to normalize safely.
 *
 * Provider status comes from `/_agent-native/voice-providers/status`, which
 * mirrors the server transcription route's key/env resolution.
 */
import { useCallback, useEffect, useState } from "react";
import { agentNativePath } from "../api-path.js";
import { IconAlertCircle, IconCheck, IconChevronDown, IconChevronRight, IconExternalLink, IconLoader2, IconLockOpen, IconMicrophone, } from "@tabler/icons-react";
import { openBuilderConnectPopup, useBuilderStatus, } from "./useBuilderStatus.js";
const PREFS_URL = agentNativePath("/_agent-native/application-state/voice-transcription-prefs");
const CLEANUP_PREFS_URL = agentNativePath("/_agent-native/application-state/voice-cleanup-prefs");
const SECRETS_URL = agentNativePath("/_agent-native/secrets");
const PROVIDER_STATUS_URL = agentNativePath("/_agent-native/voice-providers/status");
const DEFAULT_TRANSCRIPTION_MODE = "batch";
const DEFAULT_BATCH_PROVIDER = "auto";
function isProvider(value) {
    return (value === "auto" ||
        value === "openai" ||
        value === "builder-gemini" ||
        value === "builder" ||
        value === "browser" ||
        value === "gemini" ||
        value === "groq");
}
function isTranscriptionMode(value) {
    return (value === "mac-native" || value === "google-realtime" || value === "batch");
}
function normalizeProvider(value) {
    if (!isProvider(value))
        return null;
    return value === "builder" ? "builder-gemini" : value;
}
function legacyModeFromProvider(provider) {
    if (provider === "browser")
        return "mac-native";
    return "batch";
}
function providerForMode(mode, currentProvider) {
    if (mode === "mac-native")
        return "browser";
    if (mode === "google-realtime")
        return "auto";
    if (!currentProvider || currentProvider === "browser") {
        return DEFAULT_BATCH_PROVIDER;
    }
    return currentProvider;
}
function batchProvider(provider) {
    if (!provider || provider === "browser")
        return DEFAULT_BATCH_PROVIDER;
    return provider;
}
export function VoiceTranscriptionSection() {
    const [transcriptionMode, setTranscriptionMode] = useState(null);
    const [provider, setProvider] = useState(DEFAULT_BATCH_PROVIDER);
    const [instructions, setInstructions] = useState("");
    const [openAiConfigured, setOpenAiConfigured] = useState(null);
    const [geminiConfigured, setGeminiConfigured] = useState(null);
    const [groqConfigured, setGroqConfigured] = useState(null);
    const [googleRealtimeConfigured, setGoogleRealtimeConfigured] = useState(null);
    const [saving, setSaving] = useState(false);
    const [saveError, setSaveError] = useState(null);
    const [showAdvanced, setShowAdvanced] = useState(false);
    const [cleanupEnabled, setCleanupEnabled] = useState(null);
    const { status: builderStatus } = useBuilderStatus();
    const builderRealtimeReady = !!builderStatus?.privateKeyConfigured &&
        !!builderStatus?.publicKeyConfigured;
    const googleRealtimeReady = !!googleRealtimeConfigured && builderRealtimeReady;
    // Read cleanup pref (default: true if Builder is connected).
    useEffect(() => {
        let cancelled = false;
        fetch(CLEANUP_PREFS_URL)
            .then((r) => (r.ok ? r.json() : null))
            .then((body) => {
            if (cancelled)
                return;
            const stored = body?.enabled ??
                body?.value?.enabled;
            if (typeof stored === "boolean")
                setCleanupEnabled(stored);
            else
                setCleanupEnabled(null); // resolve once builderStatus arrives
        })
            .catch(() => !cancelled && setCleanupEnabled(null));
        return () => {
            cancelled = true;
        };
    }, []);
    useEffect(() => {
        if (cleanupEnabled !== null)
            return;
        if (builderStatus?.configured !== undefined) {
            setCleanupEnabled(!!builderStatus.configured);
        }
    }, [builderStatus?.configured, cleanupEnabled]);
    const toggleCleanup = async (next) => {
        const previous = cleanupEnabled;
        setCleanupEnabled(next);
        try {
            const res = await fetch(CLEANUP_PREFS_URL, {
                method: "PUT",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ enabled: next }),
            });
            if (!res.ok) {
                throw new Error(`HTTP ${res.status}`);
            }
        }
        catch {
            setCleanupEnabled(previous);
        }
    };
    useEffect(() => {
        let cancelled = false;
        fetch(PREFS_URL)
            .then((r) => (r.ok ? r.json() : null))
            .then((body) => {
            if (cancelled)
                return;
            const value = body?.value ?? body;
            const p = normalizeProvider(body?.provider ??
                body?.value?.provider);
            const storedMode = isTranscriptionMode(value?.transcriptionMode)
                ? value.transcriptionMode
                : null;
            const mode = storedMode ??
                (p ? legacyModeFromProvider(p) : DEFAULT_TRANSCRIPTION_MODE);
            const savedInstructions = body?.instructions ??
                body?.value?.instructions;
            setTranscriptionMode(mode);
            setProvider(providerForMode(mode, p));
            if (typeof savedInstructions === "string") {
                setInstructions(savedInstructions);
            }
        })
            .catch(() => {
            if (!cancelled) {
                setTranscriptionMode(DEFAULT_TRANSCRIPTION_MODE);
                setProvider(DEFAULT_BATCH_PROVIDER);
            }
        });
        return () => {
            cancelled = true;
        };
    }, []);
    useEffect(() => {
        let cancelled = false;
        fetch(PROVIDER_STATUS_URL)
            .then((r) => (r.ok ? r.json() : null))
            .then((status) => {
            if (cancelled)
                return;
            if (status) {
                setOpenAiConfigured(status.openai);
                setGeminiConfigured(status.gemini);
                setGroqConfigured(status.groq);
                setGoogleRealtimeConfigured(!!status.googleRealtime);
                return;
            }
            return fetch(SECRETS_URL)
                .then((r) => (r.ok ? r.json() : []))
                .then((list) => {
                if (cancelled)
                    return;
                const find = (key) => Array.isArray(list) ? list.find((s) => s.key === key) : null;
                setOpenAiConfigured(find("OPENAI_API_KEY")?.status === "set");
                setGeminiConfigured(find("GEMINI_API_KEY")?.status === "set");
                setGroqConfigured(find("GROQ_API_KEY")?.status === "set");
                setGoogleRealtimeConfigured(find("GOOGLE_APPLICATION_CREDENTIALS")?.status === "set");
            });
        })
            .catch(() => {
            if (!cancelled) {
                setOpenAiConfigured(false);
                setGeminiConfigured(false);
                setGroqConfigured(false);
                setGoogleRealtimeConfigured(false);
            }
        });
        return () => {
            cancelled = true;
        };
    }, []);
    const persist = useCallback(async (nextMode, nextProvider, nextInstructions, previous) => {
        setSaving(true);
        setSaveError(null);
        try {
            const res = await fetch(PREFS_URL, {
                method: "PUT",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({
                    transcriptionMode: nextMode,
                    provider: nextProvider,
                    instructions: nextInstructions.trim(),
                }),
            });
            if (!res.ok) {
                throw new Error(`HTTP ${res.status}`);
            }
        }
        catch (err) {
            // Revert the optimistic update so the UI matches server state.
            setTranscriptionMode(previous.transcriptionMode);
            setProvider(previous.provider);
            setInstructions(previous.instructions);
            setSaveError(`Couldn't save: ${err?.message ?? "network error"}. Try again.`);
        }
        finally {
            setSaving(false);
        }
    }, []);
    const focusKey = (key) => {
        if (typeof window === "undefined")
            return;
        window.location.hash = `#secrets:${key}`;
    };
    const chooseSource = (next) => {
        if (next === transcriptionMode)
            return;
        if (next === "google-realtime" && !googleRealtimeReady) {
            setShowAdvanced(true);
            if (!googleRealtimeConfigured) {
                focusKey("GOOGLE_APPLICATION_CREDENTIALS");
            }
            else if (!builderRealtimeReady) {
                openBuilderConnect();
            }
            return;
        }
        const previous = { transcriptionMode, provider, instructions };
        const nextProvider = providerForMode(next, provider);
        setTranscriptionMode(next);
        setProvider(nextProvider);
        void persist(next, nextProvider, instructions, previous);
    };
    const openBuilderConnect = () => {
        openBuilderConnectPopup({
            url: builderStatus?.cliAuthUrl ?? builderStatus?.connectUrl,
            source: "voice_transcription_settings",
            features: "noopener,noreferrer,width=600,height=700",
        });
    };
    const chooseBatchProvider = (next) => {
        const nextProvider = batchProvider(normalizeProvider(next));
        if (transcriptionMode === "batch" && nextProvider === provider)
            return;
        const previous = { transcriptionMode, provider, instructions };
        setTranscriptionMode("batch");
        setProvider(nextProvider);
        void persist("batch", nextProvider, instructions, previous);
    };
    const updateInstructions = (next) => {
        const previous = { transcriptionMode, provider, instructions };
        setInstructions(next);
        if (transcriptionMode) {
            void persist(transcriptionMode, provider, next, previous);
        }
    };
    if (transcriptionMode === null) {
        return (_jsxs("div", { className: "flex items-center gap-1.5 text-[10px] text-muted-foreground", children: [_jsx(IconLoader2, { size: 10, className: "animate-spin" }), "Loading\u2026"] }));
    }
    return (_jsxs("div", { className: "space-y-2", children: [_jsxs("div", { className: "rounded-md border border-border bg-background p-2", children: [_jsx("div", { className: "mb-2 flex items-start justify-between gap-3 px-0.5", children: _jsxs("div", { children: [_jsx("div", { className: "text-[11px] font-medium text-foreground", children: "Live transcription" }), _jsx("p", { className: "mt-0.5 text-[10px] text-muted-foreground", children: "Choose where real-time words come from. Batch still runs after recording stops." })] }) }), _jsxs("div", { className: "space-y-2", children: [_jsx(ProviderOption, { id: "mac-native", selected: transcriptionMode === "mac-native", onSelect: () => chooseSource("mac-native"), title: "Mac Native", subtitle: "Free and fast in the macOS Tauri app. Web clients use the existing browser-native path when available.", rightSlot: _jsx("span", { className: "text-[10px] text-muted-foreground", children: "Tauri default" }) }), _jsx(ProviderOption, { id: "google-realtime", selected: transcriptionMode === "google-realtime", onSelect: () => chooseSource("google-realtime"), disabled: !googleRealtimeReady, title: "Google Realtime", subtitle: googleRealtimeReady
                                    ? "BYOK only for v1. Streams live partials and finals through Google Speech-to-Text."
                                    : googleRealtimeConfigured
                                        ? "Google credentials are set. Connect Builder completely to mint the managed realtime session."
                                        : "BYOK only for v1. Configure Google service account before selecting this source.", rightSlot: googleRealtimeReady ? (_jsxs("span", { className: "flex items-center gap-1 text-[10px] text-green-500", children: [_jsx(IconCheck, { size: 10 }), "Ready"] })) : googleRealtimeConfigured ? (_jsxs("button", { type: "button", onClick: (e) => {
                                        e.stopPropagation();
                                        openBuilderConnect();
                                    }, className: "inline-flex items-center gap-1 rounded border border-border px-2 py-0.5 text-[10px] text-muted-foreground hover:bg-accent/40 hover:text-foreground", children: ["Connect Builder.io", _jsx(IconExternalLink, { size: 10 })] })) : (_jsxs("button", { type: "button", onClick: (e) => {
                                        e.stopPropagation();
                                        setShowAdvanced(true);
                                        focusKey("GOOGLE_APPLICATION_CREDENTIALS");
                                    }, className: "inline-flex items-center gap-1 rounded border border-border px-2 py-0.5 text-[10px] text-muted-foreground hover:bg-accent/40 hover:text-foreground", children: ["Configure", _jsx(IconExternalLink, { size: 10 })] })) }), _jsx(ProviderOption, { id: "batch", selected: transcriptionMode === "batch", onSelect: () => chooseSource("batch"), title: "Batch", subtitle: "Universal fallback. Sends audio after recording stops through Builder Gemini, Gemini, Groq, then OpenAI." }), _jsx(SystemAudioStatus, {})] })] }), _jsxs("div", { className: "flex items-start justify-between gap-3 rounded-md border border-border bg-accent/30 px-2.5 py-2", children: [_jsxs("div", { className: "min-w-0", children: [_jsx("div", { className: "text-[11px] font-medium text-foreground", children: "AI cleanup" }), _jsx("p", { className: "text-[10px] text-muted-foreground mt-0.5", children: "Polish punctuation, casing, filler words, titles, and summaries after capture. Builder Gemini is tried first; BYOK Gemini is the fallback." })] }), _jsxs("div", { className: "flex shrink-0 flex-col items-end gap-1", children: [_jsx("button", { type: "button", role: "switch", "aria-checked": !!cleanupEnabled, onClick: () => toggleCleanup(!cleanupEnabled), 
                                // Theme tokens; streaming agent owns layout.
                                className: `relative inline-flex h-4 w-7 shrink-0 cursor-pointer items-center rounded-full transition-colors ${cleanupEnabled
                                    ? "bg-primary"
                                    : "bg-muted-foreground/30 hover:bg-muted-foreground/50"}`, children: _jsx("span", { className: `inline-block h-3 w-3 transform rounded-full bg-background transition-transform ${cleanupEnabled ? "translate-x-3.5" : "translate-x-0.5"}` }) }), cleanupEnabled && (_jsx("span", { className: "text-[10px] text-muted-foreground", children: builderStatus?.configured
                                    ? "Builder ready"
                                    : geminiConfigured
                                        ? "Gemini key set"
                                        : "Needs key" }))] })] }), _jsxs("div", { className: "rounded-md border border-border bg-background", children: [_jsxs("button", { type: "button", onClick: () => setShowAdvanced((v) => !v), className: "w-full flex items-center justify-between gap-2 px-2.5 py-2 cursor-pointer", children: [_jsxs("span", { className: "text-[11px] font-medium text-foreground inline-flex items-center gap-1", children: [showAdvanced ? (_jsx(IconChevronDown, { size: 12 })) : (_jsx(IconChevronRight, { size: 12 })), "Add API keys"] }), _jsx("span", { className: "text-[10px] text-muted-foreground", children: "Google STT \u00B7 Gemini \u00B7 Groq \u00B7 OpenAI" })] }), showAdvanced && (_jsxs("div", { className: "px-2 pb-2 space-y-2", children: [_jsx(ProviderOption, { id: "google-service-account", selected: transcriptionMode === "google-realtime", onSelect: () => chooseSource("google-realtime"), disabled: !googleRealtimeReady, title: "Google Speech-to-Text service account", subtitle: googleRealtimeConfigured
                                    ? "Service-account JSON is set. Connect Builder to mint the managed realtime WebSocket session."
                                    : "Service-account JSON for the dedicated realtime WebSocket to Google StreamingRecognize.", rightSlot: googleRealtimeConfigured ===
                                    null ? null : googleRealtimeReady ? (_jsxs("span", { className: "flex items-center gap-1 text-[10px] text-green-500", children: [_jsx(IconCheck, { size: 10 }), "Ready"] })) : googleRealtimeConfigured ? (_jsxs("button", { type: "button", onClick: (e) => {
                                        e.stopPropagation();
                                        openBuilderConnect();
                                    }, className: "inline-flex items-center gap-1 rounded border border-border px-2 py-0.5 text-[10px] text-muted-foreground hover:text-foreground hover:bg-accent/40", children: ["Connect Builder.io", _jsx(IconExternalLink, { size: 10 })] })) : (_jsxs("button", { type: "button", onClick: (e) => {
                                        e.stopPropagation();
                                        focusKey("GOOGLE_APPLICATION_CREDENTIALS");
                                    }, className: "inline-flex items-center gap-1 rounded border border-border px-2 py-0.5 text-[10px] text-muted-foreground hover:text-foreground hover:bg-accent/40", children: ["Configure", _jsx(IconExternalLink, { size: 10 })] })) }), _jsx(ProviderOption, { id: "auto", selected: transcriptionMode === "batch" && provider === "auto", onSelect: () => chooseBatchProvider("auto"), title: "Automatic batch fallback", subtitle: "Keep the current Clips fallback chain: Builder Gemini, Gemini, Groq, then OpenAI." }), _jsx(ProviderOption, { id: "builder-gemini", selected: transcriptionMode === "batch" && provider === "builder-gemini", onSelect: () => chooseBatchProvider("builder-gemini"), disabled: !builderStatus?.configured, title: "Builder.io Connect", subtitle: builderStatus?.configured
                                    ? "Use Builder-hosted Gemini Flash-Lite for batch transcription and cleanup."
                                    : "One-click connect for Gemini Flash-Lite cleanup and batch transcription. No Google key needed.", rightSlot: builderStatus?.configured ? (_jsxs("span", { className: "flex items-center gap-1 text-[10px] text-green-500", children: [_jsx(IconCheck, { size: 10 }), "Connected"] })) : (_jsxs("button", { type: "button", onClick: (e) => {
                                        e.stopPropagation();
                                        openBuilderConnect();
                                    }, className: "inline-flex items-center gap-1 rounded border border-border px-2 py-0.5 text-[10px] text-muted-foreground hover:text-foreground hover:bg-accent/40", children: ["Connect Builder.io", _jsx(IconExternalLink, { size: 10 })] })) }), _jsx(ProviderOption, { id: "gemini", selected: transcriptionMode === "batch" && provider === "gemini", onSelect: () => chooseBatchProvider("gemini"), title: "Google Gemini", subtitle: "BYOK Gemini for AI cleanup and optional strict batch transcription.", rightSlot: geminiConfigured === null ? null : geminiConfigured ? (_jsxs("span", { className: "flex items-center gap-1 text-[10px] text-green-500", children: [_jsx(IconCheck, { size: 10 }), "Key set"] })) : (_jsxs("button", { type: "button", onClick: (e) => {
                                        e.stopPropagation();
                                        focusKey("GEMINI_API_KEY");
                                    }, className: "inline-flex items-center gap-1 rounded border border-border px-2 py-0.5 text-[10px] text-muted-foreground hover:text-foreground hover:bg-accent/40", children: ["Add key", _jsx(IconExternalLink, { size: 10 })] })) }), _jsx(ProviderOption, { id: "openai", selected: transcriptionMode === "batch" && provider === "openai", onSelect: () => chooseBatchProvider("openai"), title: "OpenAI Whisper", subtitle: "Batch Whisper provider. Requires an OpenAI API key.", rightSlot: openAiConfigured === null ? null : openAiConfigured ? (_jsxs("span", { className: "flex items-center gap-1 text-[10px] text-green-500", children: [_jsx(IconCheck, { size: 10 }), "Key set"] })) : (_jsxs("button", { type: "button", onClick: (e) => {
                                        e.stopPropagation();
                                        focusKey("OPENAI_API_KEY");
                                    }, className: "inline-flex items-center gap-1 rounded border border-border px-2 py-0.5 text-[10px] text-muted-foreground hover:text-foreground hover:bg-accent/40", children: ["Add key", _jsx(IconExternalLink, { size: 10 })] })) }), _jsx(ProviderOption, { id: "groq", selected: transcriptionMode === "batch" && provider === "groq", onSelect: () => chooseBatchProvider("groq"), title: "Groq Whisper", subtitle: "Fast Whisper batch provider. Requires a Groq API key.", rightSlot: groqConfigured === null ? null : groqConfigured ? (_jsxs("span", { className: "flex items-center gap-1 text-[10px] text-green-500", children: [_jsx(IconCheck, { size: 10 }), "Key set"] })) : (_jsxs("button", { type: "button", onClick: (e) => {
                                        e.stopPropagation();
                                        focusKey("GROQ_API_KEY");
                                    }, className: "inline-flex items-center gap-1 rounded border border-border px-2 py-0.5 text-[10px] text-muted-foreground hover:text-foreground hover:bg-accent/40", children: ["Add key", _jsx(IconExternalLink, { size: 10 })] })) })] }))] }), (cleanupEnabled || transcriptionMode === "batch") && (_jsxs("div", { className: "rounded-md border border-border bg-accent/20 px-2.5 py-2", children: [_jsx("label", { htmlFor: "voice-transcription-instructions", className: "block text-[10px] font-medium text-foreground", children: "Custom instructions" }), _jsx("textarea", { id: "voice-transcription-instructions", value: instructions, onChange: (event) => updateInstructions(event.target.value), placeholder: "Names, casing, punctuation, style, or terms to preserve.", className: "mt-1 min-h-16 w-full resize-y rounded border border-border bg-background px-2 py-1.5 text-[11px] text-foreground outline-none placeholder:text-muted-foreground/50 focus:ring-1 focus:ring-accent" }), _jsx("p", { className: "mt-1 text-[10px] text-muted-foreground", children: "Included with batch transcription and AI cleanup." })] })), saving && _jsx("p", { className: "text-[10px] text-muted-foreground", children: "Saving\u2026" }), saveError && !saving && (_jsx("p", { className: "text-[10px] text-red-500", role: "alert", children: saveError }))] }));
}
function ProviderOption({ id, selected, disabled, onSelect, title, subtitle, rightSlot, }) {
    const select = () => {
        if (!disabled)
            onSelect();
    };
    const onKeyDown = (event) => {
        if (disabled)
            return;
        if (event.key === "Enter" || event.key === " ") {
            event.preventDefault();
            onSelect();
        }
    };
    return (_jsxs("div", { role: "button", tabIndex: disabled ? -1 : 0, onClick: select, onKeyDown: onKeyDown, "aria-pressed": selected, "aria-disabled": disabled || undefined, 
        // Theme tokens; streaming agent owns layout.
        className: `w-full text-left rounded-md border px-2.5 py-2 flex items-start gap-2 ${selected
            ? "border-primary bg-primary/10"
            : "border-border bg-accent/30 hover:bg-accent/50"} ${disabled ? "opacity-60 cursor-not-allowed" : ""}`, children: [_jsx("span", { className: `mt-[2px] shrink-0 flex h-3.5 w-3.5 items-center justify-center rounded-full border ${selected
                    ? "border-primary bg-primary"
                    : "border-muted-foreground/40 bg-background"}`, children: selected && (_jsx("span", { className: "h-1.5 w-1.5 rounded-full bg-primary-foreground" })) }), _jsxs("div", { className: "min-w-0 flex-1", children: [_jsxs("div", { className: "flex items-center justify-between gap-2", children: [_jsx("div", { className: "text-[11px] font-medium text-foreground", children: title }), rightSlot && _jsx("div", { className: "shrink-0", children: rightSlot })] }), subtitle && (_jsx("p", { className: "text-[10px] text-muted-foreground mt-0.5", children: subtitle }))] })] }));
}
function getTauriInvoke() {
    if (typeof window === "undefined")
        return null;
    const internals = window.__TAURI_INTERNALS__;
    return internals?.invoke ?? null;
}
function SystemAudioStatus() {
    const [state, setState] = useState(null);
    useEffect(() => {
        let cancelled = false;
        const invoke = getTauriInvoke();
        if (!invoke)
            return; // Web users: render nothing.
        setState({ kind: "loading" });
        void (async () => {
            try {
                const status = (await invoke("system_audio_version_status"));
                if (cancelled)
                    return;
                if (status && !status.supported) {
                    setState({
                        kind: "unsupported",
                        reason: status.reason ??
                            `ScreenCaptureKit is unavailable on ${status.os_version}.`,
                    });
                    return;
                }
                // Supported — now probe permission. This may prompt; calling it
                // here matches the original on-mount semantics requested in the
                // settings flow.
                try {
                    const granted = (await invoke("system_audio_request_permission"));
                    if (cancelled)
                        return;
                    setState(granted ? { kind: "available" } : { kind: "denied" });
                }
                catch (err) {
                    if (cancelled)
                        return;
                    const msg = String(err ?? "");
                    if (/macOS\s*1[0-2]|requires macOS 13/i.test(msg)) {
                        setState({ kind: "unsupported", reason: msg });
                    }
                    else {
                        setState({ kind: "denied" });
                    }
                }
            }
            catch {
                // Older desktop builds may not have the new command yet —
                // fall back to the permission probe.
                if (cancelled)
                    return;
                try {
                    const granted = (await invoke("system_audio_request_permission"));
                    if (cancelled)
                        return;
                    setState(granted ? { kind: "available" } : { kind: "denied" });
                }
                catch (err) {
                    if (cancelled)
                        return;
                    const msg = String(err ?? "");
                    if (/macOS|ScreenCaptureKit/i.test(msg)) {
                        setState({ kind: "unsupported", reason: msg });
                    }
                    else {
                        setState({ kind: "denied" });
                    }
                }
            }
        })();
        return () => {
            cancelled = true;
        };
    }, []);
    const openPrivacy = useCallback(() => {
        const invoke = getTauriInvoke();
        if (!invoke)
            return;
        void invoke("system_audio_open_privacy_settings").catch(() => {
            // Older desktop builds without this command — no-op.
        });
    }, []);
    if (!state || state.kind === "loading")
        return null;
    if (state.kind === "available") {
        return (_jsxs("div", { className: "flex items-center gap-1.5 px-0.5 pt-1 text-[10px] text-muted-foreground", children: [_jsx(IconCheck, { size: 11, className: "text-green-500" }), _jsx("span", { children: "System audio capture available." })] }));
    }
    if (state.kind === "unsupported") {
        return (_jsxs("div", { className: "flex items-center gap-1.5 px-0.5 pt-1 text-[10px] text-muted-foreground", children: [_jsx("span", { className: "inline-block h-1.5 w-1.5 shrink-0 rounded-full bg-red-500", "aria-hidden": true }), _jsx("span", { children: "System audio requires macOS 13 or later \u2014 meetings will use mic-only." })] }));
    }
    // denied
    return (_jsxs("div", { className: "flex items-start gap-1.5 px-0.5 pt-1 text-[10px] text-muted-foreground", children: [_jsx(IconAlertCircle, { size: 11, className: "mt-[1px] shrink-0 text-amber-500" }), _jsxs("div", { className: "flex-1", children: [_jsx("span", { children: "Grant Screen Recording permission in System Settings -> Privacy." }), _jsxs("button", { type: "button", onClick: openPrivacy, className: "ml-1 inline-flex items-center gap-1 rounded border border-border px-1.5 py-0.5 text-[10px] text-muted-foreground hover:bg-accent/40 hover:text-foreground", children: [_jsx(IconLockOpen, { size: 10 }), "Open System Settings"] })] })] }));
}
export function VoiceTranscriptionIcon() {
    return _jsx(IconMicrophone, { size: 14 });
}
//# sourceMappingURL=VoiceTranscriptionSection.js.map