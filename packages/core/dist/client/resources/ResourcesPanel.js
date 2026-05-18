import { jsx as _jsx, jsxs as _jsxs } from "react/jsx-runtime";
import { agentNativePath } from "../api-path.js";
import React, { useState, useRef, useCallback, useEffect } from "react";
import { IconPlus, IconUpload, IconArrowLeft, IconPencil, IconBulb, IconBolt, IconTrash, IconEye, IconCode, IconClock, IconMessageChatbot, IconExternalLink, IconLoader2, IconHelp, IconPlugConnected, IconCheck, } from "@tabler/icons-react";
import { cn } from "../utils.js";
import { sendToAgentChat } from "../agent-chat.js";
import { PromptComposer } from "../composer/PromptComposer.js";
import { ResourceTree } from "./ResourceTree.js";
import { ResourceEditor } from "./ResourceEditor.js";
import { serializeFrontmatter } from "../../resources/metadata.js";
import { useResourceTree, useResource, useCreateResource, useUpdateResource, useDeleteResource, useUploadResource, withMcpServersFolder, withAgentScratchFolder, } from "./use-resources.js";
import { formatMcpServerError, getMcpUrlValidationError, useMcpServers, useCreateMcpServer, useDeleteMcpServer, testMcpServerUrl, parseMcpVirtualId, } from "./use-mcp-servers.js";
import { McpServerDetail } from "./McpServerDetail.js";
import { useOrg } from "../org/hooks.js";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger, } from "../components/ui/tooltip.js";
import { Popover, PopoverContent, PopoverTrigger, } from "../components/ui/popover.js";
const WORKSPACE_DOCS_URL = "https://agent-native.com/docs/workspace";
const AGENT_MODEL_OPTIONS = [
    { value: "inherit", label: "Default model" },
    { value: "claude-sonnet-4-6", label: "Claude Sonnet 4.6" },
    { value: "claude-haiku-4-5-20251001", label: "Claude Haiku 4.5" },
];
function slugifyName(value) {
    return (value
        .toLowerCase()
        .replace(/[^a-z0-9]+/g, "-")
        .replace(/^-+|-+$/g, "") || "agent");
}
function buildAgentResourceContent({ name, description, model, tools, body, }) {
    const fields = [
        { key: "name", value: name },
        { key: "description", value: description },
        { key: "model", value: model },
        { key: "tools", value: tools },
        { key: "delegate-default", value: "false" },
    ];
    return serializeFrontmatter(fields) + body.trim() + "\n";
}
function CreateMenu({ scope, onCreateFile, onCreateResource, onCreateMcpServer, canCreateOrgMcp, hasOrg, onCreated, }) {
    const [open, setOpen] = useState(false);
    const [view, setView] = useState("menu");
    const [value, setValue] = useState("");
    const [agentName, setAgentName] = useState("");
    const [agentDescription, setAgentDescription] = useState("");
    const [agentModel, setAgentModel] = useState("inherit");
    const [agentInstructions, setAgentInstructions] = useState(`# Role\n\nDefine how this agent should work.\n\n## Focus\n\n- What kinds of tasks it should handle\n- What tone or approach it should use\n- Important constraints or preferences\n`);
    const defaultMcpScope = scope === "shared" && canCreateOrgMcp ? "org" : "user";
    const [mcpScope, setMcpScope] = useState(defaultMcpScope);
    const [mcpName, setMcpName] = useState("");
    const [mcpUrl, setMcpUrl] = useState("");
    const [mcpDescription, setMcpDescription] = useState("");
    const [mcpHeadersText, setMcpHeadersText] = useState("");
    const [mcpBusy, setMcpBusy] = useState(false);
    const [mcpError, setMcpError] = useState(null);
    const [mcpTestResult, setMcpTestResult] = useState(null);
    const inputRef = useRef(null);
    useEffect(() => {
        if (open) {
            setView("menu");
            setValue("");
            setAgentName("");
            setAgentDescription("");
            setAgentModel("inherit");
            setAgentInstructions(`# Role\n\nDefine how this agent should work.\n\n## Focus\n\n- What kinds of tasks it should handle\n- What tone or approach it should use\n- Important constraints or preferences\n`);
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
        if (view !== "menu" && view !== "agent-form") {
            setValue("");
            if (view === "mcp-server") {
                setMcpError(null);
                setMcpTestResult(null);
            }
            const t = setTimeout(() => inputRef.current?.focus(), 50);
            return () => clearTimeout(t);
        }
    }, [view]);
    const clearMcpFeedback = () => {
        setMcpError(null);
        setMcpTestResult(null);
    };
    const submitFile = () => {
        const trimmed = value.trim();
        if (trimmed) {
            onCreateFile(trimmed);
            setOpen(false);
        }
    };
    const submitSkill = (text = value) => {
        const trimmed = text.trim();
        if (!trimmed)
            return;
        sendToAgentChat({
            message: `Create a skill: ${trimmed}`,
            newTab: true,
            context: `The user wants to create an agent skill. Their description: "${trimmed}"

Follow the create-skill pattern to build this. Before writing:

1. **Determine the skill name** — derive a hyphen-case name from the description (e.g. "code review" → "code-review")
2. **Determine the skill type** — Pattern (architectural rule), Workflow (step-by-step), or Generator (scaffolding)
3. **Write the skill** as a ${scope} resource at path "skills/<name>/SKILL.md" using resource-write

The skill file MUST have YAML frontmatter with name and description (under 40 words), then markdown with:
- Clear rule/purpose statement
- Why this skill exists
- How to follow it (with code examples where helpful)
- Common violations to avoid
- Related skills

Template for a Pattern skill:
\`\`\`markdown
---
name: <hyphen-case-name>
description: >-
  <Under 40 words. When should this trigger?>
---

# <Skill Name>

## Rule
<One sentence: what must be true>

## Why
<Why this rule exists>

## How
<How to follow it, with code examples>

## Don't
<Common violations>
\`\`\`

Template for a Workflow skill:
\`\`\`markdown
---
name: <hyphen-case-name>
description: >-
  <Under 40 words. When should this trigger?>
---

# <Workflow Name>

## Prerequisites
<What must be in place>

## Steps
<Numbered steps with code examples>

## Verification
<How to confirm it worked>
\`\`\`

After creating, update the shared AGENTS.md resource to reference the new skill in its skills table.

Keep the skill concise (under 500 lines) and actionable.`,
            submit: true,
        });
        setOpen(false);
        onCreated?.();
    };
    const submitJob = (text = value) => {
        const trimmed = text.trim();
        if (!trimmed)
            return;
        sendToAgentChat({
            message: `Create a recurring job: ${trimmed}`,
            newTab: true,
            context: `The user wants to create a recurring job. Their description: "${trimmed}"

Use the manage-jobs tool with action "create" to create this. You need to:
1. Derive a hyphen-case name from the description
2. Convert the schedule to a cron expression (e.g., "every weekday at 9am" → "0 9 * * 1-5")
3. Write clear, self-contained instructions for what the agent should do each time the job runs
4. Create it in ${scope} scope

The job will run automatically on the schedule. Make the instructions specific — include which actions to call and what to do with results.`,
            submit: true,
        });
        setOpen(false);
    };
    const submitAgentPrompt = (text = value) => {
        const trimmed = text.trim();
        if (!trimmed)
            return;
        sendToAgentChat({
            message: `Create a custom agent: ${trimmed}`,
            newTab: true,
            context: `The user wants a reusable custom sub-agent profile for the workspace. Their description: "${trimmed}"

Create it as a ${scope} resource under "agents/<name>.md" using resource-write.

Requirements:
1. Derive a hyphen-case file name from the intent
2. Use YAML frontmatter with:
   - name
   - description
   - model (use "inherit" unless the request clearly needs a different model)
   - tools (set to "inherit")
   - delegate-default (set to false)
3. Put the main operating instructions in the markdown body
4. Keep it concise and directive, similar to a Claude Code-style custom agent

Template:
\`\`\`markdown
---
name: Design
description: >-
  Helps with product and interface design decisions.
model: inherit
tools: inherit
delegate-default: false
---

# Role

You are a focused design agent.

## Responsibilities

- ...

## Approach

- ...
\`\`\`

The result should be a reusable agent profile, not a one-off task response.`,
            submit: true,
        });
        setOpen(false);
        onCreated?.();
    };
    const submitAgentManual = () => {
        const trimmedName = agentName.trim();
        const trimmedDescription = agentDescription.trim();
        const trimmedInstructions = agentInstructions.trim();
        if (!trimmedName || !trimmedDescription || !trimmedInstructions)
            return;
        const slug = slugifyName(trimmedName);
        onCreateResource(`agents/${slug}.md`, buildAgentResourceContent({
            name: trimmedName,
            description: trimmedDescription,
            model: agentModel,
            tools: "inherit",
            body: trimmedInstructions,
        }), "text/markdown");
        setOpen(false);
        onCreated?.();
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
            const value = trimmed.slice(idx + 1).trim();
            if (!key || !value)
                continue;
            out[key] = value;
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
            await onCreateMcpServer({
                scope: mcpScope,
                name,
                url,
                headers: parseHeaderLines(mcpHeadersText),
                description: mcpDescription.trim() || undefined,
            });
            setOpen(false);
            onCreated?.();
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
            icon: _jsx(IconPlus, { className: "h-3.5 w-3.5" }),
            label: "Create File",
            desc: "Add a new file at a path",
            action: () => setView("file"),
        },
        {
            icon: _jsx(IconBulb, { className: "h-3.5 w-3.5" }),
            label: "Create Skill",
            desc: "Teach the agent a new ability",
            action: () => setView("skill"),
        },
        {
            icon: _jsx(IconClock, { className: "h-3.5 w-3.5" }),
            label: "Schedule Task",
            desc: "Run something on a schedule",
            action: () => setView("job"),
        },
        {
            icon: _jsx(IconMessageChatbot, { className: "h-3.5 w-3.5" }),
            label: "Create Custom Agent",
            desc: "Add a reusable sub-agent profile",
            action: () => setView("agent-mode"),
        },
        {
            icon: _jsx(IconBolt, { className: "h-3.5 w-3.5" }),
            label: "Create Automation",
            desc: "Set up a when-X-do-Y rule",
            action: () => {
                setOpen(false);
                window.dispatchEvent(new CustomEvent("agent-panel:set-mode", {
                    detail: { mode: "chat" },
                }));
                sendToAgentChat({
                    message: "Help me create a new automation. Ask me what I want to automate.",
                    context: `The user wants to create a new automation. Scope: personal. Use manage-automations with action=define to create it. Ask clarifying questions if needed about what event to trigger on, conditions, and what actions to take.`,
                    submit: true,
                    newTab: true,
                });
                onCreated?.();
            },
        },
        {
            icon: _jsx(IconPlugConnected, { className: "h-3.5 w-3.5" }),
            label: "Connect MCP Server",
            desc: "Expose external tools to the agent",
            action: () => setView("mcp-server"),
        },
    ];
    return (_jsxs(Popover, { open: open, onOpenChange: setOpen, children: [_jsxs(Tooltip, { children: [_jsx(TooltipTrigger, { asChild: true, children: _jsx(PopoverTrigger, { asChild: true, children: _jsx("button", { type: "button", className: cn("flex h-6 w-6 items-center justify-center rounded-md text-muted-foreground hover:text-foreground hover:bg-accent/50", open && "bg-accent/50 text-foreground"), children: _jsx(IconPlus, { className: "h-3.5 w-3.5" }) }) }) }), _jsx(TooltipContent, { children: "Create new..." })] }), _jsxs(PopoverContent, { align: "end", sideOffset: 6, collisionPadding: 8, className: cn("z-[260] p-0 text-[13px] leading-normal", view === "menu" || view === "file"
                    ? "w-[260px]"
                    : "max-h-[70vh] w-[calc(100vw-24px)] max-w-[380px] overflow-y-auto"), children: [view === "menu" && (_jsx("div", { className: "py-1", children: menuItems.map((item) => (_jsxs("button", { onClick: item.action, className: "flex w-full items-center gap-2.5 px-3 py-2 text-left hover:bg-accent/50", children: [_jsx("span", { className: "text-muted-foreground", children: item.icon }), _jsxs("div", { className: "min-w-0", children: [_jsx("div", { className: "text-[12px] font-medium text-foreground", children: item.label }), _jsx("div", { className: "mt-0.5 text-[10px] text-muted-foreground/60", children: item.desc })] })] }, item.label))) })), view === "file" && (_jsxs("div", { className: "p-3", children: [_jsx("label", { className: "mb-1.5 block text-[11px] font-medium text-muted-foreground", children: "File path" }), _jsx("input", { ref: inputRef, value: value, onChange: (e) => setValue(e.target.value), onKeyDown: (e) => {
                                    if (e.key === "Enter")
                                        submitFile();
                                    if (e.key === "Escape") {
                                        e.stopPropagation();
                                        setView("menu");
                                    }
                                }, className: "w-full rounded-md border border-border bg-background px-2.5 py-1.5 text-[13px] text-foreground outline-none placeholder:text-muted-foreground/50 focus:ring-1 focus:ring-accent", placeholder: "notes/ideas.md" }), _jsx("div", { className: "mt-2.5 flex justify-end", children: _jsx("button", { onClick: submitFile, disabled: !value.trim(), className: "rounded-md bg-accent px-3 py-1.5 text-[12px] font-medium text-foreground hover:bg-accent/80 disabled:opacity-40 disabled:pointer-events-none", children: "Create" }) })] })), view === "skill" && (_jsxs("div", { className: "p-3", children: [_jsx("label", { className: "mb-1 block text-[11px] font-semibold text-foreground", children: "Create Skill" }), _jsx("p", { className: "mb-2 text-[10px] text-muted-foreground/60 leading-relaxed", children: "Describe what kind of skill you want and the agent will create it." }), _jsx(PromptComposer, { autoFocus: true, placeholder: "e.g. A skill that reviews PRs for security issues and OWASP top 10 vulnerabilities", draftScope: "resources:create-skill", onSubmit: (text) => submitSkill(text) })] })), view === "job" && (_jsxs("div", { className: "p-3", children: [_jsx("label", { className: "mb-1 block text-[11px] font-semibold text-foreground", children: "Schedule Task" }), _jsx("p", { className: "mb-2 text-[10px] text-muted-foreground/60 leading-relaxed", children: "Describe what should happen and when." }), _jsx(PromptComposer, { autoFocus: true, placeholder: "e.g. Every weekday at 9am, check for overdue scorecards and send a Slack update", draftScope: "resources:create-job", onSubmit: (text) => submitJob(text) })] })), view === "agent-mode" && (_jsxs("div", { className: "p-3", children: [_jsx("label", { className: "mb-1 block text-[11px] font-semibold text-foreground", children: "Create Agent" }), _jsx("p", { className: "mb-2 text-[10px] leading-relaxed text-muted-foreground/60", children: "Build a reusable sub-agent profile for this workspace." }), _jsxs("div", { className: "space-y-2", children: [_jsxs("button", { onClick: () => setView("agent-prompt"), className: "flex w-full items-start gap-2 rounded-md border border-border px-3 py-2 text-left hover:bg-accent/40", children: [_jsx(IconPencil, { className: "mt-0.5 h-3.5 w-3.5 shrink-0 text-muted-foreground" }), _jsxs("div", { children: [_jsx("div", { className: "text-[12px] font-medium text-foreground", children: "Describe It" }), _jsx("div", { className: "text-[10px] text-muted-foreground/60", children: "Let the agent draft the profile from a prompt." })] })] }), _jsxs("button", { onClick: () => setView("agent-form"), className: "flex w-full items-start gap-2 rounded-md border border-border px-3 py-2 text-left hover:bg-accent/40", children: [_jsx(IconMessageChatbot, { className: "mt-0.5 h-3.5 w-3.5 shrink-0 text-muted-foreground" }), _jsxs("div", { children: [_jsx("div", { className: "text-[12px] font-medium text-foreground", children: "Fill Form" }), _jsx("div", { className: "text-[10px] text-muted-foreground/60", children: "Set the fields manually and start with a markdown template." })] })] })] })] })), view === "agent-prompt" && (_jsxs("div", { className: "p-3", children: [_jsx("label", { className: "mb-1 block text-[11px] font-semibold text-foreground", children: "Create Agent From Prompt" }), _jsxs("p", { className: "mb-2 text-[10px] text-muted-foreground/60 leading-relaxed", children: ["Describe the agent you want. It will be saved under", " ", _jsx("code", { children: "agents/" }), "."] }), _jsx(PromptComposer, { autoFocus: true, placeholder: "e.g. A design agent that critiques layouts, suggests UI direction, and prefers concise product reasoning", draftScope: "resources:create-agent", onSubmit: (text) => submitAgentPrompt(text) })] })), view === "agent-form" && (_jsxs("div", { className: "p-3", children: [_jsx("label", { className: "mb-2 block text-[11px] font-semibold text-foreground", children: "Create Agent Manually" }), _jsxs("div", { className: "space-y-2", children: [_jsx("input", { value: agentName, onChange: (e) => setAgentName(e.target.value), className: "w-full rounded-md border border-border bg-background px-2.5 py-1.5 text-[13px] text-foreground outline-none placeholder:text-muted-foreground/50 focus:ring-1 focus:ring-accent", placeholder: "Agent name" }), _jsx("input", { value: agentDescription, onChange: (e) => setAgentDescription(e.target.value), className: "w-full rounded-md border border-border bg-background px-2.5 py-1.5 text-[13px] text-foreground outline-none placeholder:text-muted-foreground/50 focus:ring-1 focus:ring-accent", placeholder: "Short description" }), _jsx("label", { className: "block text-[11px] font-medium text-muted-foreground", children: "Model" }), _jsx("select", { value: agentModel, onChange: (e) => setAgentModel(e.target.value), className: "w-full rounded-md border border-border bg-background px-2.5 py-1.5 text-[13px] text-foreground outline-none focus:ring-1 focus:ring-accent", children: AGENT_MODEL_OPTIONS.map((option) => (_jsx("option", { value: option.value, children: option.label }, option.value))) }), _jsx("label", { className: "block text-[11px] font-medium text-muted-foreground", children: "Instructions" }), _jsx("textarea", { value: agentInstructions, onChange: (e) => setAgentInstructions(e.target.value), rows: 8, className: "w-full resize-y rounded-md border border-border bg-background px-2.5 py-1.5 text-[13px] text-foreground outline-none placeholder:text-muted-foreground/50 focus:ring-1 focus:ring-accent", style: {
                                            fontFamily: 'ui-monospace, SFMono-Regular, "SF Mono", Menlo, Consolas, monospace',
                                            lineHeight: 1.5,
                                        } })] }), _jsx("div", { className: "mt-2.5 flex justify-end", children: _jsx("button", { onClick: submitAgentManual, disabled: !agentName.trim() ||
                                        !agentDescription.trim() ||
                                        !agentInstructions.trim(), className: "rounded-md bg-accent px-3 py-1.5 text-[12px] font-medium text-foreground hover:bg-accent/80 disabled:opacity-40 disabled:pointer-events-none", children: "Create" }) })] })), view === "mcp-server" && (_jsxs("div", { className: "p-3", children: [_jsx("label", { className: "mb-1 block text-[11px] font-semibold text-foreground", children: "Connect MCP Server" }), _jsxs("p", { className: "mb-2 text-[10px] text-muted-foreground/60 leading-relaxed", children: ["Point at any Streamable HTTP MCP server (Zapier, Cloudflare, internal tools). Its tools become available to the agent. Use Personal for private or staging servers; use Organization only for vetted servers the whole org should share.", " ", _jsxs("a", { href: "https://agent-native.com/docs/mcp-clients#remote-via-ui", target: "_blank", rel: "noopener noreferrer", className: "inline-flex items-center gap-0.5 text-muted-foreground/80 underline hover:text-foreground", children: ["Learn more", _jsx(IconExternalLink, { className: "inline h-2.5 w-2.5" })] })] }), _jsxs("div", { className: "space-y-2", children: [_jsxs("div", { className: "flex gap-1 rounded-md border border-border p-0.5", children: [_jsx("button", { type: "button", onClick: () => setMcpScope("user"), className: cn("flex-1 rounded px-2 py-1 text-[11px] font-medium", mcpScope === "user"
                                                    ? "bg-accent text-foreground"
                                                    : "text-muted-foreground hover:text-foreground"), children: "Personal" }), _jsxs(Tooltip, { children: [_jsx(TooltipTrigger, { asChild: true, children: _jsx("button", { type: "button", onClick: () => hasOrg && canCreateOrgMcp && setMcpScope("org"), disabled: !hasOrg || !canCreateOrgMcp, className: cn("flex-1 rounded px-2 py-1 text-[11px] font-medium", mcpScope === "org"
                                                                ? "bg-accent text-foreground"
                                                                : "text-muted-foreground hover:text-foreground", (!hasOrg || !canCreateOrgMcp) &&
                                                                "cursor-not-allowed opacity-50 hover:text-muted-foreground"), children: "Organization" }) }), _jsx(TooltipContent, { children: !hasOrg
                                                            ? "Join an organization to share MCP servers"
                                                            : !canCreateOrgMcp
                                                                ? "Only owners and admins can add org-scope servers"
                                                                : undefined })] })] }), _jsx("input", { value: mcpName, onChange: (e) => {
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
                                            : "text-red-600 dark:text-red-400"), children: [mcpTestResult.ok && (_jsx(IconCheck, { className: "mt-0.5 h-3 w-3 shrink-0" })), _jsx("span", { className: "min-w-0 break-words", children: mcpTestResult.message })] })), mcpError && (_jsx("div", { className: "break-words text-[11px] leading-snug text-red-600 dark:text-red-400", children: mcpError }))] }), _jsxs("div", { className: "mt-2.5 flex items-center justify-between gap-2", children: [_jsx("button", { type: "button", onClick: runMcpTest, disabled: !mcpUrl.trim() || mcpBusy, className: "rounded-md border border-border bg-background px-2.5 py-1.5 text-[11px] font-medium text-foreground hover:bg-accent disabled:opacity-40 disabled:pointer-events-none", children: "Test" }), _jsx("button", { type: "button", onClick: submitMcpServer, disabled: !mcpName.trim() || !mcpUrl.trim() || mcpBusy, className: "rounded-md bg-accent px-3 py-1.5 text-[12px] font-medium text-foreground hover:bg-accent/80 disabled:opacity-40 disabled:pointer-events-none", children: mcpBusy ? (_jsx(IconLoader2, { className: "h-3 w-3 animate-spin" })) : ("Connect") })] })] }))] })] }));
}
// ─── PathBreadcrumb ─────────────────────────────────────────────────────────
function PathBreadcrumb({ path }) {
    const parts = path.split("/").filter(Boolean);
    return (_jsx("div", { className: "flex items-center gap-0.5 text-[11px] text-muted-foreground/60 overflow-hidden", children: parts.map((part, i) => (_jsxs(React.Fragment, { children: [i > 0 && _jsx("span", { className: "shrink-0", children: "/" }), _jsx("span", { className: cn("truncate", i === parts.length - 1 && "text-muted-foreground"), children: part })] }, i))) }));
}
// ─── ResourcesPanel ─────────────────────────────────────────────────────────
const DEFAULT_AGENTS_MD_CLIENT = `# Agent Instructions

This file customizes how the AI agent behaves in this app. Edit it to add your own instructions, preferences, and context.

## What to put here

- **Preferences** — Tone, style, verbosity, response format
- **Context** — Domain knowledge, terminology, team conventions
- **Rules** — Things the agent should always/never do
- **Skills** — Reference skill files for specialized tasks (create them in the \`skills/\` folder)

## Skills

Create skill files under \`skills/<name>/SKILL.md\` to give the agent specialized knowledge. Reference them here:

| Skill | Path | Description |
|-------|------|-------------|
| *(use the skill button to create one)* | \`skills/example/SKILL.md\` | |
`;
// BuilderBrowserCard moved to settings/BrowserSection.tsx
export function ResourcesPanel() {
    const { data: org } = useOrg();
    // Non-admin org members get read-only access to organization resources.
    // Solo deployments (no orgId) behave as owner — users can edit their own.
    const canEditOrg = !org?.orgId || org.role === "owner" || org.role === "admin";
    const [activeScope, setActiveScope] = useState(canEditOrg ? "shared" : "personal");
    const [selectedResourceId, setSelectedResourceId] = useState(null);
    const [toolbarDeleteConfirmId, setToolbarDeleteConfirmId] = useState(null);
    const [dragOver, setDragOver] = useState(false);
    const [editorView, setEditorView] = useState(() => {
        try {
            const v = localStorage.getItem("resource-editor-view");
            if (v === "code")
                return "code";
        }
        catch { }
        return "visual";
    });
    useEffect(() => {
        setToolbarDeleteConfirmId(null);
    }, [selectedResourceId]);
    const [saveStatus, setSaveStatus] = useState("idle");
    const fileInputRef = useRef(null);
    const sharedTreeQuery = useResourceTree("shared");
    const personalTreeQuery = useResourceTree("personal");
    const mcpServersQuery = useMcpServers();
    const createMcpServer = useCreateMcpServer();
    const deleteMcpServer = useDeleteMcpServer();
    // Merge MCP servers into each scope's tree as a virtual `mcp-servers/`
    // folder. The servers live in the settings store, not the resources
    // table — the virtual ids carry the `mcp:<scope>:<id>` prefix that
    // `handleSelect` and `handleDelete` below recognize to route back to
    // the MCP endpoints.
    const personalTree = withAgentScratchFolder(withMcpServersFolder(personalTreeQuery.data ?? [], mcpServersQuery.data?.user ?? []));
    const sharedTree = withMcpServersFolder(sharedTreeQuery.data ?? [], mcpServersQuery.data?.org ?? []);
    const orgRole = mcpServersQuery.data?.role ?? org?.role ?? null;
    const hasOrgForMcp = !!(mcpServersQuery.data?.orgId ?? org?.orgId);
    const canCreateOrgMcp = hasOrgForMcp && (orgRole === "owner" || orgRole === "admin");
    // Virtual MCP server currently selected in the tree (or null for a real
    // resource / nothing). Resolved by scanning both trees' mcp folders for
    // a matching virtual id.
    const selectedMcpServer = React.useMemo(() => {
        const parsed = selectedResourceId
            ? parseMcpVirtualId(selectedResourceId)
            : null;
        if (!parsed)
            return null;
        const list = parsed.scope === "user"
            ? (mcpServersQuery.data?.user ?? [])
            : (mcpServersQuery.data?.org ?? []);
        return list.find((s) => s.id === parsed.serverId) ?? null;
    }, [selectedResourceId, mcpServersQuery.data]);
    // Sync activeScope once the org role arrives (canEditOrg is resolved async).
    useEffect(() => {
        if (!canEditOrg && activeScope === "shared") {
            setActiveScope("personal");
        }
    }, [canEditOrg, activeScope]);
    // Virtual MCP ids aren't in the resources store — skip the fetch so
    // useResource doesn't 404-flash.
    const resourceQuery = useResource(selectedResourceId && !parseMcpVirtualId(selectedResourceId)
        ? selectedResourceId
        : null);
    const createResource = useCreateResource();
    const updateResource = useUpdateResource();
    const deleteResource = useDeleteResource();
    const uploadResource = useUploadResource();
    // Ensure AGENTS.md exists in the organization scope when the panel opens.
    // The server also seeds it on table init; this is a safety net. Only attempt
    // for users who can write to organization resources — non-admins would just
    // get a 403.
    const seededRef = useRef(false);
    useEffect(() => {
        if (seededRef.current || !canEditOrg)
            return;
        seededRef.current = true;
        fetch(agentNativePath("/_agent-native/resources"), {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
                path: "AGENTS.md",
                content: DEFAULT_AGENTS_MD_CLIENT,
                shared: true,
                ifNotExists: true,
            }),
        }).catch(() => { });
    }, [canEditOrg]);
    // Are we viewing a file (editor) or the tree?
    const isEditing = selectedResourceId !== null;
    const isMcpSelected = !!selectedMcpServer;
    const handleSelect = useCallback((resource) => {
        setSelectedResourceId(resource.id);
    }, []);
    const handleBack = useCallback(() => {
        setSelectedResourceId(null);
    }, []);
    const handleCreateFile = useCallback((parentPath, name, scope) => {
        const path = parentPath ? `${parentPath}/${name}` : name;
        createResource.mutate({ path, content: "", shared: scope === "shared" }, {
            onSuccess: (data) => {
                setSelectedResourceId(data.id);
            },
        });
    }, [createResource]);
    const handleCreateFolder = useCallback((parentPath, name, scope) => {
        const path = parentPath ? `${parentPath}/${name}/.keep` : `${name}/.keep`;
        createResource.mutate({ path, content: "", shared: scope === "shared" });
    }, [createResource]);
    const handleCreateFromToolbar = useCallback((name) => {
        createResource.mutate({ path: name, content: "", shared: activeScope === "shared" }, {
            onSuccess: (data) => {
                setSelectedResourceId(data.id);
            },
        });
    }, [createResource, activeScope]);
    const handleCreateResourceFromToolbar = useCallback((path, content, mimeType) => {
        createResource.mutate({ path, content, mimeType, shared: activeScope === "shared" }, {
            onSuccess: (data) => {
                setSelectedResourceId(data.id);
            },
        });
    }, [activeScope, createResource]);
    const handleDelete = useCallback((id) => {
        const mcp = parseMcpVirtualId(id);
        if (mcp) {
            deleteMcpServer.mutate({ id: mcp.serverId, scope: mcp.scope }, {
                onSuccess: () => {
                    if (selectedResourceId === id)
                        setSelectedResourceId(null);
                },
            });
            return;
        }
        deleteResource.mutate(id);
        if (selectedResourceId === id) {
            setSelectedResourceId(null);
        }
    }, [deleteResource, deleteMcpServer, selectedResourceId]);
    const handleCreateMcpServer = useCallback(async (args) => {
        const server = await createMcpServer.mutateAsync(args);
        // Select the newly-created virtual entry so the detail view opens.
        setSelectedResourceId(`mcp:${args.scope}:${server.id}`);
    }, [createMcpServer]);
    const handleRename = useCallback((id, newPath) => {
        updateResource.mutate({ id, path: newPath });
    }, [updateResource]);
    const handleSave = useCallback((content) => {
        if (!selectedResourceId)
            return;
        updateResource.mutate({ id: selectedResourceId, content });
    }, [updateResource, selectedResourceId]);
    const handleUploadFiles = useCallback((files) => {
        for (let i = 0; i < files.length; i++) {
            const file = files[i];
            const formData = new FormData();
            formData.append("file", file);
            formData.append("shared", activeScope === "shared" ? "true" : "false");
            uploadResource.mutate(formData);
        }
    }, [uploadResource, activeScope]);
    const handleDragOver = useCallback((e) => {
        e.preventDefault();
        e.stopPropagation();
        setDragOver(true);
    }, []);
    const handleDragLeave = useCallback((e) => {
        e.preventDefault();
        e.stopPropagation();
        setDragOver(false);
    }, []);
    const handleDrop = useCallback((e) => {
        e.preventDefault();
        e.stopPropagation();
        setDragOver(false);
        if (e.dataTransfer.files.length > 0) {
            handleUploadFiles(e.dataTransfer.files);
        }
    }, [handleUploadFiles]);
    return (_jsxs("div", { className: cn("relative flex h-full flex-col min-h-0", dragOver && "ring-2 ring-inset ring-accent"), onDragOver: handleDragOver, onDragLeave: handleDragLeave, onDrop: handleDrop, children: [isEditing ? (_jsxs("div", { className: "flex shrink-0 items-center justify-between border-b border-border px-2 py-1.5", children: [_jsxs("div", { className: "flex items-center gap-1.5 min-w-0", children: [_jsx(TooltipProvider, { delayDuration: 200, children: _jsxs(Tooltip, { children: [_jsx(TooltipTrigger, { asChild: true, children: _jsx("button", { onClick: handleBack, "aria-label": "Back to workspace", className: "flex h-6 w-6 shrink-0 items-center justify-center rounded-md text-muted-foreground hover:text-foreground hover:bg-accent/50", children: _jsx(IconArrowLeft, { className: "h-3.5 w-3.5" }) }) }), _jsx(TooltipContent, { children: "Back to workspace" })] }) }), selectedMcpServer ? (_jsx(PathBreadcrumb, { path: `mcp-servers/${selectedMcpServer.name}.json` })) : resourceQuery.data ? (_jsx(PathBreadcrumb, { path: resourceQuery.data.path })) : null] }), _jsxs("div", { className: "flex items-center gap-1 shrink-0", children: [!selectedMcpServer && resourceQuery.data && (_jsx("span", { "aria-live": "polite", className: "mr-1 w-16 text-right text-[11px] text-muted-foreground/60", children: saveStatus === "saving"
                                    ? "Saving..."
                                    : saveStatus === "saved"
                                        ? "Saved"
                                        : "" })), !selectedMcpServer &&
                                resourceQuery.data &&
                                (resourceQuery.data.mimeType === "text/markdown" ||
                                    resourceQuery.data.path.endsWith(".md")) && (_jsx("div", { className: "flex items-center gap-0.5 mr-1", children: _jsxs(TooltipProvider, { delayDuration: 200, children: [_jsxs(Tooltip, { children: [_jsx(TooltipTrigger, { asChild: true, children: _jsx("button", { onClick: () => setEditorView("visual"), "aria-label": "Visual editor", className: cn("flex h-6 w-6 items-center justify-center rounded-md", editorView === "visual"
                                                            ? "bg-accent text-foreground"
                                                            : "text-muted-foreground hover:text-foreground hover:bg-accent/50"), children: _jsx(IconEye, { className: "h-3.5 w-3.5" }) }) }), _jsx(TooltipContent, { children: "Visual editor" })] }), _jsxs(Tooltip, { children: [_jsx(TooltipTrigger, { asChild: true, children: _jsx("button", { onClick: () => setEditorView("code"), "aria-label": "Code editor", className: cn("flex h-6 w-6 items-center justify-center rounded-md", editorView === "code"
                                                            ? "bg-accent text-foreground"
                                                            : "text-muted-foreground hover:text-foreground hover:bg-accent/50"), children: _jsx(IconCode, { className: "h-3.5 w-3.5" }) }) }), _jsx(TooltipContent, { children: "Code editor" })] })] }) })), _jsx(TooltipProvider, { delayDuration: 200, children: _jsxs(Tooltip, { children: [_jsx(TooltipTrigger, { asChild: true, children: _jsx("button", { onClick: () => {
                                                    if (!selectedResourceId)
                                                        return;
                                                    if (toolbarDeleteConfirmId === selectedResourceId) {
                                                        handleDelete(selectedResourceId);
                                                        setToolbarDeleteConfirmId(null);
                                                    }
                                                    else {
                                                        setToolbarDeleteConfirmId(selectedResourceId);
                                                    }
                                                }, "aria-label": toolbarDeleteConfirmId === selectedResourceId
                                                    ? "Confirm delete resource"
                                                    : "Delete resource", className: cn("flex h-6 w-6 items-center justify-center rounded-md text-muted-foreground hover:text-destructive hover:bg-accent/50", toolbarDeleteConfirmId === selectedResourceId &&
                                                    "bg-destructive/10 text-destructive"), children: _jsx(IconTrash, { className: "h-3.5 w-3.5" }) }) }), _jsx(TooltipContent, { children: toolbarDeleteConfirmId === selectedResourceId
                                                ? "Click again to delete"
                                                : "Delete resource" })] }) })] })] })) : (_jsxs("div", { className: "absolute top-1 right-1 z-10 flex items-center gap-1", children: [_jsx(CreateMenu, { scope: activeScope, onCreateFile: handleCreateFromToolbar, onCreateResource: handleCreateResourceFromToolbar, onCreateMcpServer: handleCreateMcpServer, canCreateOrgMcp: canCreateOrgMcp, hasOrg: hasOrgForMcp }), _jsx(TooltipProvider, { delayDuration: 200, children: _jsxs(Tooltip, { children: [_jsx(TooltipTrigger, { asChild: true, children: _jsx("button", { onClick: () => fileInputRef.current?.click(), "aria-label": "Upload file", className: "flex h-6 w-6 items-center justify-center rounded-md text-muted-foreground hover:text-foreground hover:bg-accent/50", children: _jsx(IconUpload, { className: "h-3.5 w-3.5" }) }) }), _jsx(TooltipContent, { children: "Upload file" })] }) }), _jsx(TooltipProvider, { delayDuration: 200, children: _jsxs(Tooltip, { children: [_jsx(TooltipTrigger, { asChild: true, children: _jsx("a", { href: WORKSPACE_DOCS_URL, target: "_blank", rel: "noopener noreferrer", "aria-label": "Open Workspace docs", className: "flex h-6 w-6 items-center justify-center rounded-md text-muted-foreground hover:text-foreground hover:bg-accent/50", children: _jsx(IconHelp, { className: "h-3.5 w-3.5" }) }) }), _jsx(TooltipContent, { side: "left", sideOffset: 8, children: "Open Workspace docs" })] }) }), _jsx("input", { ref: fileInputRef, type: "file", multiple: true, className: "hidden", onChange: (e) => {
                            if (e.target.files && e.target.files.length > 0) {
                                handleUploadFiles(e.target.files);
                                e.target.value = "";
                            }
                        } })] })), _jsx("div", { className: "flex flex-1 flex-col min-h-0 overflow-hidden", children: isEditing ? (selectedMcpServer ? (_jsx("div", { className: "flex-1 min-h-0 overflow-hidden", children: _jsx(McpServerDetail, { server: selectedMcpServer }) })) : selectedResourceId && resourceQuery.data ? (_jsx("div", { className: "flex-1 min-h-0 overflow-hidden", children: _jsx(ResourceEditor, { resource: resourceQuery.data, onSave: handleSave, view: editorView, onViewChange: setEditorView, onSaveStatusChange: setSaveStatus, hideToolbar: true }) })) : resourceQuery.isError ? (_jsx("div", { className: "flex flex-1 items-center justify-center text-[12px] text-destructive/70", children: "Failed to load resource" })) : (_jsx("div", { className: "flex flex-1 items-center justify-center text-[12px] text-muted-foreground/50", children: "Loading..." }))) : (_jsxs("div", { className: "flex-1 min-h-0 overflow-y-auto", children: [!personalTreeQuery.isLoading &&
                            !sharedTreeQuery.isLoading &&
                            (personalTreeQuery.data ?? []).length === 0 &&
                            (sharedTreeQuery.data ?? []).length === 0 && (_jsxs("div", { className: "mx-2 mt-2 rounded-md border border-border bg-muted/30 p-2.5 text-[11px] text-muted-foreground", children: [_jsx("p", { className: "mb-1 font-medium text-foreground", children: "This is your Workspace" }), _jsx("p", { className: "mb-1.5 leading-snug", children: "Files the agent reads and writes \u2014 notes, instructions, skills, custom agents, scheduled jobs. They live in the database, so they persist across sessions and deploys." }), _jsxs("p", { className: "mb-2 leading-snug", children: [_jsx("span", { className: "text-foreground", children: "Personal" }), " is just for you.", " ", _jsx("span", { className: "text-foreground", children: "Organization" }), " is visible to everyone in your organization", org?.orgId ? " — only admins can edit." : "."] }), _jsxs("a", { href: WORKSPACE_DOCS_URL, target: "_blank", rel: "noopener noreferrer", className: "inline-flex items-center gap-1 text-foreground hover:underline", children: ["Learn more", _jsx(IconExternalLink, { className: "h-3 w-3" })] })] })), _jsx(ResourceTree, { tree: personalTree, isLoading: personalTreeQuery.isLoading, deletingId: deleteResource.isPending
                                ? deleteResource.variables
                                : deleteMcpServer.isPending
                                    ? `mcp:${deleteMcpServer.variables.scope}:${deleteMcpServer.variables.id}`
                                    : null, selectedId: selectedResourceId, onSelect: handleSelect, onCreateFile: (parentPath, name) => handleCreateFile(parentPath, name, "personal"), onCreateFolder: (parentPath, name) => handleCreateFolder(parentPath, name, "personal"), onDelete: handleDelete, onRename: handleRename, onDrop: handleUploadFiles, title: "Personal", titleTooltip: "Files visible only to you" }), _jsx(ResourceTree, { tree: sharedTree, isLoading: sharedTreeQuery.isLoading, deletingId: deleteResource.isPending
                                ? deleteResource.variables
                                : deleteMcpServer.isPending
                                    ? `mcp:${deleteMcpServer.variables.scope}:${deleteMcpServer.variables.id}`
                                    : null, selectedId: selectedResourceId, onSelect: handleSelect, onCreateFile: (parentPath, name) => handleCreateFile(parentPath, name, "shared"), onCreateFolder: (parentPath, name) => handleCreateFolder(parentPath, name, "shared"), onDelete: handleDelete, onRename: handleRename, onDrop: handleUploadFiles, title: "Organization", titleTooltip: canEditOrg
                                ? "Files visible to everyone in your organization"
                                : "Files visible to everyone in your organization. Read-only — only admins can edit.", readOnly: !canEditOrg, headingHint: !canEditOrg ? "Read only" : undefined })] })) })] }));
}
//# sourceMappingURL=ResourcesPanel.js.map