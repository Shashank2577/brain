import { jsx as _jsx, jsxs as _jsxs, Fragment as _Fragment } from "react/jsx-runtime";
import { useState, useRef, useEffect } from "react";
import { IconPlus, IconUpload, IconBulb, IconClock, IconBolt, IconTool, IconPlugConnected, IconLoader2, IconCheck, IconArrowLeft, } from "@tabler/icons-react";
import { ComposerPrimitive } from "@assistant-ui/react";
import { cn } from "../utils.js";
import { Popover, PopoverTrigger, PopoverContent, } from "../components/ui/popover.js";
import { useOrg } from "../org/hooks.js";
import { formatMcpServerError, getMcpUrlValidationError, useCreateMcpServer, testMcpServerUrl, } from "../resources/use-mcp-servers.js";
import { Tooltip, TooltipContent, TooltipTrigger, } from "../components/ui/tooltip.js";
function UploadOnlyAttachButton() {
    // Mirrors the hidden-AddAttachment + visible-button pattern used in the full
    // ComposerPlusMenu. Rendering AddAttachment directly as the visible button
    // can disappear when the runtime reports no eligible adapter; the hidden
    // delegate keeps the visible "+" button reliably mounted.
    const hiddenRef = useRef(null);
    return (_jsxs(_Fragment, { children: [_jsx(ComposerPrimitive.AddAttachment, { asChild: true, children: _jsx("button", { ref: hiddenRef, type: "button", className: "hidden", tabIndex: -1, "aria-hidden": true }) }), _jsxs(Tooltip, { children: [_jsx(TooltipTrigger, { asChild: true, children: _jsx("button", { type: "button", onClick: () => hiddenRef.current?.click(), className: "shrink-0 flex h-7 w-7 cursor-pointer items-center justify-center rounded-md text-muted-foreground hover:text-foreground hover:bg-accent/50", "aria-label": "Upload file", children: _jsx(IconPlus, { className: "h-4 w-4" }) }) }), _jsx(TooltipContent, { children: "Upload image, PDF, PPTX, DOCX, text, Markdown, JSON, CSV, HTML, CSS, or XML" })] })] }));
}
export function ComposerPlusMenu({ onSelectMode, mode = "full", }) {
    if (mode === "upload-only") {
        return _jsx(UploadOnlyAttachButton, {});
    }
    return _jsx(ComposerPlusMenuFull, { onSelectMode: onSelectMode });
}
function ComposerPlusMenuFull({ onSelectMode, }) {
    const [open, setOpen] = useState(false);
    const [view, setView] = useState("menu");
    // MCP state
    const { data: org } = useOrg();
    const canCreateOrgMcp = !org?.orgId || org.role === "owner" || org.role === "admin";
    const hasOrg = !!org?.orgId;
    const defaultMcpScope = hasOrg && canCreateOrgMcp ? "org" : "user";
    const [mcpScope, setMcpScope] = useState(defaultMcpScope);
    const [mcpName, setMcpName] = useState("");
    const [mcpUrl, setMcpUrl] = useState("");
    const [mcpDescription, setMcpDescription] = useState("");
    const [mcpHeadersText, setMcpHeadersText] = useState("");
    const [mcpBusy, setMcpBusy] = useState(false);
    const [mcpError, setMcpError] = useState(null);
    const [mcpTestResult, setMcpTestResult] = useState(null);
    const createMcp = useCreateMcpServer();
    const inputRef = useRef(null);
    const fileUploadRef = useRef(null);
    useEffect(() => {
        if (open) {
            setView("menu");
            setMcpScope(defaultMcpScope);
            setMcpName("");
            setMcpUrl("");
            setMcpDescription("");
            setMcpHeadersText("");
            setMcpError(null);
            setMcpTestResult(null);
            setMcpBusy(false);
        }
    }, [open, defaultMcpScope]);
    useEffect(() => {
        if (view === "mcp-server") {
            setMcpError(null);
            setMcpTestResult(null);
            const t = setTimeout(() => inputRef.current?.focus(), 50);
            return () => clearTimeout(t);
        }
    }, [view]);
    const clearMcpFeedback = () => {
        setMcpError(null);
        setMcpTestResult(null);
    };
    const parseHeaderLines = (text) => {
        const out = {};
        for (const line of text.split(/\r?\n/)) {
            const trimmed = line.trim();
            if (!trimmed)
                continue;
            const idx = trimmed.indexOf(":");
            if (idx <= 0)
                continue;
            const key = trimmed.slice(0, idx).trim();
            const val = trimmed.slice(idx + 1).trim();
            if (!key || !val)
                continue;
            out[key] = val;
        }
        return Object.keys(out).length > 0 ? out : undefined;
    };
    const submitMcpServer = async () => {
        const name = mcpName.trim();
        const url = mcpUrl.trim();
        if (!name || !url || mcpBusy)
            return;
        const validationError = getMcpUrlValidationError(url);
        if (validationError) {
            setMcpError(validationError);
            setMcpTestResult(null);
            return;
        }
        setMcpError(null);
        setMcpBusy(true);
        try {
            await createMcp.mutateAsync({
                scope: mcpScope,
                name,
                url,
                headers: parseHeaderLines(mcpHeadersText),
                description: mcpDescription.trim() || undefined,
            });
            setOpen(false);
        }
        catch (err) {
            setMcpError(formatMcpServerError(err));
        }
        finally {
            setMcpBusy(false);
        }
    };
    const runMcpTest = async () => {
        const url = mcpUrl.trim();
        if (!url || mcpBusy)
            return;
        const validationError = getMcpUrlValidationError(url);
        if (validationError) {
            setMcpTestResult({ ok: false, message: validationError });
            setMcpError(null);
            return;
        }
        setMcpTestResult(null);
        setMcpError(null);
        setMcpBusy(true);
        try {
            const res = await testMcpServerUrl(url, parseHeaderLines(mcpHeadersText));
            if (res.ok) {
                setMcpTestResult({
                    ok: true,
                    message: `${res.toolCount ?? 0} tool${res.toolCount === 1 ? "" : "s"} available`,
                });
            }
            else {
                setMcpTestResult({ ok: false, message: res.error ?? "Failed" });
            }
        }
        catch (err) {
            setMcpTestResult({ ok: false, message: formatMcpServerError(err) });
        }
        finally {
            setMcpBusy(false);
        }
    };
    const menuItems = [
        {
            icon: _jsx(IconUpload, { className: "h-3.5 w-3.5" }),
            label: "Upload File",
            desc: "Images, PDFs, text/code, JSON, CSV",
            action: () => {
                setOpen(false);
                setTimeout(() => fileUploadRef.current?.click(), 0);
            },
        },
        {
            icon: _jsx(IconBulb, { className: "h-3.5 w-3.5" }),
            label: "Create Skill",
            desc: "Teach the agent a new ability",
            action: () => {
                onSelectMode?.("skill");
                setOpen(false);
            },
        },
        {
            icon: _jsx(IconClock, { className: "h-3.5 w-3.5" }),
            label: "Schedule Task",
            desc: "Run something on a schedule",
            action: () => {
                onSelectMode?.("job");
                setOpen(false);
            },
        },
        {
            icon: _jsx(IconBolt, { className: "h-3.5 w-3.5" }),
            label: "Create Automation",
            desc: "Set up a when-X-do-Y rule",
            action: () => {
                onSelectMode?.("automation");
                setOpen(false);
            },
        },
        {
            icon: _jsx(IconTool, { className: "h-3.5 w-3.5" }),
            label: "Create Extension",
            desc: "Build a mini app extension",
            action: () => {
                onSelectMode?.("extension");
                setOpen(false);
            },
        },
        {
            icon: _jsx(IconPlugConnected, { className: "h-3.5 w-3.5" }),
            label: "Connect MCP Server",
            desc: "Expose external tools to the agent",
            action: () => setView("mcp-server"),
        },
    ];
    const backButton = (_jsxs("button", { type: "button", onClick: () => {
            clearMcpFeedback();
            setView("menu");
        }, className: "flex items-center gap-1 text-[11px] text-muted-foreground hover:text-foreground mb-1.5", children: [_jsx(IconArrowLeft, { className: "h-3 w-3" }), "Back"] }));
    return (_jsxs(_Fragment, { children: [_jsx(ComposerPrimitive.AddAttachment, { asChild: true, children: _jsx("button", { ref: fileUploadRef, type: "button", className: "hidden", tabIndex: -1, "aria-hidden": true }) }), _jsxs(Popover, { open: open, onOpenChange: setOpen, children: [_jsxs(Tooltip, { children: [_jsx(TooltipTrigger, { asChild: true, children: _jsx(PopoverTrigger, { asChild: true, children: _jsx("button", { type: "button", className: "shrink-0 flex h-7 w-7 items-center justify-center rounded-md text-muted-foreground hover:text-foreground hover:bg-accent/50 disabled:opacity-30 disabled:cursor-not-allowed", children: _jsx(IconPlus, { className: "h-4 w-4" }) }) }) }), _jsx(TooltipContent, { children: "Add..." })] }), _jsxs(PopoverContent, { side: "top", align: "start", sideOffset: 8, className: "w-[260px] p-0 rounded-lg", style: { fontSize: 13, lineHeight: "normal" }, onOpenAutoFocus: (e) => e.preventDefault(), children: [view === "menu" && (_jsx("div", { className: "py-1", children: menuItems.map((item) => (_jsxs("button", { onClick: item.action, className: "flex w-full items-center gap-2.5 px-3 py-2 text-left hover:bg-accent/50", children: [_jsx("span", { className: "text-muted-foreground", children: item.icon }), _jsxs("div", { className: "min-w-0", children: [_jsx("div", { className: "text-[12px] font-medium text-foreground", children: item.label }), _jsx("div", { className: "mt-0.5 text-[10px] text-muted-foreground/60", children: item.desc })] })] }, item.label))) })), view === "mcp-server" && (_jsxs("div", { className: "p-3", children: [backButton, _jsx("label", { className: "mb-1 block text-[11px] font-semibold text-foreground", children: "Connect MCP Server" }), _jsx("p", { className: "mb-2 text-[10px] text-muted-foreground/60 leading-relaxed", children: "Point at any Streamable HTTP MCP server. Its tools become available to the agent. Use Personal for private or staging servers; use Organization only for vetted servers the whole org should share." }), _jsxs("div", { className: "space-y-2", children: [_jsxs("div", { className: "flex gap-1 rounded-md border border-border p-0.5", children: [_jsx("button", { type: "button", onClick: () => setMcpScope("user"), className: cn("flex-1 rounded px-2 py-1 text-[11px] font-medium", mcpScope === "user"
                                                            ? "bg-accent text-foreground"
                                                            : "text-muted-foreground hover:text-foreground"), children: "Personal" }), _jsxs(Tooltip, { children: [_jsx(TooltipTrigger, { asChild: true, children: _jsx("button", { type: "button", onClick: () => hasOrg && canCreateOrgMcp && setMcpScope("org"), disabled: !hasOrg || !canCreateOrgMcp, className: cn("flex-1 rounded px-2 py-1 text-[11px] font-medium", mcpScope === "org"
                                                                        ? "bg-accent text-foreground"
                                                                        : "text-muted-foreground hover:text-foreground", (!hasOrg || !canCreateOrgMcp) &&
                                                                        "cursor-not-allowed opacity-50 hover:text-muted-foreground"), children: "Organization" }) }), _jsx(TooltipContent, { children: !hasOrg
                                                                    ? "Join an organization to share MCP servers"
                                                                    : !canCreateOrgMcp
                                                                        ? "Only owners and admins can add org-scope servers"
                                                                        : undefined })] })] }), _jsx("input", { ref: inputRef, value: mcpName, onChange: (e) => {
                                                    setMcpName(e.target.value);
                                                    clearMcpFeedback();
                                                }, className: "w-full rounded-md border border-border bg-background px-2.5 py-1.5 text-[13px] text-foreground outline-none placeholder:text-muted-foreground/50 focus:ring-1 focus:ring-accent", placeholder: "Server name (e.g. zapier-staging)" }), _jsx("input", { value: mcpUrl, onChange: (e) => {
                                                    setMcpUrl(e.target.value);
                                                    clearMcpFeedback();
                                                }, className: "w-full rounded-md border border-border bg-background px-2.5 py-1.5 text-[13px] text-foreground outline-none placeholder:text-muted-foreground/50 focus:ring-1 focus:ring-accent", placeholder: "https://mcp.example.com/" }), _jsx("input", { value: mcpDescription, onChange: (e) => {
                                                    setMcpDescription(e.target.value);
                                                    clearMcpFeedback();
                                                }, className: "w-full rounded-md border border-border bg-background px-2.5 py-1.5 text-[13px] text-foreground outline-none placeholder:text-muted-foreground/50 focus:ring-1 focus:ring-accent", placeholder: "Description (optional)" }), _jsxs("div", { children: [_jsx("label", { className: "block text-[10px] font-medium text-foreground", children: "Headers" }), _jsx("p", { className: "mt-0.5 text-[10px] leading-snug text-muted-foreground/70", children: "Optional. One per line, for example Authorization: Bearer sk-..." })] }), _jsx("textarea", { value: mcpHeadersText, onChange: (e) => {
                                                    setMcpHeadersText(e.target.value);
                                                    clearMcpFeedback();
                                                }, rows: 2, className: "w-full resize-y rounded-md border border-border bg-background px-2.5 py-1.5 text-[12px] text-foreground outline-none placeholder:text-muted-foreground/50 focus:ring-1 focus:ring-accent", style: {
                                                    fontFamily: 'ui-monospace, SFMono-Regular, "SF Mono", Menlo, Consolas, monospace',
                                                }, placeholder: "Authorization: Bearer sk-..." }), mcpTestResult && (_jsxs("div", { className: cn("flex items-start gap-1 text-[11px] leading-snug", mcpTestResult.ok
                                                    ? "text-green-600 dark:text-green-400"
                                                    : "text-red-600 dark:text-red-400"), children: [mcpTestResult.ok && (_jsx(IconCheck, { className: "mt-0.5 h-3 w-3 shrink-0" })), _jsx("span", { className: "min-w-0 break-words", children: mcpTestResult.message })] })), mcpError && (_jsx("div", { className: "break-words text-[11px] leading-snug text-red-600 dark:text-red-400", children: mcpError }))] }), _jsxs("div", { className: "mt-2.5 flex items-center justify-between gap-2", children: [_jsx("button", { type: "button", onClick: runMcpTest, disabled: !mcpUrl.trim() || mcpBusy, className: "rounded-md border border-border bg-background px-2.5 py-1.5 text-[11px] font-medium text-foreground hover:bg-accent disabled:opacity-40 disabled:pointer-events-none", children: "Test" }), _jsx("button", { type: "button", onClick: submitMcpServer, disabled: !mcpName.trim() || !mcpUrl.trim() || mcpBusy, className: "rounded-md bg-accent px-3 py-1.5 text-[12px] font-medium text-foreground hover:bg-accent/80 disabled:opacity-40 disabled:pointer-events-none", children: mcpBusy ? (_jsx(IconLoader2, { className: "h-3 w-3 animate-spin" })) : ("Connect") })] })] }))] })] })] }));
}
//# sourceMappingURL=ComposerPlusMenu.js.map