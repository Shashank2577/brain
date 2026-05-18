import { jsx as _jsx, jsxs as _jsxs, Fragment as _Fragment } from "react/jsx-runtime";
import { useEffect, useMemo, useState } from "react";
import { toast } from "sonner";
import { IconBrandSlack, IconBrandTelegram, IconBrandWhatsapp, IconCheck, IconChevronRight, IconCopy, IconExternalLink, IconInfoCircle, IconLoader2, IconMail, } from "@tabler/icons-react";
import { Button } from "../components/ui/button.js";
import { Collapsible, CollapsibleContent, CollapsibleTrigger, } from "../components/ui/collapsible.js";
import { Input } from "../components/ui/input.js";
import { Tooltip, TooltipContent, TooltipTrigger, } from "../components/ui/tooltip.js";
import { agentNativePath } from "@agent-native/core/client";
const PLATFORM_DEFINITIONS = [
    {
        id: "slack",
        label: "Slack",
        icon: IconBrandSlack,
        description: "Receive mentions and DMs in one workspace-aware dispatch.",
        docsUrl: "/docs/messaging#slack",
        externalUrl: "https://api.slack.com/apps",
        externalLabel: "Open Slack apps",
        envKeys: ["SLACK_BOT_TOKEN", "SLACK_SIGNING_SECRET"],
        setupSteps: [
            "Create or open a Slack app at api.slack.com/apps.",
            "Save the bot token and signing secret below — the webhook URL appears once they're saved.",
            "Back in Slack, enable Event Subscriptions and paste the webhook URL.",
            "Subscribe to app_mention and message.im events, then install the app.",
            "Optional but recommended: Basic Information → Display Information → upload an app icon and pick a background color so the bot has a clean avatar in every channel.",
        ],
    },
    {
        id: "telegram",
        label: "Telegram",
        icon: IconBrandTelegram,
        description: "Chat with dispatch through a Telegram bot.",
        docsUrl: "/docs/messaging#telegram",
        externalUrl: "https://t.me/BotFather",
        externalLabel: "Open BotFather",
        envKeys: ["TELEGRAM_BOT_TOKEN"],
        setupSteps: [
            "Open @BotFather in Telegram and send /newbot.",
            "Save the bot token here, then click Set up webhook below.",
            "DM the bot in Telegram to test.",
        ],
    },
    {
        id: "email",
        label: "Email",
        icon: IconMail,
        description: "Give your agent an email address. People can email it directly or CC it on threads.",
        docsUrl: "/docs/messaging#email",
        externalUrl: "https://resend.com/webhooks",
        externalLabel: "Open Resend webhooks",
        envKeys: ["EMAIL_AGENT_ADDRESS"],
        setupSteps: [
            "Save your Resend or SendGrid API key (Vault or onboarding).",
            "Pick an email address — the easiest is a free <slug>.resend.app address.",
            "If using your own domain, add MX records pointing to your provider.",
            "Save the address here, then register the webhook URL below in Resend (event: email.received).",
        ],
    },
    {
        id: "whatsapp",
        label: "WhatsApp",
        icon: IconBrandWhatsapp,
        description: "Receive WhatsApp messages and reply through a Meta-managed phone number.",
        docsUrl: "/docs/messaging#whatsapp",
        externalUrl: "https://developers.facebook.com/apps",
        externalLabel: "Open Meta developer console",
        envKeys: [
            "WHATSAPP_ACCESS_TOKEN",
            "WHATSAPP_VERIFY_TOKEN",
            "WHATSAPP_PHONE_NUMBER_ID",
        ],
        setupSteps: [
            "Create a Meta app and add the WhatsApp product.",
            "Save the access token, verify token, and phone number ID below.",
            "In Meta's WhatsApp configuration, paste the webhook URL and your verify token.",
            "Subscribe to the messages field, then enable here.",
        ],
    },
];
function HelpTooltip({ content }) {
    return (_jsxs(Tooltip, { children: [_jsx(TooltipTrigger, { asChild: true, children: _jsx("button", { type: "button", className: "text-muted-foreground/60 hover:text-foreground cursor-pointer", children: _jsx(IconInfoCircle, { className: "h-3.5 w-3.5" }) }) }), _jsx(TooltipContent, { side: "top", className: "max-w-64 text-xs leading-relaxed", children: content })] }));
}
function StatusPill({ tone, label, }) {
    const toneClass = tone === "success"
        ? "border-emerald-500/30 bg-emerald-500/10 text-emerald-300"
        : tone === "warning"
            ? "border-amber-500/30 bg-amber-500/10 text-amber-300"
            : "border-border bg-muted/40 text-muted-foreground";
    return (_jsx("span", { className: `inline-flex items-center rounded-full border px-2.5 py-1 text-[11px] font-medium ${toneClass}`, children: label }));
}
/** Render a non-secret env value (e.g. EMAIL_AGENT_ADDRESS) as a copyable
 *  text block. We can't read the actual value from the backend (env-status
 *  only reports `configured: true|false`), so we offer a one-click reveal
 *  that hits a server endpoint, falling back to "saved" if the value is
 *  not exposed. For now we just render a "Saved — re-enter to change"
 *  placeholder; a future endpoint can return the actual value. */
function PublicValueReveal({ envKey: _envKey }) {
    return (_jsx("div", { className: "rounded-md border bg-muted/20 px-3 py-2 text-xs text-muted-foreground", children: "Saved. Re-enter below to change." }));
}
function ConnectionStatus({ configured, enabled, }) {
    if (enabled) {
        return _jsx(StatusPill, { tone: "success", label: "Connected" });
    }
    if (configured) {
        return _jsx(StatusPill, { tone: "warning", label: "Configured, not enabled" });
    }
    return _jsx(StatusPill, { tone: "neutral", label: "Not configured" });
}
export function MessagingSetupPanel() {
    const [statuses, setStatuses] = useState([]);
    const [loading, setLoading] = useState(true);
    const [envStatuses, setEnvStatuses] = useState([]);
    const [envLoading, setEnvLoading] = useState(true);
    const [envValues, setEnvValues] = useState({});
    const [savingKeysFor, setSavingKeysFor] = useState(null);
    const [togglingPlatform, setTogglingPlatform] = useState(null);
    const [setupPlatform, setSetupPlatform] = useState(null);
    const [copiedWebhook, setCopiedWebhook] = useState(null);
    const refreshStatuses = async () => {
        setLoading(true);
        try {
            const res = await fetch(agentNativePath("/_agent-native/integrations/status"));
            const rows = res.ok ? await res.json() : [];
            setStatuses(Array.isArray(rows) ? rows : []);
        }
        finally {
            setLoading(false);
        }
    };
    useEffect(() => {
        let active = true;
        fetch(agentNativePath("/_agent-native/integrations/status"))
            .then((res) => (res.ok ? res.json() : []))
            .then((rows) => {
            if (active) {
                setStatuses(Array.isArray(rows) ? rows : []);
                setLoading(false);
            }
        })
            .catch(() => {
            if (active)
                setLoading(false);
        });
        return () => {
            active = false;
        };
    }, []);
    useEffect(() => {
        let active = true;
        fetch(agentNativePath("/_agent-native/env-status"))
            .then((res) => (res.ok ? res.json() : []))
            .then((rows) => {
            if (active) {
                setEnvStatuses(Array.isArray(rows) ? rows : []);
                setEnvLoading(false);
            }
        })
            .catch(() => {
            if (active)
                setEnvLoading(false);
        });
        return () => {
            active = false;
        };
    }, []);
    const envStatusByKey = useMemo(() => new Map(envStatuses.map((status) => [status.key, status])), [envStatuses]);
    const statusByPlatform = useMemo(() => new Map(statuses.map((status) => [status.platform, status])), [statuses]);
    const refreshEnvStatus = async () => {
        setEnvLoading(true);
        try {
            const res = await fetch(agentNativePath("/_agent-native/env-status"));
            const rows = res.ok ? await res.json() : [];
            setEnvStatuses(Array.isArray(rows) ? rows : []);
        }
        finally {
            setEnvLoading(false);
        }
    };
    const saveEnvKeys = async (platform, keys) => {
        const vars = keys
            .map((key) => ({ key, value: envValues[key]?.trim() || "" }))
            .filter((item) => item.value);
        if (vars.length === 0) {
            toast.error("Add the required credentials first.");
            return;
        }
        setSavingKeysFor(platform.id);
        try {
            const res = await fetch(agentNativePath("/_agent-native/env-vars"), {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ vars }),
            });
            if (!res.ok) {
                const payload = await res.json().catch(() => ({}));
                throw new Error(payload.error || "Failed to save credentials");
            }
            toast.success(`${platform.label} credentials saved`);
            setEnvValues((current) => {
                const next = { ...current };
                for (const key of keys)
                    delete next[key];
                return next;
            });
            await refreshEnvStatus();
            await refreshStatuses();
        }
        catch (error) {
            toast.error(error instanceof Error ? error.message : "Failed to save credentials");
        }
        finally {
            setSavingKeysFor(null);
        }
    };
    const togglePlatform = async (platform, enabled) => {
        setTogglingPlatform(platform.id);
        try {
            const action = enabled ? "disable" : "enable";
            const res = await fetch(`/_agent-native/integrations/${platform.id}/${action}`, {
                method: "POST",
            });
            if (!res.ok) {
                const payload = await res.json().catch(() => ({}));
                throw new Error(payload.error || `Failed to ${action} ${platform.label}`);
            }
            toast.success(enabled
                ? `${platform.label} disconnected`
                : `${platform.label} connected`);
            await refreshStatuses();
        }
        catch (error) {
            toast.error(error instanceof Error ? error.message : "Failed to update integration");
        }
        finally {
            setTogglingPlatform(null);
        }
    };
    const runSetup = async (platform) => {
        setSetupPlatform(platform.id);
        try {
            const res = await fetch(`/_agent-native/integrations/${platform.id}/setup`, {
                method: "POST",
            });
            if (!res.ok) {
                const payload = await res.json().catch(() => ({}));
                throw new Error(payload.error || `Failed to set up ${platform.label}`);
            }
            toast.success(platform.id === "telegram"
                ? "Telegram webhook registered"
                : `${platform.label} setup complete`);
            await refreshStatuses();
        }
        catch (error) {
            toast.error(error instanceof Error
                ? error.message
                : `Failed to set up ${platform.label}`);
        }
        finally {
            setSetupPlatform(null);
        }
    };
    const copyWebhook = async (webhookUrl) => {
        await navigator.clipboard.writeText(webhookUrl);
        setCopiedWebhook(webhookUrl);
        toast.success("Webhook URL copied");
        setTimeout(() => setCopiedWebhook(null), 1500);
    };
    return (_jsxs("div", { className: "space-y-4", children: [_jsx("div", { className: "grid gap-4 xl:grid-cols-2", children: PLATFORM_DEFINITIONS.map((platform) => {
                    const status = statusByPlatform.get(platform.id);
                    const configured = !!status?.configured;
                    const enabled = !!status?.enabled;
                    // Prefer adapter-supplied env keys (includes optional fields like
                    // webhook secrets); fall back to the static list.
                    const adapterKeys = status?.requiredEnvKeys;
                    const envKeys = adapterKeys && adapterKeys.length > 0
                        ? adapterKeys
                        : platform.envKeys.map((key) => ({
                            key,
                            label: key,
                            required: true,
                        }));
                    const canEnable = configured;
                    return (_jsxs("section", { className: "rounded-2xl border bg-card p-5", children: [_jsxs("div", { className: "flex items-start justify-between gap-4", children: [_jsxs("div", { className: "flex items-start gap-3", children: [_jsx("div", { className: "flex h-10 w-10 items-center justify-center rounded-xl border bg-muted/30 text-foreground", children: _jsx(platform.icon, { size: 18 }) }), _jsxs("div", { children: [_jsxs("div", { className: "flex items-center gap-2", children: [_jsx("h3", { className: "text-base font-semibold text-foreground", children: platform.label }), _jsx(ConnectionStatus, { configured: configured, enabled: enabled })] }), _jsx("p", { className: "mt-1 text-sm text-muted-foreground", children: platform.description })] })] }), _jsxs("div", { className: "flex shrink-0 items-center gap-1", children: [_jsx(Button, { asChild: true, variant: "ghost", size: "sm", className: "h-7 px-2 text-xs text-muted-foreground", children: _jsxs("a", { href: platform.docsUrl, target: "_blank", rel: "noreferrer", children: ["Docs", _jsx(IconExternalLink, { className: "ml-1 h-3 w-3" })] }) }), platform.externalUrl ? (_jsx(Button, { asChild: true, variant: "ghost", size: "sm", className: "h-7 px-2 text-xs text-muted-foreground", children: _jsxs("a", { href: platform.externalUrl, target: "_blank", rel: "noreferrer", children: [platform.externalLabel ?? "Open", _jsx(IconExternalLink, { className: "ml-1 h-3 w-3" })] }) })) : null] })] }), _jsxs(Collapsible, { className: "mt-5", children: [_jsxs(CollapsibleTrigger, { className: "group flex w-full cursor-pointer items-center gap-1.5 text-xs font-medium text-muted-foreground hover:text-foreground", children: [_jsx(IconChevronRight, { className: "h-3.5 w-3.5 transition-transform group-data-[state=open]:rotate-90" }), _jsx("span", { children: "Setup steps" })] }), _jsx(CollapsibleContent, { children: _jsx("div", { className: "mt-2 rounded-xl border bg-muted/20 p-4", children: _jsx("ol", { className: "space-y-2 text-sm text-muted-foreground", children: platform.setupSteps.map((step, index) => (_jsxs("li", { className: "flex gap-2", children: [_jsxs("span", { className: "text-muted-foreground/60", children: [index + 1, "."] }), _jsx("span", { children: step })] }, step))) }) }) })] }), _jsxs("div", { className: "mt-4 space-y-3", children: [_jsxs("div", { className: "flex items-center gap-2", children: [_jsx("div", { className: "text-sm font-medium text-foreground", children: "Credentials" }), envLoading ? (_jsx("span", { className: "text-xs text-muted-foreground", children: "Checking..." })) : null] }), _jsx("div", { className: "space-y-3", children: envKeys.map((envKey) => {
                                            const envStatus = envStatusByKey.get(envKey.key);
                                            const isConfigured = !!envStatus?.configured;
                                            const helpText = envKey.helpText ?? envStatus?.helpText;
                                            const label = envKey.label || envStatus?.label || envKey.key;
                                            // Email agent address is not a secret — show it plainly
                                            // so users can copy and share it.
                                            const isPublicValue = envKey.key === "EMAIL_AGENT_ADDRESS";
                                            return (_jsxs("div", { className: "space-y-1.5", children: [_jsxs("div", { className: "flex items-center justify-between gap-3", children: [_jsxs("div", { className: "flex items-center gap-1.5", children: [_jsxs("label", { className: "text-xs font-medium text-foreground", children: [label, !envKey.required ? (_jsx("span", { className: "ml-1 text-muted-foreground", children: "(optional)" })) : null] }), helpText ? (_jsx(HelpTooltip, { content: helpText })) : null] }), isConfigured ? (_jsx(StatusPill, { tone: "success", label: "Saved" })) : (_jsx(StatusPill, { tone: envKey.required ? "neutral" : "neutral", label: envKey.required ? "Missing" : "Not set" }))] }), isConfigured && isPublicValue ? (_jsx(PublicValueReveal, { envKey: envKey.key })) : !isConfigured ? (_jsx(Input, { type: isPublicValue ? "text" : "password", value: envValues[envKey.key] || "", onChange: (event) => setEnvValues((current) => ({
                                                            ...current,
                                                            [envKey.key]: event.target.value,
                                                        })), placeholder: isPublicValue
                                                            ? "agent@yourcompany.com"
                                                            : `Enter ${label}`, autoComplete: "off" })) : null] }, envKey.key));
                                        }) }), envKeys.some((k) => !envStatusByKey.get(k.key)?.configured) ? (_jsx(Button, { variant: "outline", onClick: () => saveEnvKeys(platform, envKeys.map((k) => k.key)), disabled: savingKeysFor === platform.id, children: savingKeysFor === platform.id ? (_jsxs(_Fragment, { children: [_jsx(IconLoader2, { className: "mr-2 h-4 w-4 animate-spin" }), "Saving..."] })) : ("Save credentials") })) : null] }), status?.webhookUrl ? (_jsxs("div", { className: "mt-4 space-y-2", children: [_jsx("div", { className: "text-sm font-medium text-foreground", children: "Webhook URL" }), _jsxs("div", { className: "flex items-center gap-2", children: [_jsx("code", { className: "flex-1 truncate rounded-md border bg-muted/30 px-3 py-2 text-xs text-foreground", children: status.webhookUrl }), _jsx(Button, { variant: "outline", size: "icon", onClick: () => copyWebhook(status.webhookUrl), "aria-label": `Copy ${platform.label} webhook URL`, children: copiedWebhook === status.webhookUrl ? (_jsx(IconCheck, { className: "h-4 w-4" })) : (_jsx(IconCopy, { className: "h-4 w-4" })) })] })] })) : null, _jsxs("div", { className: "mt-5 flex flex-wrap items-center justify-end gap-2 border-t border-border pt-4", children: [platform.id === "telegram" && configured ? (_jsx(Button, { variant: "outline", onClick: () => runSetup(platform), disabled: setupPlatform === platform.id, children: setupPlatform === platform.id ? (_jsxs(_Fragment, { children: [_jsx(IconLoader2, { className: "mr-2 h-4 w-4 animate-spin" }), "Setting up..."] })) : ("Set up webhook") })) : null, !configured && !enabled ? (_jsxs(Tooltip, { children: [_jsx(TooltipTrigger, { asChild: true, children: _jsx("span", { tabIndex: 0, children: _jsx(Button, { disabled: true, children: "Enable" }) }) }), _jsx(TooltipContent, { children: "Save the required credentials first." })] })) : (_jsx(Button, { onClick: () => togglePlatform(platform, enabled), disabled: togglingPlatform === platform.id, children: togglingPlatform === platform.id ? (_jsxs(_Fragment, { children: [_jsx(IconLoader2, { className: "mr-2 h-4 w-4 animate-spin" }), "Saving..."] })) : enabled ? ("Disable") : ("Enable") }))] })] }, platform.id));
                }) }), loading ? (_jsx("div", { className: "rounded-2xl border border-dashed px-4 py-6 text-sm text-muted-foreground", children: "Loading messaging status..." })) : null] }));
}
//# sourceMappingURL=messaging-setup-panel.js.map