import { jsx as _jsx, jsxs as _jsxs } from "react/jsx-runtime";
import { IconBrowser, IconCheck, IconExternalLink, IconLoader2, } from "@tabler/icons-react";
import { SettingsSection } from "./SettingsSection.js";
import { useBuilderStatus, withBuilderConnectTrackingParams, } from "./useBuilderStatus.js";
import { trackEvent } from "../analytics.js";
export function BrowserSection() {
    const { status: builder, loading } = useBuilderStatus();
    const connected = builder?.configured ?? false;
    const builderConnectUrl = builder?.cliAuthUrl ?? builder?.connectUrl;
    const builderConnectHref = builderConnectUrl
        ? withBuilderConnectTrackingParams(builderConnectUrl, {
            source: "browser_settings",
            flow: "browser_automation",
        })
        : null;
    const builderReconnectHref = builderConnectUrl
        ? withBuilderConnectTrackingParams(builderConnectUrl, {
            source: "browser_settings_reconnect",
            flow: "browser_automation",
        })
        : null;
    return (_jsx(SettingsSection, { icon: _jsx(IconBrowser, { size: 14 }), title: "Browser Automation", subtitle: "Let agents control a real browser for web tasks. Requires Builder connection.", connected: connected, children: loading ? (_jsxs("div", { className: "flex items-center gap-1.5 text-[10px] text-muted-foreground", children: [_jsx(IconLoader2, { size: 10, className: "animate-spin" }), "Checking Builder connection..."] })) : connected ? (_jsxs("div", { className: "space-y-2", children: [_jsxs("div", { className: "flex items-center gap-1.5 text-[10px] text-green-500", children: [_jsx(IconCheck, { size: 10 }), "Browser access enabled", builder?.orgName && (_jsxs("span", { className: "text-muted-foreground", children: ["(", builder.orgName, ")"] }))] }), _jsxs("p", { className: "text-[10px] text-muted-foreground", children: ["Agents can request live browser sessions via", " ", _jsx("code", { className: "rounded bg-muted px-1 py-0.5 text-[9px]", children: "connect-builder" })] }), builderReconnectHref && (_jsxs("a", { href: builderReconnectHref, target: "_blank", rel: "noreferrer", onClick: () => {
                        trackEvent("builder connect clicked", {
                            feature: "builder",
                            stage: "client",
                            source: "browser_settings_reconnect",
                            flow: "browser_automation",
                            connect_url_kind: "provided",
                        });
                    }, className: "inline-flex items-center gap-1 rounded border border-border px-2 py-0.5 text-[10px] text-muted-foreground hover:text-foreground hover:bg-accent/40", children: ["Reconnect", _jsx(IconExternalLink, { size: 10 })] }))] })) : (_jsxs("div", { className: "space-y-2", children: [_jsx("p", { className: "text-[10px] text-muted-foreground", children: "Connect Builder to provision browser sessions without wiring browser setup into every app." }), builderConnectHref && (_jsxs("a", { href: builderConnectHref, target: "_blank", rel: "noreferrer", onClick: () => {
                        trackEvent("builder connect clicked", {
                            feature: "builder",
                            stage: "client",
                            source: "browser_settings",
                            flow: "browser_automation",
                            connect_url_kind: "provided",
                        });
                    }, className: "inline-flex items-center gap-1 rounded bg-accent px-2 py-1 text-[10px] font-medium text-foreground hover:bg-accent/80", children: ["Connect Builder", _jsx(IconExternalLink, { size: 10 })] }))] })) }));
}
//# sourceMappingURL=BrowserSection.js.map