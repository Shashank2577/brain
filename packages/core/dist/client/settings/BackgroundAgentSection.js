import { jsx as _jsx, jsxs as _jsxs } from "react/jsx-runtime";
import { agentNativePath } from "../api-path.js";
import { useState } from "react";
import { IconGitBranch, IconCheck, IconExternalLink, IconLoader2, } from "@tabler/icons-react";
import { SettingsSection } from "./SettingsSection.js";
import { useBuilderStatus } from "./useBuilderStatus.js";
export function BackgroundAgentSection() {
    const { status: builder } = useBuilderStatus();
    const connected = builder?.configured ?? false;
    const cloudAgentsAvailable = !!builder?.builderEnabled;
    const [projectUrl, setProjectUrl] = useState("");
    const [running, setRunning] = useState(false);
    const [result, setResult] = useState(null);
    const [error, setError] = useState(null);
    const handleCreateBranch = async () => {
        if (!projectUrl.trim())
            return;
        setRunning(true);
        setError(null);
        setResult(null);
        try {
            const res = await fetch(agentNativePath("/_agent-native/builder/agents-run"), {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({
                    userMessage: "Set up this project for development",
                    projectUrl: projectUrl.trim(),
                }),
            });
            if (!res.ok) {
                const body = await res.json().catch(() => ({}));
                throw new Error(body?.error || `Failed (${res.status})`);
            }
            setResult(await res.json());
        }
        catch (err) {
            setError(err?.message || "Failed to create branch");
        }
        finally {
            setRunning(false);
        }
    };
    return (_jsx(SettingsSection, { icon: _jsx(IconGitBranch, { size: 14 }), title: "Background Agent", subtitle: "Make code changes from production mode. Builder creates a branch, the agent makes changes, and you get a preview URL.", connected: connected, children: !connected ? (_jsxs("div", { className: "space-y-2", children: [_jsx("p", { className: "text-[10px] text-muted-foreground", children: "Connect Builder to enable code changes from production. The agent will create branches and provide preview URLs." }), builder?.connectUrl && (_jsxs("a", { href: builder.connectUrl, className: "inline-flex items-center gap-1 rounded bg-accent px-2 py-1 text-[10px] font-medium text-foreground hover:bg-accent/80", children: ["Connect Builder", _jsx(IconExternalLink, { size: 10 })] }))] })) : !cloudAgentsAvailable ? (_jsxs("div", { className: "space-y-2", children: [_jsxs("div", { className: "flex items-center gap-1.5 text-[10px] text-muted-foreground", children: [_jsx(IconCheck, { size: 10 }), "Builder connected", builder?.orgName && (_jsxs("span", { className: "text-muted-foreground", children: ["(", builder.orgName, ")"] }))] }), _jsx("p", { className: "text-[10px] text-muted-foreground", children: "You don't have access to Builder Cloud Agents for this workspace yet. Use the desktop app or your local clone for code changes." }), _jsxs("a", { href: "https://www.agent-native.com/download", target: "_blank", rel: "noopener noreferrer", className: "inline-flex items-center gap-1 rounded bg-accent px-2 py-1 text-[10px] font-medium text-foreground hover:bg-accent/80", children: ["Download desktop app", _jsx(IconExternalLink, { size: 10 })] })] })) : (_jsxs("div", { className: "space-y-2.5", children: [_jsxs("div", { className: "flex items-center gap-1.5 text-[10px] text-green-500", children: [_jsx(IconCheck, { size: 10 }), "Builder connected", builder?.orgName && (_jsxs("span", { className: "text-muted-foreground", children: ["(", builder.orgName, ")"] }))] }), _jsxs("div", { children: [_jsx("label", { className: "text-[10px] font-medium text-foreground block mb-1", children: "Builder Project URL or ID" }), _jsxs("div", { className: "flex gap-1.5", children: [_jsx("input", { type: "text", value: projectUrl, onChange: (e) => setProjectUrl(e.target.value), onKeyDown: (e) => {
                                        if (e.key === "Enter")
                                            handleCreateBranch();
                                    }, placeholder: "https://builder.io/app/projects/...", className: "flex-1 rounded border border-border bg-background px-2 py-1 text-[11px] text-foreground outline-none placeholder:text-muted-foreground/50 focus:ring-1 focus:ring-accent" }), _jsx("button", { onClick: handleCreateBranch, disabled: !projectUrl.trim() || running, className: "rounded bg-accent px-2 py-1 text-[10px] font-medium text-foreground hover:bg-accent/80 disabled:opacity-40", children: running ? (_jsx(IconLoader2, { size: 10, className: "animate-spin" })) : ("Create branch") })] })] }), result && (_jsxs("div", { className: "rounded-md border border-green-800/40 bg-green-900/10 px-2.5 py-2", children: [_jsx("div", { className: "text-[10px] font-medium text-green-400 mb-1", children: "Branch created" }), _jsxs("a", { href: result.url, target: "_blank", rel: "noopener noreferrer", className: "flex items-center gap-1 text-[10px] text-foreground hover:underline", children: [result.url, _jsx(IconExternalLink, { size: 10 })] })] })), error && _jsx("p", { className: "text-[10px] text-red-400", children: error })] })) }));
}
//# sourceMappingURL=BackgroundAgentSection.js.map