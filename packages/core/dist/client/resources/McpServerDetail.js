import { jsx as _jsx, jsxs as _jsxs } from "react/jsx-runtime";
import { agentNativePath } from "../api-path.js";
/**
 * Detail view for a virtual MCP server entry in the Workspace tree.
 *
 * Shown when the user clicks an `mcp-servers/<name>.json` entry. Servers
 * aren't editable in-place — today the server endpoints only support
 * create + delete, matching the Settings UX they replaced. Users can
 * delete and recreate if they need to change a URL or headers.
 */
import { useState } from "react";
import { IconPlugConnected, IconAlertTriangle, IconLoader2, IconCheck, IconTestPipe, } from "@tabler/icons-react";
import { cn } from "../utils.js";
export function McpServerDetail({ server }) {
    const [testing, setTesting] = useState(false);
    const [testResult, setTestResult] = useState(null);
    const headers = server.headers ? Object.keys(server.headers) : [];
    const runTest = async () => {
        setTesting(true);
        setTestResult(null);
        try {
            // We don't have the real header values client-side (redacted). The
            // test-existing endpoint uses the stored headers, but there's no
            // convenient way to hit it from here without the server id + scope,
            // which we do have — so wire that up.
            const res = await fetch(agentNativePath(`/_agent-native/mcp/servers/${encodeURIComponent(server.id)}/test?scope=${server.scope}`), {
                method: "POST",
                credentials: "include",
                headers: { "Content-Type": "application/json" },
            });
            const body = (await res.json().catch(() => ({})));
            setTestResult(body.ok ? body : { ok: false, error: body.error });
        }
        catch (err) {
            setTestResult({ ok: false, error: err?.message ?? String(err) });
        }
        finally {
            setTesting(false);
        }
    };
    return (_jsx("div", { className: "flex h-full flex-col overflow-y-auto", children: _jsxs("div", { className: "px-4 py-4", children: [_jsxs("div", { className: "mb-3 flex items-center gap-2", children: [_jsx(IconPlugConnected, { className: "h-4 w-4 text-muted-foreground" }), _jsx("h2", { className: "text-[14px] font-medium text-foreground", children: server.name }), _jsx(StatusBadge, { server: server })] }), server.description && (_jsx("p", { className: "mb-4 text-[12px] leading-relaxed text-muted-foreground", children: server.description })), _jsxs("dl", { className: "space-y-3", children: [_jsx(Field, { label: "Scope", children: _jsxs("div", { className: "space-y-0.5", children: [_jsx("span", { className: "text-[12px] text-foreground", children: server.scope === "user" ? "Personal" : "Organization" }), _jsx("p", { className: "text-[11px] leading-relaxed text-muted-foreground", children: server.scope === "user"
                                            ? "Only available to you. Best for private or staging connections."
                                            : "Shared with the active organization. Best for vetted team connections." })] }) }), _jsx(Field, { label: "URL", children: _jsx("code", { className: "rounded bg-muted px-1.5 py-0.5 text-[11px] text-foreground break-all", children: server.url }) }), headers.length > 0 && (_jsx(Field, { label: "Headers", children: _jsx("ul", { className: "space-y-1", children: headers.map((k) => (_jsxs("li", { className: "flex items-center gap-2 text-[11px] text-muted-foreground", children: [_jsx("code", { className: "rounded bg-muted px-1.5 py-0.5 text-foreground", children: k }), _jsx("span", { className: "italic", children: "(hidden)" })] }, k))) }) })), _jsx(Field, { label: "Tools", children: _jsx(ToolsSummary, { server: server }) })] }), _jsxs("div", { className: "mt-5 flex items-center gap-2", children: [_jsxs("button", { type: "button", onClick: runTest, disabled: testing, className: cn("inline-flex items-center gap-1.5 rounded-md border border-border bg-background px-2.5 py-1 text-[11px] font-medium text-foreground hover:bg-accent", testing && "opacity-60"), children: [testing ? (_jsx(IconLoader2, { className: "h-3 w-3 animate-spin" })) : (_jsx(IconTestPipe, { className: "h-3 w-3" })), "Test connection"] }), testResult && _jsx(TestResultLine, { result: testResult })] }), _jsx("p", { className: "mt-6 rounded-md border border-border bg-muted/40 p-2.5 text-[11px] leading-relaxed text-muted-foreground", children: "To change the URL, headers, or description, delete this entry and add a new server. Edits in place aren't supported yet." })] }) }));
}
function Field({ label, children, }) {
    return (_jsxs("div", { children: [_jsx("dt", { className: "mb-1 text-[10px] font-semibold uppercase tracking-wide text-muted-foreground/70", children: label }), _jsx("dd", { children: children })] }));
}
function StatusBadge({ server }) {
    if (server.status.state === "connected") {
        return (_jsxs("span", { className: "inline-flex items-center gap-1 rounded-full bg-green-500/10 px-2 py-0.5 text-[10px] font-medium text-green-600 dark:text-green-400", children: [_jsx("span", { className: "h-1.5 w-1.5 rounded-full bg-green-500" }), "Connected"] }));
    }
    if (server.status.state === "error") {
        return (_jsxs("span", { className: "inline-flex items-center gap-1 rounded-full bg-red-500/10 px-2 py-0.5 text-[10px] font-medium text-red-600 dark:text-red-400", title: server.status.error, children: [_jsx(IconAlertTriangle, { className: "h-2.5 w-2.5" }), "Error"] }));
    }
    return (_jsxs("span", { className: "inline-flex items-center gap-1 rounded-full bg-muted px-2 py-0.5 text-[10px] font-medium text-muted-foreground", children: [_jsx("span", { className: "h-1.5 w-1.5 rounded-full bg-muted-foreground/50" }), "Connecting\u2026"] }));
}
function ToolsSummary({ server }) {
    if (server.status.state === "connected") {
        return (_jsxs("span", { className: "text-[12px] text-foreground", children: [server.status.toolCount, " tool", server.status.toolCount === 1 ? "" : "s", " exposed"] }));
    }
    if (server.status.state === "error") {
        return (_jsx("span", { className: "text-[12px] text-red-600 dark:text-red-400", children: server.status.error }));
    }
    return (_jsx("span", { className: "text-[12px] text-muted-foreground", children: "Not connected yet \u2014 try the Test button." }));
}
function TestResultLine({ result }) {
    if (result.ok) {
        return (_jsxs("span", { className: "inline-flex items-center gap-1 text-[11px] text-green-600 dark:text-green-400", children: [_jsx(IconCheck, { className: "h-3 w-3" }), result.toolCount, " tool", result.toolCount === 1 ? "" : "s", " available"] }));
    }
    return (_jsx("span", { className: "text-[11px] text-red-600 dark:text-red-400", children: result.error ?? "Failed" }));
}
//# sourceMappingURL=McpServerDetail.js.map