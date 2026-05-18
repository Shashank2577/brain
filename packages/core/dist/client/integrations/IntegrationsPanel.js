import { jsx as _jsx, jsxs as _jsxs } from "react/jsx-runtime";
import { useState, useCallback, useEffect } from "react";
import { IconPlus, IconBrandSlack, IconBrandTelegram, IconBrandWhatsapp, IconBrandGoogleDrive, IconTerminal2, IconBuildingSkyscraper, IconCopy, IconCheck, IconChevronLeft, IconExternalLink, IconCircleCheck, } from "@tabler/icons-react";
import { useIntegrationStatus, } from "./useIntegrationStatus.js";
import { agentNativePath } from "../api-path.js";
import { Tooltip, TooltipContent, TooltipTrigger, } from "../components/ui/tooltip.js";
const PLATFORMS = [
    {
        id: "slack",
        label: "Slack",
        icon: IconBrandSlack,
        description: "Message your agent from any Slack channel or DM.",
        envVars: ["SLACK_BOT_TOKEN", "SLACK_SIGNING_SECRET"],
        setupSteps: [
            "Create a Slack app at api.slack.com/apps",
            'Enable "Event Subscriptions" and point to your webhook URL',
            "Subscribe to message.im and app_mention events",
            "Install the app to your workspace",
            "Copy the Bot Token and Signing Secret into your environment",
        ],
        docsUrl: "https://api.slack.com/apps",
    },
    {
        id: "telegram",
        label: "Telegram",
        icon: IconBrandTelegram,
        description: "Chat with your agent via a Telegram bot.",
        envVars: ["TELEGRAM_BOT_TOKEN"],
        setupSteps: [
            "Message @BotFather on Telegram to create a new bot",
            "Copy the bot token into your environment",
            'Click "Setup webhook" below to register automatically',
        ],
    },
    {
        id: "whatsapp",
        label: "WhatsApp",
        icon: IconBrandWhatsapp,
        description: "Connect your agent to WhatsApp Business.",
        envVars: ["WHATSAPP_TOKEN", "WHATSAPP_VERIFY_TOKEN"],
        setupSteps: [
            "Create a Meta Business app at developers.facebook.com",
            "Set up WhatsApp Business API",
            "Configure the webhook URL and verify token",
            "Copy the access token into your environment",
        ],
        docsUrl: "https://developers.facebook.com/docs/whatsapp",
    },
    {
        id: "google-docs",
        label: "Google Docs",
        icon: IconBrandGoogleDrive,
        description: "Tag the agent in Google Doc comments to get responses.",
        envVars: ["GOOGLE_SERVICE_ACCOUNT_KEY"],
        setupSteps: [
            "Create a Google Cloud service account and download the JSON key",
            "Set GOOGLE_SERVICE_ACCOUNT_KEY in your environment (JSON string or file path)",
            "Share your Google Docs with the service account email",
            'Write a comment containing "@Agent" to trigger the agent',
        ],
    },
    {
        id: "openclaw",
        label: "OpenClaw",
        icon: IconTerminal2,
        description: "Access this agent from OpenClaw's unified agent interface.",
        envVars: [],
        isClient: true,
        setupSteps: [
            "Install OpenClaw: npm install -g openclaw",
            "Add this agent's URL as a provider in your OpenClaw config",
            "OpenClaw discovers your agent's capabilities via the A2A protocol",
        ],
    },
    {
        id: "claude-code",
        label: "Claude Code",
        icon: IconTerminal2,
        description: "Let Claude Code call this agent via A2A for data and actions.",
        envVars: [],
        isClient: true,
        setupSteps: [
            "Your agent exposes an A2A endpoint at /.well-known/agent-card.json",
            "In Claude Code, reference your agent's URL when asking for data",
            "Claude Code will discover and call your agent's skills automatically",
        ],
    },
    {
        id: "builder",
        label: "Builder.io",
        icon: IconBuildingSkyscraper,
        description: "One chat interface that orchestrates all your agents together.",
        envVars: [],
        isClient: true,
        setupSteps: [
            "Connect your agent-native apps in your Builder.io workspace",
            "Builder.io discovers each agent's skills via A2A",
            "Chat with one agent that can trigger actions across all your apps",
        ],
        docsUrl: "https://www.builder.io",
    },
];
function useAgentEngineConfigured() {
    const [configured, setConfigured] = useState(undefined);
    const refresh = useCallback(() => {
        fetch(agentNativePath("/_agent-native/agent-engine/status"))
            .then((r) => (r.ok ? r.json() : null))
            .then((data) => {
            if (typeof data?.configured === "boolean") {
                setConfigured(data.configured);
            }
        })
            .catch(() => { });
    }, []);
    useEffect(() => {
        refresh();
        window.addEventListener("agent-engine:configured-changed", refresh);
        return () => window.removeEventListener("agent-engine:configured-changed", refresh);
    }, [refresh]);
    return configured;
}
// ─── Integration detail view ─────────────────────────────────────────────────
function IntegrationDetail({ platform, serverStatus, onBack, onRefresh, }) {
    const [toggling, setToggling] = useState(false);
    const [copied, setCopied] = useState(false);
    const [toggleError, setToggleError] = useState(null);
    const agentEngineConfigured = useAgentEngineConfigured();
    const handleToggle = useCallback(async () => {
        setToggling(true);
        setToggleError(null);
        try {
            const action = serverStatus?.enabled ? "disable" : "enable";
            const res = await fetch(agentNativePath(`/_agent-native/integrations/${platform.id}/${action}`), { method: "POST" });
            if (res.ok) {
                onRefresh();
                return;
            }
            // Surface the real reason instead of silently doing nothing.
            // The endpoint returns `{ error }` for known failures (admin gating,
            // missing secrets, etc.); fall back to status text otherwise.
            const data = (await res.json().catch(() => null));
            setToggleError(data?.error ||
                res.statusText ||
                `Couldn't ${action} ${platform.label} (HTTP ${res.status})`);
        }
        catch (err) {
            setToggleError(err instanceof Error
                ? err.message
                : "Network error reaching the server");
        }
        finally {
            setToggling(false);
        }
    }, [platform.id, platform.label, serverStatus?.enabled, onRefresh]);
    const handleCopy = useCallback(async (text) => {
        await navigator.clipboard.writeText(text);
        setCopied(true);
        setTimeout(() => setCopied(false), 2000);
    }, []);
    const handleOpenLlmSettings = useCallback(() => {
        window.dispatchEvent(new CustomEvent("agent-panel:open-settings", {
            detail: { section: "llm" },
        }));
    }, []);
    const isConfigured = serverStatus?.configured ?? false;
    const isEnabled = serverStatus?.enabled ?? false;
    const showAgentEnginePrereq = !platform.isClient && agentEngineConfigured === false;
    const serviceAccountEmail = typeof serverStatus?.details?.serviceAccountEmail === "string"
        ? serverStatus.details.serviceAccountEmail
        : null;
    return (_jsxs("div", { children: [_jsxs("button", { onClick: onBack, className: "flex items-center gap-1 text-[10px] text-muted-foreground hover:text-foreground mb-2", children: [_jsx(IconChevronLeft, { size: 12 }), "Back"] }), _jsxs("div", { className: "flex items-center gap-2 mb-2", children: [_jsx(platform.icon, { size: 18, className: "text-foreground shrink-0" }), _jsxs("div", { children: [_jsx("div", { className: "text-xs font-medium text-foreground", children: platform.label }), _jsx("div", { className: "text-[10px] text-muted-foreground", children: platform.description })] })] }), showAgentEnginePrereq && (_jsx("div", { className: "mb-3 rounded-md border border-amber-500/30 bg-amber-500/10 px-2.5 py-2", children: _jsxs("div", { className: "flex items-center justify-between gap-2", children: [_jsxs("div", { className: "min-w-0", children: [_jsx("div", { className: "text-[10px] font-medium text-foreground", children: "Agent engine required" }), _jsxs("p", { className: "mt-0.5 text-[10px] leading-relaxed text-muted-foreground", children: ["Connect Builder.io or an LLM key before ", platform.label, " can answer."] })] }), _jsx("button", { type: "button", onClick: handleOpenLlmSettings, className: "shrink-0 rounded border border-border bg-background px-2 py-1 text-[10px] font-medium text-muted-foreground transition-colors hover:bg-accent/40 hover:text-foreground", children: "Open LLM" })] }) })), _jsxs("div", { className: "mb-3", children: [_jsx("div", { className: "text-[10px] font-medium text-muted-foreground mb-1.5", children: "Setup" }), _jsx("ol", { className: "space-y-1", children: platform.setupSteps.map((step, i) => (_jsxs("li", { className: "flex gap-1.5 text-[10px] text-muted-foreground leading-relaxed", children: [_jsxs("span", { className: "shrink-0 text-muted-foreground/50", children: [i + 1, "."] }), step] }, i))) })] }), serviceAccountEmail && (_jsxs("div", { className: "mb-3", children: [_jsx("div", { className: "text-[10px] font-medium text-muted-foreground mb-1", children: "Share documents with" }), _jsxs("div", { className: "flex items-center gap-1", children: [_jsx("code", { className: "flex-1 truncate rounded bg-muted px-1.5 py-0.5 text-[10px] text-foreground", children: serviceAccountEmail }), _jsxs(Tooltip, { children: [_jsx(TooltipTrigger, { asChild: true, children: _jsx("button", { onClick: () => handleCopy(serviceAccountEmail), className: "shrink-0 rounded p-0.5 text-muted-foreground hover:text-foreground hover:bg-accent/50", children: copied ? _jsx(IconCheck, { size: 12 }) : _jsx(IconCopy, { size: 12 }) }) }), _jsx(TooltipContent, { children: "Copy service account email" })] })] })] })), platform.envVars.length > 0 && (_jsxs("div", { className: "mb-3", children: [_jsx("div", { className: "text-[10px] font-medium text-muted-foreground mb-1", children: "Required secrets" }), _jsx("div", { className: "space-y-0.5", children: platform.envVars.map((v) => (_jsxs("div", { className: "flex items-center gap-1", children: [_jsx("code", { className: "text-[10px] text-foreground bg-muted px-1 py-0.5 rounded", children: v }), isConfigured && (_jsx(IconCircleCheck, { size: 11, className: "text-green-500 shrink-0" }))] }, v))) }), !isConfigured && (_jsx("p", { className: "text-[10px] text-amber-500 mt-1", children: "Set these in your .env file or environment to connect." }))] })), serverStatus?.webhookUrl && !platform.isClient && (_jsxs("div", { className: "mb-3", children: [_jsx("div", { className: "text-[10px] font-medium text-muted-foreground mb-1", children: "Webhook URL" }), _jsxs("div", { className: "flex items-center gap-1", children: [_jsx("code", { className: "flex-1 truncate rounded bg-muted px-1.5 py-0.5 text-[10px] text-foreground", children: serverStatus.webhookUrl }), _jsxs(Tooltip, { children: [_jsx(TooltipTrigger, { asChild: true, children: _jsx("button", { onClick: () => handleCopy(serverStatus.webhookUrl), className: "shrink-0 rounded p-0.5 text-muted-foreground hover:text-foreground hover:bg-accent/50", children: copied ? _jsx(IconCheck, { size: 12 }) : _jsx(IconCopy, { size: 12 }) }) }), _jsx(TooltipContent, { children: "Copy" })] })] })] })), platform.docsUrl && (_jsxs("a", { href: platform.docsUrl, target: "_blank", rel: "noopener noreferrer", className: "flex items-center gap-1 text-[10px] text-blue-400 hover:text-blue-300 mb-3", children: ["Documentation", _jsx(IconExternalLink, { size: 10 })] })), serverStatus && !platform.isClient && isConfigured && (_jsx("button", { onClick: handleToggle, disabled: toggling, className: `w-full rounded-md border px-2 py-1.5 text-[11px] font-medium disabled:opacity-50 ${isEnabled
                    ? "border-border text-foreground hover:bg-accent/50"
                    : "border-green-600/50 text-green-400 hover:bg-green-900/20"}`, children: toggling ? "..." : isEnabled ? "Disable" : "Enable" })), platform.isClient && (_jsx("div", { className: "rounded-md border border-border bg-muted/30 px-2.5 py-2 text-[10px] text-muted-foreground", children: "This agent's A2A endpoint is automatically available. No configuration needed." })), serverStatus?.error && (_jsx("p", { className: "text-[10px] text-destructive mt-2", children: serverStatus.error })), toggleError && (_jsx("p", { className: "text-[10px] text-destructive mt-2", children: toggleError }))] }));
}
// ─── Add integration picker ──────────────────────────────────────────────────
function AddIntegrationPicker({ connectedIds, onSelect, }) {
    return (_jsx("div", { className: "space-y-1", children: PLATFORMS.filter((p) => !connectedIds.has(p.id)).map((platform) => (_jsxs("button", { onClick: () => onSelect(platform), className: "flex w-full items-center gap-2 rounded-md px-2 py-1.5 text-left hover:bg-accent/50", children: [_jsx(platform.icon, { size: 14, className: "shrink-0 text-muted-foreground" }), _jsxs("div", { className: "flex-1 min-w-0", children: [_jsx("div", { className: "text-[11px] font-medium text-foreground", children: platform.label }), _jsx("div", { className: "text-[10px] text-muted-foreground truncate", children: platform.description })] })] }, platform.id))) }));
}
// ─── Main panel ──────────────────────────────────────────────────────────────
export function IntegrationsPanel() {
    const { statuses, loading, refetch } = useIntegrationStatus();
    const [selectedPlatform, setSelectedPlatform] = useState(null);
    const [showPicker, setShowPicker] = useState(false);
    const statusMap = new Map(statuses.map((s) => [s.platform, s]));
    // Show connected (enabled or configured) integrations
    const connectedPlatforms = PLATFORMS.filter((p) => {
        const s = statusMap.get(p.id);
        return s?.configured || s?.enabled;
    });
    const connectedIds = new Set(connectedPlatforms.map((p) => p.id));
    if (selectedPlatform) {
        return (_jsx(IntegrationDetail, { platform: selectedPlatform, serverStatus: statusMap.get(selectedPlatform.id), onBack: () => setSelectedPlatform(null), onRefresh: refetch }));
    }
    if (showPicker) {
        return (_jsxs("div", { children: [_jsxs("button", { onClick: () => setShowPicker(false), className: "flex items-center gap-1 text-[10px] text-muted-foreground hover:text-foreground mb-2", children: [_jsx(IconChevronLeft, { size: 12 }), "Back"] }), _jsx("div", { className: "text-[10px] font-medium text-muted-foreground mb-1.5", children: "Add a chat integration" }), _jsx(AddIntegrationPicker, { connectedIds: connectedIds, onSelect: (p) => {
                        setSelectedPlatform(p);
                        setShowPicker(false);
                    } })] }));
    }
    return (_jsxs("div", { children: [_jsxs("div", { className: "flex items-center justify-between mb-1.5", children: [_jsxs("div", { children: [_jsx("div", { className: "text-xs font-medium text-foreground", children: "Chat Integrations" }), _jsx("div", { className: "text-[10px] text-muted-foreground", children: "Talk to this agent from other platforms" })] }), _jsxs(Tooltip, { children: [_jsx(TooltipTrigger, { asChild: true, children: _jsx("button", { onClick: () => setShowPicker(true), className: "flex h-5 w-5 items-center justify-center rounded text-muted-foreground hover:text-foreground hover:bg-accent/50", children: _jsx(IconPlus, { size: 12 }) }) }), _jsx(TooltipContent, { children: "Add integration" })] })] }), loading ? (_jsxs("div", { className: "space-y-1.5", children: [_jsx("div", { className: "h-6 w-full rounded bg-muted/50 animate-pulse" }), _jsx("div", { className: "h-6 w-3/4 rounded bg-muted/50 animate-pulse" })] })) : connectedPlatforms.length === 0 ? (_jsxs("div", { className: "space-y-2", children: [_jsxs("button", { onClick: () => setShowPicker(true), className: "flex w-full items-center gap-1.5 rounded-md px-2 py-1.5 text-[11px] text-muted-foreground hover:text-foreground hover:bg-accent/30", children: [_jsx(IconPlus, { size: 12, className: "shrink-0" }), "Add integration"] }), _jsxs("div", { className: "rounded-md border border-border bg-muted/30 px-2.5 py-2 text-[10px] text-muted-foreground", children: ["For a central Slack or Telegram entrypoint that can route work across multiple apps, use the", " ", _jsx("a", { href: "https://dispatch.agent-native.com", target: "_blank", rel: "noopener noreferrer", className: "no-underline font-medium text-foreground hover:text-foreground/80", children: "dispatch template" }), "."] })] })) : (_jsxs("div", { className: "space-y-2", children: [connectedPlatforms.map((platform) => {
                        const s = statusMap.get(platform.id);
                        return (_jsxs("button", { onClick: () => setSelectedPlatform(platform), className: "flex w-full items-center gap-2 rounded-md px-2 py-1.5 text-left hover:bg-accent/50", children: [_jsx(platform.icon, { size: 14, className: "shrink-0 text-muted-foreground" }), _jsx("span", { className: "flex-1 text-[11px] font-medium text-foreground truncate", children: platform.label }), s && (_jsx("span", { className: `inline-block h-1.5 w-1.5 rounded-full shrink-0 ${s.enabled && s.configured
                                        ? "bg-green-500"
                                        : s.configured
                                            ? "bg-yellow-500"
                                            : "bg-gray-400"}` }))] }, platform.id));
                    }), _jsx("div", { className: "rounded-md border border-border bg-muted/30 px-2.5 py-2 text-[10px] text-muted-foreground", children: "Need one shared messaging surface for your workspace? Connect Slack or Telegram to a dispatch app and let it delegate to other agents over A2A." })] }))] }));
}
//# sourceMappingURL=IntegrationsPanel.js.map