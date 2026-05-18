import { jsx as _jsx, jsxs as _jsxs, Fragment as _Fragment } from "react/jsx-runtime";
import { useState, useRef, useEffect, useCallback, useImperativeHandle, useMemo, } from "react";
import { useComposer, useComposerRuntime, } from "@assistant-ui/react";
import { useEditor, EditorContent } from "@tiptap/react";
import StarterKit from "@tiptap/starter-kit";
import Placeholder from "@tiptap/extension-placeholder";
import { FileReference } from "./extensions/FileReference.js";
import { SkillReference } from "./extensions/SkillReference.js";
import { MentionReference } from "./extensions/MentionReference.js";
import { MentionPopover } from "./MentionPopover.js";
import { useMentionSearch } from "./use-mention-search.js";
import { useSkills } from "./use-skills.js";
import { IconArrowUp, IconCheck, IconChevronDown, IconChevronRight, IconBulb, IconClock, IconBolt, IconTool, IconX, IconClipboardList, IconPencil, IconPlugConnected, } from "@tabler/icons-react";
import * as PopoverPrimitive from "@radix-ui/react-popover";
import { useBuilderConnectFlow } from "../settings/useBuilderStatus.js";
import { useVoiceDictation } from "./useVoiceDictation.js";
import { VoiceButton, VoiceRecordingOverlay } from "./VoiceButton.js";
import { ComposerPlusMenu } from "./ComposerPlusMenu.js";
import { sendToAgentChat } from "../agent-chat.js";
import { tryDelegateBuildRequestToBuilder } from "../builder-frame.js";
import { getComposerDraftKey } from "./draft-key.js";
import { createPastedTextFile, shouldConvertPasteToAttachment, } from "./pasted-text.js";
import { getReasoningEffortOptionsForModel, reasoningEffortLabel, } from "../../shared/reasoning-effort.js";
import { Tooltip, TooltipContent, TooltipTrigger, } from "../components/ui/tooltip.js";
export function canSubmitComposerContent(options) {
    return (!options.disabled &&
        (options.hasEditorContent || options.attachmentCount > 0));
}
export function getComposerSubmitIntentForEnterKey(event, isMac) {
    if (event.key !== "Enter" || event.shiftKey)
        return null;
    const queuedModifierPressed = isMac ? event.metaKey : event.ctrlKey;
    if (queuedModifierPressed)
        return "queued";
    if (!event.metaKey && !event.ctrlKey)
        return "immediate";
    return null;
}
export function displayableComposerModeMessage(options) {
    const modePrompt = options.trimmedText ||
        (options.attachmentCount > 0 ? "Use the attached context." : "");
    return `${options.messagePrefix}${modePrompt}`;
}
const BUILT_IN_COMMANDS = [
    { name: "clear", description: "Start a new chat", icon: "clear" },
    { name: "new", description: "Start a new chat", icon: "new" },
    { name: "history", description: "Browse all chats", icon: "history" },
    { name: "plan", description: "Switch to read-only planning", icon: "plan" },
    { name: "act", description: "Switch back to acting", icon: "act" },
    { name: "help", description: "Show available commands", icon: "help" },
];
function normalizeSlashCommandName(name) {
    return name.replace(/^\/+/, "").trim().toLowerCase();
}
function mergeSlashCommands(commands) {
    const seen = new Set();
    const merged = [];
    for (const command of commands) {
        const name = normalizeSlashCommandName(command.name);
        if (!name || seen.has(name))
            continue;
        seen.add(name);
        merged.push({ ...command, name });
    }
    return merged;
}
function mergeSlashSkills(skills) {
    const seen = new Set();
    const merged = [];
    for (const skill of skills) {
        const key = `${skill.source ?? ""}:${skill.path ?? ""}:${skill.name}`;
        if (!skill.name || seen.has(key))
            continue;
        seen.add(key);
        merged.push(skill);
    }
    return merged;
}
const COMPOSER_MODE_CONFIGS = {
    skill: {
        label: "Create Skill",
        icon: IconBulb,
        placeholder: "Describe the skill you want to create...",
        messagePrefix: "Create a skill: ",
        getContext: (prompt) => `The user wants to create an agent skill. Their description: "${prompt}"

Follow the create-skill pattern to build this. Before writing:

1. **Determine the skill name** — derive a hyphen-case name from the description (e.g. "code review" → "code-review")
2. **Determine the skill type** — Pattern (architectural rule), Workflow (step-by-step), or Generator (scaffolding)
3. **Write the skill** as a personal resource at path "skills/<name>/SKILL.md" using resource-write

The skill file MUST have YAML frontmatter with name and description (under 40 words), then markdown with:
- Clear rule/purpose statement
- Why this skill exists
- How to follow it (with code examples where helpful)
- Common violations to avoid
- Related skills

After creating, update the shared AGENTS.md resource to reference the new skill in its skills table.

Keep the skill concise (under 500 lines) and actionable.`,
    },
    job: {
        label: "Schedule Task",
        icon: IconClock,
        placeholder: "Describe what should happen and when...",
        messagePrefix: "Create a recurring job: ",
        getContext: (prompt) => `The user wants to create a recurring job. Their description: "${prompt}"

Use the manage-jobs tool with action "create" to create this. You need to:
1. Derive a hyphen-case name from the description
2. Convert the schedule to a cron expression (e.g., "every weekday at 9am" → "0 9 * * 1-5")
3. Write clear, self-contained instructions for what the agent should do each time the job runs
4. Create it in personal scope

The job will run automatically on the schedule. Make the instructions specific — include which actions to call and what to do with results.`,
    },
    automation: {
        label: "Create Automation",
        icon: IconBolt,
        placeholder: "Describe what you want to automate...",
        messagePrefix: "Create an automation: ",
        beforeSend: () => {
            window.dispatchEvent(new CustomEvent("agent-panel:set-mode", {
                detail: { mode: "chat" },
            }));
        },
        getContext: (prompt) => `The user wants to create a new automation. Scope: personal. Their description: "${prompt}"

Use manage-automations with action=define to create it. Ask clarifying questions if needed about what event to trigger on, conditions, and what actions to take.`,
    },
    extension: {
        label: "Create Extension",
        icon: IconTool,
        placeholder: "Describe the interactive extension you want to build...",
        messagePrefix: "Create an extension: ",
        getContext: (prompt) => `The user wants to create an interactive extension (sandboxed mini-app). Their description: "${prompt}"

Use the create-extension action with Alpine.js HTML content. The extension runs as a sandboxed iframe with Tailwind CSS and modest default canvas padding. For edge-to-edge layouts, put data-extension-layout="full-bleed" on the outermost element.

After creating the extension, navigate the user to it with set-url-path using pathname "/extensions/<id>".

Make the extension functional and visually polished. Extensions can use extensionFetch() for external API calls, appAction()/appFetch() for app operations, extensionData for per-extension persistence, and dbQuery()/dbExec() only for existing app tables.

Prefer appAction()/appFetch() for app data. Some actions return JSON strings for CLI compatibility, so parse string results before counting rows or reading arrays. Do not guess raw SQL table names or columns for app data; use dbQuery()/dbExec() only when the table is known to exist in the current schema.`,
    },
};
function ComposerModeChip({ mode, onRemove, }) {
    const config = COMPOSER_MODE_CONFIGS[mode];
    const Icon = config.icon;
    return (_jsxs("span", { className: "inline-flex items-center gap-1 rounded-md border border-border bg-muted/50 px-1.5 py-0.5 text-xs font-medium text-foreground", children: [_jsx(Icon, { className: "h-3 w-3 text-muted-foreground" }), config.label, _jsx("button", { type: "button", onClick: onRemove, className: "ml-0.5 rounded-sm text-muted-foreground hover:text-foreground cursor-pointer", children: _jsx(IconX, { className: "h-3 w-3" }) })] }));
}
function plainTextToDoc(text) {
    const lines = text.length > 0 ? text.split(/\r?\n/) : [""];
    return {
        type: "doc",
        content: lines.map((line) => ({
            type: "paragraph",
            content: line ? [{ type: "text", text: line }] : [],
        })),
    };
}
export function createTiptapComposerExtensions(getPlaceholder) {
    return [
        StarterKit.configure({
            heading: false,
            horizontalRule: false,
            bulletList: false,
            orderedList: false,
            listItem: false,
            listKeymap: false,
            blockquote: false,
            codeBlock: false,
            strike: false,
            italic: false,
            bold: false,
            code: false,
            dropcursor: false,
            gapcursor: false,
            link: false,
            trailingNode: false,
            underline: false,
        }),
        Placeholder.configure({
            placeholder: getPlaceholder,
            emptyEditorClass: "is-editor-empty",
            showOnlyCurrent: false,
        }),
        FileReference,
        SkillReference,
        MentionReference,
    ];
}
function ModeSelector({ mode, onChange, planModeDisabled = false, planModeDisabledReason = "Open Brain Desktop to use Plan mode.", }) {
    const [open, setOpen] = useState(false);
    return (_jsxs(PopoverPrimitive.Root, { open: open, onOpenChange: setOpen, children: [_jsx(PopoverPrimitive.Trigger, { asChild: true, children: _jsxs("button", { type: "button", "aria-label": mode === "build" ? "Act mode" : "Plan mode", "data-agent-composer-slot": "mode-button", className: "agent-composer-mode-button shrink-0 flex items-center gap-1 rounded-md px-2 py-1 text-[12px] font-medium text-muted-foreground hover:bg-accent/50 hover:text-foreground", children: [mode === "build" ? "Act" : "Plan", _jsx(IconChevronDown, { className: "h-3 w-3 opacity-60" })] }) }), _jsx(PopoverPrimitive.Portal, { children: _jsxs(PopoverPrimitive.Content, { side: "top", align: "end", sideOffset: 6, "data-agent-native-composer-popover": "true", className: "z-[260] w-60 rounded-lg border border-border bg-popover py-1 shadow-lg animate-in fade-in-0 zoom-in-95", style: { fontSize: 13 }, children: [_jsxs("button", { type: "button", onClick: () => {
                                onChange("build");
                                setOpen(false);
                            }, className: "flex w-full items-center gap-3 px-3 py-2 hover:bg-accent/50 text-left", children: [_jsx(IconPencil, { className: "h-4 w-4 shrink-0 text-muted-foreground" }), _jsxs("div", { className: "flex-1 min-w-0", children: [_jsx("span", { className: "font-medium text-foreground text-[13px]", children: "Act" }), _jsx("p", { className: "text-[11px] text-muted-foreground mt-0.5", children: "Use tools and make approved changes" })] }), mode === "build" && (_jsx(IconCheck, { className: "h-3.5 w-3.5 shrink-0 text-blue-500" }))] }), _jsxs("button", { type: "button", disabled: planModeDisabled, title: planModeDisabled ? planModeDisabledReason : undefined, onClick: () => {
                                if (planModeDisabled)
                                    return;
                                onChange("plan");
                                setOpen(false);
                            }, className: `flex w-full items-center gap-3 px-3 py-2 text-left ${planModeDisabled
                                ? "cursor-not-allowed opacity-60"
                                : "hover:bg-accent/50"}`, children: [_jsx(IconClipboardList, { className: "h-4 w-4 shrink-0 text-muted-foreground" }), _jsxs("div", { className: "flex-1 min-w-0", children: [_jsx("span", { className: "font-medium text-foreground text-[13px]", children: "Plan" }), _jsx("p", { className: "text-[11px] text-muted-foreground mt-0.5", children: planModeDisabled
                                                ? planModeDisabledReason
                                                : "Read-only research and approval first" })] }), mode === "plan" && !planModeDisabled && (_jsx(IconCheck, { className: "h-3.5 w-3.5 shrink-0 text-blue-500" }))] })] }) })] }));
}
const FRIENDLY_MODEL_NAMES = {
    auto: "Default model",
    "grok-code-fast": "Grok Code Fast",
    "qwen3-coder": "Qwen3 Coder",
    "kimi-k2-5": "Kimi K2.5",
    "deepseek-v3-1": "DeepSeek v3.1",
};
function friendlyModelName(model) {
    if (FRIENDLY_MODEL_NAMES[model])
        return FRIENDLY_MODEL_NAMES[model];
    // Claude: claude-{tier}-{major}-{minor}[-dateYYYYMMDD] → Tier Major.Minor
    const claude = model.match(/^claude-(opus|sonnet|haiku)-(\d+)-(\d+)(?:-\d{8,})?$/);
    if (claude) {
        const tier = claude[1][0].toUpperCase() + claude[1].slice(1);
        return `${tier} ${claude[2]}.${claude[3]}`;
    }
    // GPT: gpt-{major}-{minor}[-suffix] or gpt-{major}.{minor}[-suffix]
    if (model.startsWith("gpt-")) {
        const rest = model.slice(4);
        const gpt = rest.match(/^(\d+)[.-](\d+)(?:[.-](.+))?$/);
        if (gpt) {
            const suffix = gpt[3]
                ? " " +
                    gpt[3]
                        .split("-")
                        .map((s) => s[0].toUpperCase() + s.slice(1))
                        .join(" ")
                : "";
            return `GPT-${gpt[1]}.${gpt[2]}${suffix}`;
        }
        return `GPT-${rest}`;
    }
    if (/^o\d/.test(model))
        return model;
    // Gemini: gemini-{major}-{minor}-{variant}[-preview] → Gemini Major.Minor Variant
    const geminiVersioned = model.match(/^gemini-(\d+)-(\d+)-(.+?)(?:-preview)?$/);
    if (geminiVersioned) {
        const variant = geminiVersioned[3]
            .split("-")
            .map((s) => s[0].toUpperCase() + s.slice(1))
            .join(" ");
        return `Gemini ${geminiVersioned[1]}.${geminiVersioned[2]} ${variant}`;
    }
    // Gemini: gemini-{version.parts}[-preview] → Gemini Version Parts
    const gemini = model.match(/^gemini-(.+?)(?:-preview)?$/);
    if (gemini) {
        const parts = gemini[1]
            .split("-")
            .map((s) => s[0].toUpperCase() + s.slice(1))
            .join(" ");
        return `Gemini ${parts}`;
    }
    return model;
}
/**
 * Deduplicate models to only the latest version per family.
 * e.g. [opus-4-7, opus-4-6, opus-4-5] → [opus-4-7]
 */
function latestModelsOnly(models) {
    const seen = new Set();
    return models.filter((m) => {
        // Claude: family = tier (opus/sonnet/haiku)
        const claude = m.match(/^claude-(opus|sonnet|haiku)-/);
        if (claude) {
            if (seen.has(claude[1]))
                return false;
            seen.add(claude[1]);
            return true;
        }
        // GPT: family = gpt-{major} (e.g. gpt-5.4 and gpt-5.4-mini are different)
        // OpenAI reasoning: each is its own family
        // Gemini: family = gemini-{major} + variant
        const gemini = m.match(/^gemini-(\d+(?:\.\d+)?)-(.+?)(?:-preview)?$/);
        if (gemini) {
            const family = gemini[2]; // flash, pro, etc.
            if (seen.has(`gemini-${family}`))
                return false;
            seen.add(`gemini-${family}`);
            return true;
        }
        return true;
    });
}
function ModelSelector({ model, effort = "auto", engines, onChange, onEffortChange, providerConnectStatusEnabled = true, onConnectProvider, }) {
    const [open, setOpen] = useState(false);
    const autoModelGroup = engines.find((group) => group.models.includes("auto"));
    const providerGroups = useMemo(() => engines
        .map((group) => ({
        ...group,
        models: group.models.filter((candidate) => candidate !== "auto"),
    }))
        .filter((group) => group.models.length > 0), [engines]);
    const effortOptions = model === "auto"
        ? [
            "auto",
            "low",
            "medium",
            "high",
            "xhigh",
            "max",
        ]
        : getReasoningEffortOptionsForModel(model);
    // Collapse non-selected families by default. The family containing the
    // currently-selected model stays expanded so the user sees their pick at
    // a glance; clicking another family's header expands it inline.
    const selectedGroupKey = useMemo(() => {
        const found = providerGroups.find((g) => g.models.includes(model));
        return found ? `${found.engine}:${found.label}` : null;
    }, [model, providerGroups]);
    const [expandedGroups, setExpandedGroups] = useState(() => new Set(selectedGroupKey ? [selectedGroupKey] : []));
    // Reset expansion when the popover re-opens so the picker always lands
    // on the "selected family expanded, others collapsed" view.
    useEffect(() => {
        if (open) {
            setExpandedGroups(new Set(selectedGroupKey ? [selectedGroupKey] : []));
        }
    }, [open, selectedGroupKey]);
    const toggleGroup = useCallback((key) => {
        setExpandedGroups((prev) => {
            const next = new Set(prev);
            if (next.has(key))
                next.delete(key);
            else
                next.add(key);
            return next;
        });
    }, []);
    // When Builder.io isn't connected, surface a one-click connect path —
    // it unlocks every model family (Claude, OpenAI, Gemini) without the
    // user having to paste individual API keys.
    const builderFlow = useBuilderConnectFlow({
        enabled: providerConnectStatusEnabled,
        trackingSource: "composer_builder_cta",
    });
    const hasConfiguredBuilderModels = providerGroups.some((group) => group.engine === "builder" && group.configured);
    const showBuilderCta = (builderFlow.hasFetchedStatus ||
        (!providerConnectStatusEnabled && !!onConnectProvider)) &&
        !builderFlow.configured &&
        !builderFlow.envManaged &&
        !hasConfiguredBuilderModels;
    const openLlmSettings = useCallback(() => {
        try {
            window.location.hash = "llm";
        }
        catch { }
        window.dispatchEvent(new CustomEvent("agent-panel:open-settings"));
        setOpen(false);
    }, []);
    return (_jsxs(PopoverPrimitive.Root, { open: open, onOpenChange: setOpen, children: [_jsx(PopoverPrimitive.Trigger, { asChild: true, children: _jsxs("button", { type: "button", "data-agent-composer-slot": "model-button", className: "agent-composer-model-button flex min-w-0 max-w-[10.5rem] shrink items-center gap-1 rounded-md px-2 py-1 text-[12px] font-medium text-muted-foreground hover:bg-accent/50 hover:text-foreground", children: [_jsx("span", { className: "min-w-0 truncate", children: friendlyModelName(model) }), effortOptions.length > 0 && (_jsxs("span", { className: "agent-composer-model-effort min-w-0 shrink truncate text-muted-foreground/70", children: ["\u00B7 ", reasoningEffortLabel(effort)] })), _jsx(IconChevronDown, { className: "h-3 w-3 shrink-0 opacity-60" })] }) }), _jsx(PopoverPrimitive.Portal, { children: _jsxs(PopoverPrimitive.Content, { side: "top", align: "end", sideOffset: 6, "data-agent-native-composer-popover": "true", className: "z-[260] max-h-[500px] w-72 overflow-y-auto rounded-lg border border-border bg-popover py-1 shadow-lg animate-in fade-in-0 zoom-in-95", style: { fontSize: 13 }, children: [showBuilderCta && (_jsxs(_Fragment, { children: [_jsxs("button", { type: "button", onClick: () => {
                                        if (onConnectProvider) {
                                            onConnectProvider();
                                        }
                                        else {
                                            builderFlow.start();
                                        }
                                    }, disabled: !onConnectProvider && builderFlow.connecting, className: "flex w-full items-start gap-2 px-3 py-2 text-left hover:bg-accent/50 disabled:opacity-60", children: [_jsx(IconPlugConnected, { className: "h-4 w-4 shrink-0 mt-0.5 text-blue-500" }), _jsxs("span", { className: "flex-1 min-w-0", children: [_jsx("span", { className: "block text-[12px] font-medium text-foreground", children: !onConnectProvider && builderFlow.connecting
                                                        ? "Connecting Builder.io…"
                                                        : "Connect Builder.io" }), _jsx("span", { className: "block text-[11px] text-muted-foreground", children: "Free credits for Claude, OpenAI & Gemini" })] })] }), _jsx("div", { className: "my-1 border-t border-border" })] })), autoModelGroup && (_jsxs("button", { type: "button", onClick: () => {
                                onChange("auto", autoModelGroup.engine);
                                setOpen(false);
                            }, className: "flex w-full items-center gap-3 px-3 py-1.5 text-left hover:bg-accent/50", children: [_jsx("span", { className: "flex-1 min-w-0 text-[13px] text-foreground truncate", children: "Auto" }), model === "auto" && (_jsx(IconCheck, { className: "h-3.5 w-3.5 shrink-0 text-blue-500" }))] })), autoModelGroup && providerGroups.length > 0 && (_jsx("div", { className: "my-1 border-t border-border" })), providerGroups.map((group) => {
                            const models = latestModelsOnly(group.models);
                            const groupKey = `${group.engine}:${group.label}`;
                            const isExpanded = expandedGroups.has(groupKey);
                            return (_jsxs("div", { children: [_jsxs("div", { className: "flex items-center hover:bg-accent/30", children: [_jsxs("button", { type: "button", onClick: () => toggleGroup(groupKey), className: "flex flex-1 min-w-0 items-center gap-1.5 px-2 py-1.5 cursor-pointer text-left", children: [_jsx(IconChevronRight, { className: `h-3 w-3 shrink-0 text-muted-foreground transition-transform ${isExpanded ? "rotate-90" : ""}` }), _jsx("span", { className: "text-[11px] font-medium text-muted-foreground uppercase tracking-wide shrink-0", children: group.label }), !isExpanded && groupKey === selectedGroupKey && (_jsx("span", { className: "text-[11px] text-muted-foreground/80 truncate", children: friendlyModelName(model) }))] }), !group.configured && (_jsx("button", { type: "button", className: "text-[10px] text-muted-foreground/60 hover:text-foreground cursor-pointer pr-3 py-1.5", onClick: openLlmSettings, children: "needs API key" }))] }), isExpanded &&
                                        models.map((m) => (_jsxs("button", { type: "button", onClick: () => {
                                                if (!group.configured) {
                                                    openLlmSettings();
                                                    return;
                                                }
                                                onChange(m, group.engine);
                                                const nextOptions = getReasoningEffortOptionsForModel(m);
                                                if (effort !== "auto" &&
                                                    nextOptions.length > 0 &&
                                                    !nextOptions.includes(effort)) {
                                                    onEffortChange?.("auto");
                                                }
                                                setOpen(false);
                                            }, className: `flex w-full items-center gap-3 pl-7 pr-3 py-1.5 text-left ${group.configured
                                                ? "hover:bg-accent/50"
                                                : "opacity-40 cursor-default"}`, children: [_jsx("span", { className: "flex-1 min-w-0 text-[13px] text-foreground truncate", children: friendlyModelName(m) }), m === model && group.configured && (_jsx(IconCheck, { className: "h-3.5 w-3.5 shrink-0 text-blue-500" }))] }, m)))] }, groupKey));
                        }), effortOptions.length > 0 && (_jsxs(_Fragment, { children: [_jsx("div", { className: "my-1 border-t border-border" }), _jsx("div", { className: "px-3 py-1.5 text-[11px] font-medium text-muted-foreground uppercase tracking-wide", children: "Reasoning" }), effortOptions.map((option) => (_jsxs("button", { type: "button", onClick: () => onEffortChange?.(option), className: "flex w-full items-center gap-3 px-3 py-1.5 text-left hover:bg-accent/50", children: [_jsx("span", { className: "flex-1 min-w-0 text-[13px] text-foreground truncate", children: reasoningEffortLabel(option) }), option === effort && (_jsx(IconCheck, { className: "h-3.5 w-3.5 shrink-0 text-blue-500" }))] }, option)))] }))] }) })] }));
}
export function TiptapComposer({ placeholder = "Message agent...", disabled = false, focusRef, initialText, initialTextKey, onSubmit, clearOnSubmit = true, onTextChange, actionButton, extraActionButton, attachButton, modeControl, toolbarSlot, layoutVariant = "default", slashCommands = [], slashSkills = [], includeDefaultSlashCommands = true, includeDefaultSlashSkills = true, onSlashCommand, execMode, onExecModeChange, planModeDisabled = false, planModeDisabledReason, voiceEnabled = true, selectedModel, selectedEffort, availableModels, onModelChange, onEffortChange, providerConnectStatusEnabled, onConnectProvider, draftScope, plusMenuMode = "full", interceptBuildRequestsForBuilder = false, }) {
    const [popover, setPopover] = useState(null);
    const popoverRef = useRef(null);
    const composerRuntime = useComposerRuntime();
    const [editorHasText, setEditorHasText] = useState(false);
    const composerText = useComposer((state) => state.text);
    const composerAttachments = useComposer((state) => state.attachments);
    const canSend = canSubmitComposerContent({
        hasEditorContent: editorHasText,
        attachmentCount: composerAttachments.length,
        disabled,
    });
    const [composerMode, setComposerMode] = useState(null);
    const composerModeRef = useRef(null);
    const isMac = typeof navigator !== "undefined" &&
        /Mac|iPhone|iPad/.test(navigator.userAgent);
    // Refs for values accessed in handleKeyDown (ProseMirror doesn't re-bind)
    const popoverStateRef = useRef(null);
    const execModeRef = useRef(execMode);
    execModeRef.current = execMode;
    const onExecModeChangeRef = useRef(onExecModeChange);
    onExecModeChangeRef.current = onExecModeChange;
    const planModeDisabledRef = useRef(planModeDisabled);
    planModeDisabledRef.current = planModeDisabled;
    const { items: mentionItems, isLoading: mentionsLoading } = useMentionSearch(popover?.type === "@" ? popover.query : "", popover?.type === "@");
    const { skills, hint, isLoading: skillsLoading, } = useSkills(includeDefaultSlashSkills && popover?.type === "/");
    const allSlashCommands = useMemo(() => mergeSlashCommands([
        ...(includeDefaultSlashCommands ? BUILT_IN_COMMANDS : []),
        ...slashCommands,
    ]), [includeDefaultSlashCommands, slashCommands]);
    const allSlashSkills = useMemo(() => mergeSlashSkills([
        ...(includeDefaultSlashSkills ? skills : []),
        ...slashSkills,
    ]), [includeDefaultSlashSkills, skills, slashSkills]);
    const filteredCommands = useMemo(() => {
        if (!popover || popover.type !== "/")
            return allSlashCommands;
        const q = popover.query.toLowerCase();
        if (!q)
            return allSlashCommands;
        return allSlashCommands.filter((c) => c.name.toLowerCase().includes(q) ||
            c.description.toLowerCase().includes(q));
    }, [allSlashCommands, popover]);
    const filteredSkills = useMemo(() => {
        if (!popover || popover.type !== "/")
            return allSlashSkills;
        const q = popover.query.toLowerCase();
        if (!q)
            return allSlashSkills;
        return allSlashSkills.filter((s) => s.name.toLowerCase().includes(q) ||
            s.description?.toLowerCase().includes(q));
    }, [allSlashSkills, popover]);
    // Keep refs in sync with state
    const mentionItemsRef = useRef(mentionItems);
    mentionItemsRef.current = mentionItems;
    const filteredCommandsRef = useRef(filteredCommands);
    filteredCommandsRef.current = filteredCommands;
    const filteredSkillsRef = useRef(filteredSkills);
    filteredSkillsRef.current = filteredSkills;
    const onSlashCommandRef = useRef(onSlashCommand);
    onSlashCommandRef.current = onSlashCommand;
    const onTextChangeRef = useRef(onTextChange);
    onTextChangeRef.current = onTextChange;
    const initialTextKeyRef = useRef(undefined);
    const closePopover = useCallback(() => {
        setPopover(null);
        popoverStateRef.current = null;
    }, []);
    // Persist draft to localStorage so hot-reloads don't lose the prompt
    const draftKey = getComposerDraftKey(draftScope);
    const draftTimerRef = useRef(undefined);
    // Tiptap reads extension config once at init; ref keeps runtime prop
    // changes visible to Placeholder's function form.
    const placeholderRef = useRef(placeholder);
    useEffect(() => {
        placeholderRef.current = composerMode
            ? COMPOSER_MODE_CONFIGS[composerMode].placeholder
            : placeholder;
    }, [placeholder, composerMode]);
    const editor = useEditor({
        extensions: createTiptapComposerExtensions(() => placeholderRef.current),
        editable: !disabled,
        onCreate: ({ editor: ed }) => {
            // Restore draft on mount
            try {
                if (initialText !== undefined) {
                    ed.commands.setContent(plainTextToDoc(initialText));
                    ed.commands.focus("end");
                    setEditorHasText(ed.state.doc.textContent.trim().length > 0);
                    initialTextKeyRef.current = initialTextKey ?? initialText;
                }
                else {
                    const saved = localStorage.getItem(draftKey);
                    if (saved) {
                        ed.commands.setContent(saved);
                        ed.commands.focus("end");
                        setEditorHasText(ed.state.doc.textContent.trim().length > 0);
                    }
                }
                onTextChangeRef.current?.(ed.state.doc.textContent.trim());
            }
            catch { }
        },
        onUpdate: ({ editor: ed }) => {
            // Drive the send button's enabled state from the actual editor contents;
            // the composer runtime is only synced on submit, so its isEmpty lags.
            let hasContent = ed.state.doc.textContent.trim().length > 0;
            if (!hasContent) {
                ed.state.doc.descendants((node) => {
                    if (node.type.name === "mentionReference" ||
                        node.type.name === "fileReference" ||
                        node.type.name === "skillReference") {
                        hasContent = true;
                        return false;
                    }
                    return true;
                });
            }
            setEditorHasText(hasContent);
            onTextChangeRef.current?.(ed.state.doc.textContent.trim());
            // Debounce-save draft to localStorage
            clearTimeout(draftTimerRef.current);
            draftTimerRef.current = setTimeout(() => {
                try {
                    const html = ed.getHTML();
                    const isEmpty = !ed.state.doc.textContent.trim();
                    if (isEmpty) {
                        localStorage.removeItem(draftKey);
                    }
                    else {
                        localStorage.setItem(draftKey, html);
                    }
                }
                catch { }
            }, 300);
        },
        editorProps: {
            attributes: {
                "data-agent-composer-variant": layoutVariant,
                "data-agent-composer-slot": "editor-input",
                class: "agent-composer-prosemirror flex-1 resize-none bg-transparent text-sm text-foreground outline-none leading-[1.625rem] min-h-[3.25rem] max-h-[10rem] overflow-y-auto",
            },
            handlePaste: (_view, event) => {
                const pastedText = event.clipboardData?.getData("text/plain") ?? "";
                const files = Array.from(event.clipboardData?.files ?? []).filter((file) => file.type.startsWith("image/"));
                if (files.length > 0) {
                    event.preventDefault();
                    const attachments = files.map((file) => {
                        // SimpleImageAttachmentAdapter uses file.name as the attachment id.
                        // Clipboard images (e.g. screenshots) are typically all named
                        // "image.png", so a second paste would replace the first instead of
                        // appending. Prepend a unique token so each paste gets a distinct id.
                        const uniqueName = `${Date.now()}-${Math.random().toString(36).slice(2)}-${file.name}`;
                        return new File([file], uniqueName, { type: file.type });
                    });
                    // Google Docs rich clipboard payloads can contain both embedded
                    // image files and the document text. Since handling files means we
                    // prevent Tiptap's default paste, preserve any text as its own chip
                    // instead of silently dropping the source material.
                    if (pastedText.trim()) {
                        attachments.push(createPastedTextFile(pastedText));
                    }
                    void Promise.all(attachments.map((file) => composerRuntime.addAttachment(file))).catch((error) => {
                        console.error("Error adding pasted attachment:", error);
                    });
                    return true;
                }
                // Page-sized text pastes turn into a `Pasted text` attachment chip so
                // the prompt stays readable while normal paragraphs and lists stay
                // inline.
                if (shouldConvertPasteToAttachment(pastedText)) {
                    event.preventDefault();
                    void composerRuntime
                        .addAttachment(createPastedTextFile(pastedText))
                        .catch((error) => {
                        console.error("Error adding pasted-text attachment:", error);
                    });
                    return true;
                }
                return false;
            },
            handleDrop: (_view, event) => {
                // Drag-and-drop files (decks, images, PDFs, etc.) into the composer.
                // Without this, the browser navigates to the dropped file, which is
                // surprising — users expect drop to attach the file like the "+" menu.
                const dataTransfer = event.dataTransfer;
                const droppedFiles = Array.from(dataTransfer?.files ?? []);
                if (droppedFiles.length === 0)
                    return false;
                event.preventDefault();
                // Make image filenames unique so consecutive screenshots (all named
                // `image.png`) don't collide on the attachment id, mirroring the
                // paste handler's behavior.
                const attachments = droppedFiles.map((file) => {
                    if (!file.type.startsWith("image/"))
                        return file;
                    const uniqueName = `${Date.now()}-${Math.random().toString(36).slice(2)}-${file.name}`;
                    return new File([file], uniqueName, { type: file.type });
                });
                void Promise.all(attachments.map((file) => composerRuntime.addAttachment(file))).catch((error) => {
                    console.error("Error adding dropped attachment:", error);
                });
                return true;
            },
            handleKeyDown: (view, event) => {
                const pop = popoverStateRef.current;
                // Handle popover keyboard nav
                if (pop) {
                    if (event.key === "ArrowUp") {
                        event.preventDefault();
                        popoverRef.current?.moveUp();
                        return true;
                    }
                    if (event.key === "ArrowDown") {
                        event.preventDefault();
                        popoverRef.current?.moveDown();
                        return true;
                    }
                    if (event.key === "Enter") {
                        event.preventDefault();
                        const idx = popoverRef.current?.getSelectedIndex() ?? 0;
                        const currentCommands = filteredCommandsRef.current;
                        const currentSkills = filteredSkillsRef.current;
                        if (pop.type === "@") {
                            const item = popoverRef.current?.getSelectedMention();
                            if (item)
                                selectMention(view, pop, item);
                        }
                        else if (pop.type === "/") {
                            const cmd = popoverRef.current?.getSelectedCommand();
                            if (cmd) {
                                executeCommand(view, pop, cmd);
                            }
                            else {
                                const skillIdx = idx - currentCommands.length;
                                if (currentSkills[skillIdx]) {
                                    selectSkill(view, pop, currentSkills[skillIdx]);
                                }
                            }
                        }
                        return true;
                    }
                    if (event.key === "Escape") {
                        event.preventDefault();
                        popoverStateRef.current = null;
                        setPopover(null);
                        return true;
                    }
                    if (event.key === " " && pop.query === "") {
                        popoverStateRef.current = null;
                        setPopover(null);
                        return false;
                    }
                }
                // Backspace removes composer mode chip when editor is empty
                if (event.key === "Backspace" && composerModeRef.current) {
                    const { from, to } = view.state.selection;
                    if (view.state.doc.textContent.trim() === "" &&
                        from === to &&
                        from <= 1) {
                        setComposerMode(null);
                        composerModeRef.current = null;
                        return true;
                    }
                }
                // Keyboard shortcut toggles Act/Plan mode from inside the editor.
                if (event.key === "Tab" && event.shiftKey) {
                    event.preventDefault();
                    const current = execModeRef.current;
                    const cb = onExecModeChangeRef.current;
                    if (current && cb) {
                        const next = current === "build" ? "plan" : "build";
                        if (next !== "plan" || !planModeDisabledRef.current) {
                            cb(next);
                        }
                    }
                    return true;
                }
                // Submit on Enter. Shift+Enter falls through to Tiptap for a newline;
                // Cmd+Enter on macOS / Ctrl+Enter elsewhere marks the submit queued.
                const submitIntent = getComposerSubmitIntentForEnterKey(event, isMac);
                if (submitIntent) {
                    event.preventDefault();
                    submitComposer(submitIntent);
                    return true;
                }
                // Detect @ trigger — only when preceded by start-of-text, space, or newline
                // (not after alphanumeric chars, which would indicate an email address)
                if (event.key === "@") {
                    const { from } = view.state.selection;
                    const textBefore = view.state.doc.textBetween(Math.max(0, from - 1), from);
                    if (from === 1 || textBefore === "" || /\s/.test(textBefore)) {
                        const coords = view.coordsAtPos(from);
                        setTimeout(() => {
                            const state = {
                                type: "@",
                                position: { top: coords.top, left: coords.left },
                                startPos: view.state.selection.from,
                                query: "",
                            };
                            popoverStateRef.current = state;
                            setPopover(state);
                        }, 0);
                    }
                    return false;
                }
                // Detect / trigger (only at start of line or after whitespace)
                if (event.key === "/") {
                    const { from } = view.state.selection;
                    const textBefore = view.state.doc.textBetween(Math.max(0, from - 1), from);
                    if (from === 1 || textBefore === "" || /\s/.test(textBefore)) {
                        const coords = view.coordsAtPos(from);
                        setTimeout(() => {
                            const state = {
                                type: "/",
                                position: { top: coords.top, left: coords.left },
                                startPos: view.state.selection.from,
                                query: "",
                            };
                            popoverStateRef.current = state;
                            setPopover(state);
                        }, 0);
                    }
                    return false;
                }
                return false;
            },
        },
    });
    useImperativeHandle(focusRef, () => ({
        focus() {
            editor?.commands.focus("end");
        },
    }));
    const handleSelectMode = useCallback((mode) => {
        setComposerMode(mode);
        composerModeRef.current = mode;
        setTimeout(() => editor?.commands.focus("end"), 50);
    }, [editor]);
    // --- Live voice transcription: text appears in the editor as the user speaks ---
    const voiceAnchorRef = useRef(null);
    const prevVoiceInsertRef = useRef("");
    const handleLiveUpdate = useCallback((finalText, interimText) => {
        const ed = editor;
        if (!ed)
            return;
        if (voiceAnchorRef.current == null) {
            const { from } = ed.state.selection;
            const prevChar = from > 1 ? ed.state.doc.textBetween(from - 1, from) : "";
            if (prevChar && !/\s/.test(prevChar)) {
                ed.chain().insertContent(" ").run();
            }
            voiceAnchorRef.current = ed.state.selection.from;
            prevVoiceInsertRef.current = "";
        }
        const anchor = voiceAnchorRef.current;
        const prevLen = prevVoiceInsertRef.current.length;
        const newText = finalText + interimText;
        if (newText === prevVoiceInsertRef.current)
            return;
        ed.chain()
            .deleteRange({ from: anchor, to: anchor + prevLen })
            .insertContentAt(anchor, newText)
            .run();
        prevVoiceInsertRef.current = newText;
    }, [editor]);
    const insertTranscript = useCallback((text) => {
        const ed = editor;
        if (!ed)
            return;
        const anchor = voiceAnchorRef.current;
        if (anchor != null) {
            const prevLen = prevVoiceInsertRef.current.length;
            if (text) {
                ed.chain()
                    .focus()
                    .deleteRange({ from: anchor, to: anchor + prevLen })
                    .insertContentAt(anchor, text + " ")
                    .run();
            }
            else if (prevLen > 0) {
                ed.chain()
                    .deleteRange({ from: anchor, to: anchor + prevLen })
                    .run();
            }
            voiceAnchorRef.current = null;
            prevVoiceInsertRef.current = "";
        }
        else if (text) {
            const { from } = ed.state.selection;
            const prevChar = from > 1 ? ed.state.doc.textBetween(from - 1, from) : "";
            const needsLead = prevChar && !/\s/.test(prevChar);
            ed.chain()
                .focus()
                .insertContent((needsLead ? " " : "") + text + " ")
                .run();
        }
    }, [editor]);
    const voice = useVoiceDictation({
        onTranscript: insertTranscript,
        onLiveUpdate: handleLiveUpdate,
    });
    // Clean up live text if voice session ends without a final transcript (cancel/error)
    useEffect(() => {
        if (voice.state === "idle" && voiceAnchorRef.current != null) {
            const anchor = voiceAnchorRef.current;
            const prevLen = prevVoiceInsertRef.current.length;
            if (editor && prevLen > 0) {
                editor
                    .chain()
                    .deleteRange({ from: anchor, to: anchor + prevLen })
                    .run();
            }
            voiceAnchorRef.current = null;
            prevVoiceInsertRef.current = "";
        }
    }, [voice.state, editor]);
    // Global shortcut: Cmd/Ctrl + Shift + M toggles dictation. Escape cancels
    // while recording. Scoped to avoid firing when focus is outside the app.
    useEffect(() => {
        if (!voiceEnabled || !voice.supported)
            return;
        const handler = (e) => {
            const isToggleCombo = e.key.toLowerCase() === "m" &&
                e.shiftKey &&
                (e.metaKey || e.ctrlKey) &&
                !e.altKey;
            if (isToggleCombo) {
                e.preventDefault();
                if (voice.state === "recording" || voice.state === "starting") {
                    voice.stop();
                }
                else if (voice.state !== "transcribing") {
                    void voice.start();
                }
                return;
            }
            if (e.key === "Escape" &&
                (voice.state === "recording" || voice.state === "starting")) {
                e.preventDefault();
                voice.cancel();
            }
        };
        window.addEventListener("keydown", handler);
        return () => window.removeEventListener("keydown", handler);
    }, [voiceEnabled, voice]);
    const extractComposerPayload = useCallback(() => {
        const ed = editor;
        if (!ed) {
            return { text: "", references: [] };
        }
        const references = [];
        // Build text that preserves @mentions (getText() strips them).
        // Walk the document and reconstruct with @name for mention/file/skill nodes.
        const textParts = [];
        ed.state.doc.descendants((node) => {
            if (node.isText) {
                textParts.push(node.text);
            }
            else if (node.type.name === "mentionReference") {
                textParts.push(`@[${node.attrs.label}|${node.attrs.icon || "file"}]`);
            }
            else if (node.type.name === "fileReference") {
                const label = node.attrs.path?.split("/").pop() || node.attrs.path;
                textParts.push(`@[${label}|file]`);
            }
            else if (node.type.name === "skillReference") {
                textParts.push(`/${node.attrs.name}`);
            }
            else if (node.type.name === "hardBreak") {
                textParts.push("\n");
            }
            else if (node.type.name === "paragraph" &&
                textParts.length > 0 &&
                textParts[textParts.length - 1] !== "\n") {
                textParts.push("\n");
            }
        });
        const text = textParts.join("").trim();
        ed.state.doc.descendants((node) => {
            if (node.type.name === "fileReference") {
                // Legacy support
                references.push({
                    type: "file",
                    path: node.attrs.path,
                    name: node.attrs.path?.split("/").pop() || node.attrs.path,
                    source: node.attrs.source || "codebase",
                });
            }
            else if (node.type.name === "mentionReference") {
                const refType = node.attrs.refType;
                references.push({
                    type: refType === "file"
                        ? "file"
                        : refType === "agent"
                            ? "agent"
                            : refType === "custom-agent"
                                ? "custom-agent"
                                : "mention",
                    path: node.attrs.refPath || "",
                    name: node.attrs.label,
                    source: node.attrs.source,
                    refType: node.attrs.refType,
                    refId: node.attrs.refId,
                });
            }
            else if (node.type.name === "skillReference") {
                references.push({
                    type: "skill",
                    path: node.attrs.path,
                    name: node.attrs.name,
                    source: node.attrs.source || "codebase",
                });
            }
        });
        return { text, references };
    }, [editor]);
    const syncComposerState = useCallback(() => {
        const { text, references } = extractComposerPayload();
        composerRuntime.setText(text);
        composerRuntime.setRunConfig(references.length > 0 ? { custom: { references } } : {});
        return { text, references };
    }, [composerRuntime, extractComposerPayload]);
    const submitComposer = useCallback((intent = "immediate") => {
        const ed = editor;
        if (!ed)
            return;
        const { text, references } = syncComposerState();
        const attachments = composerRuntime.getState().attachments;
        if (!text.trim() && references.length === 0 && attachments.length === 0)
            return;
        const cancelActiveVoice = () => {
            if (voice.state === "recording" ||
                voice.state === "starting" ||
                voice.state === "transcribing") {
                voice.cancel();
            }
        };
        // Intercept slash commands typed directly (e.g. "/clear" + Enter)
        const trimmed = text.trim();
        if (trimmed.startsWith("/") && references.length === 0) {
            const cmdName = normalizeSlashCommandName(trimmed);
            const matched = allSlashCommands.find((c) => c.name === cmdName);
            if (matched) {
                ed.commands.clearContent();
                try {
                    localStorage.removeItem(draftKey);
                }
                catch { }
                closePopover();
                onSlashCommandRef.current?.(matched.name);
                return;
            }
        }
        // Composer mode: send with context via agent chat bridge
        if (composerMode) {
            const config = COMPOSER_MODE_CONFIGS[composerMode];
            config.beforeSend?.();
            const message = displayableComposerModeMessage({
                messagePrefix: config.messagePrefix,
                trimmedText: trimmed,
                attachmentCount: attachments.length,
            });
            const modePrompt = trimmed ||
                (attachments.length > 0 ? "Use the attached context." : "");
            if (attachments.length > 0) {
                composerRuntime.setText(`${message}\n\n<context>\n${config.getContext(modePrompt)}\n</context>`);
                composerRuntime.send();
            }
            else {
                sendToAgentChat({
                    message,
                    context: config.getContext(modePrompt),
                    submit: true,
                });
            }
            cancelActiveVoice();
            ed.commands.clearContent();
            setEditorHasText(false);
            setComposerMode(null);
            composerModeRef.current = null;
            try {
                localStorage.removeItem(draftKey);
            }
            catch { }
            closePopover();
            return;
        }
        // Builder iframe delegation: when this app is mounted inside the
        // Builder.io webview and the user typed a "build me an app/agent"
        // prompt, hand it up to the parent Builder chat instead of sending
        // it to this app's domain agent. Builder is the code-writing agent;
        // the local agent (dispatch, mail, etc.) cannot scaffold workspace
        // apps from inside its own iframe.
        if (interceptBuildRequestsForBuilder &&
            tryDelegateBuildRequestToBuilder(trimmed)) {
            cancelActiveVoice();
            ed.commands.clearContent();
            setEditorHasText(false);
            try {
                localStorage.removeItem(draftKey);
            }
            catch { }
            closePopover();
            return;
        }
        if (onSubmit) {
            onSubmit(text, references, attachments, { intent });
            // Clear any pending attachments now that the host has them.
            void composerRuntime.clearAttachments().catch(() => { });
            if (!clearOnSubmit) {
                closePopover();
                return;
            }
        }
        else {
            composerRuntime.send();
        }
        cancelActiveVoice();
        ed.commands.clearContent();
        setEditorHasText(false);
        try {
            localStorage.removeItem(draftKey);
        }
        catch { }
        closePopover();
    }, [
        closePopover,
        composerMode,
        composerRuntime,
        editor,
        interceptBuildRequestsForBuilder,
        clearOnSubmit,
        onSubmit,
        syncComposerState,
        voice,
        allSlashCommands,
    ]);
    // Helper functions that operate on the editor view directly
    // These are called from handleKeyDown which can't use React state
    function selectMention(view, pop, item) {
        const ed = editor;
        if (!ed)
            return;
        const currentPos = ed.state.selection.from;
        // startPos is after the trigger char, so -1 to include the @ or /
        const deleteFrom = Math.max(0, pop.startPos - 1);
        ed.chain()
            .focus()
            .deleteRange({ from: deleteFrom, to: currentPos })
            .insertContent({
            type: "mentionReference",
            attrs: {
                label: item.label,
                icon: item.icon || "file",
                source: item.source,
                refType: item.refType,
                refId: item.refId || null,
                refPath: item.refPath || null,
            },
        })
            .insertContent(" ")
            .run();
        popoverStateRef.current = null;
        setPopover(null);
    }
    function executeCommand(view, pop, command) {
        const ed = editor;
        if (!ed)
            return;
        const currentPos = ed.state.selection.from;
        const deleteFrom = Math.max(0, pop.startPos - 1);
        ed.chain().focus().deleteRange({ from: deleteFrom, to: currentPos }).run();
        popoverStateRef.current = null;
        setPopover(null);
        onSlashCommandRef.current?.(command.name);
    }
    function selectSkill(view, pop, skill) {
        const ed = editor;
        if (!ed)
            return;
        const currentPos = ed.state.selection.from;
        const deleteFrom = Math.max(0, pop.startPos - 1);
        ed.chain()
            .focus()
            .deleteRange({ from: deleteFrom, to: currentPos })
            .insertContent({
            type: "skillReference",
            attrs: { name: skill.name, path: skill.path, source: skill.source },
        })
            .insertContent(" ")
            .run();
        popoverStateRef.current = null;
        setPopover(null);
    }
    // Popover select handlers for click-based selection (from MentionPopover)
    const handleSelectMention = useCallback((item) => {
        if (!editor || !popover)
            return;
        const currentPos = editor.state.selection.from;
        const deleteFrom = Math.max(0, popover.startPos - 1);
        editor
            .chain()
            .focus()
            .deleteRange({ from: deleteFrom, to: currentPos })
            .insertContent({
            type: "mentionReference",
            attrs: {
                label: item.label,
                icon: item.icon || "file",
                source: item.source,
                refType: item.refType,
                refId: item.refId || null,
                refPath: item.refPath || null,
            },
        })
            .insertContent(" ")
            .run();
        closePopover();
    }, [editor, popover, closePopover]);
    const handleSelectCommand = useCallback((command) => {
        if (!editor || !popover)
            return;
        const currentPos = editor.state.selection.from;
        const deleteFrom = Math.max(0, popover.startPos - 1);
        editor
            .chain()
            .focus()
            .deleteRange({ from: deleteFrom, to: currentPos })
            .run();
        closePopover();
        onSlashCommand?.(command.name);
    }, [editor, popover, closePopover, onSlashCommand]);
    const handleSelectSkill = useCallback((skill) => {
        if (!editor || !popover)
            return;
        const currentPos = editor.state.selection.from;
        const deleteFrom = Math.max(0, popover.startPos - 1);
        editor
            .chain()
            .focus()
            .deleteRange({ from: deleteFrom, to: currentPos })
            .insertContent({
            type: "skillReference",
            attrs: { name: skill.name, path: skill.path, source: skill.source },
        })
            .insertContent(" ")
            .run();
        closePopover();
    }, [editor, popover, closePopover]);
    // Track query text as user types after trigger
    useEffect(() => {
        if (!editor || !popover)
            return;
        const updateHandler = () => {
            syncComposerState();
            const pop = popoverStateRef.current;
            if (!pop)
                return;
            const { from } = editor.state.selection;
            const { startPos, type } = pop;
            if (from < startPos) {
                closePopover();
                return;
            }
            const text = editor.state.doc.textBetween(startPos, from);
            // Verify the trigger character is still there
            if (startPos > 0) {
                const triggerChar = editor.state.doc.textBetween(startPos - 1, startPos);
                if ((type === "@" && triggerChar !== "@") ||
                    (type === "/" && triggerChar !== "/")) {
                    closePopover();
                    return;
                }
            }
            const updated = { ...pop, query: text };
            popoverStateRef.current = updated;
            setPopover(updated);
        };
        editor.on("update", updateHandler);
        editor.on("selectionUpdate", updateHandler);
        return () => {
            editor.off("update", updateHandler);
            editor.off("selectionUpdate", updateHandler);
        };
    }, [editor, popover, closePopover, syncComposerState]);
    useEffect(() => {
        if (!editor)
            return;
        if (composerText !== "")
            return;
        if (editor.isEmpty)
            return;
        editor.commands.clearContent();
    }, [composerText, editor]);
    useEffect(() => {
        if (!editor || initialText === undefined)
            return;
        const key = initialTextKey ?? initialText;
        if (initialTextKeyRef.current === key)
            return;
        initialTextKeyRef.current = key;
        editor.commands.setContent(plainTextToDoc(initialText));
        editor.commands.focus("end");
        const trimmed = editor.state.doc.textContent.trim();
        setEditorHasText(trimmed.length > 0);
        composerRuntime.setText(trimmed);
        onTextChangeRef.current?.(trimmed);
        try {
            if (trimmed) {
                localStorage.setItem(draftKey, editor.getHTML());
            }
            else {
                localStorage.removeItem(draftKey);
            }
        }
        catch { }
    }, [composerRuntime, draftKey, editor, initialText, initialTextKey]);
    // Tiptap only reads `editable` at init; prop changes need setEditable.
    useEffect(() => {
        if (!editor)
            return;
        editor.setEditable(!disabled);
        if (disabled)
            editor.commands.blur();
    }, [editor, disabled]);
    return (_jsxs(_Fragment, { children: [_jsx("style", { children: `
        .aui-composer .ProseMirror p.is-editor-empty:first-child::before {
          content: attr(data-placeholder);
          color: var(--color-muted-foreground);
          opacity: 0.5;
          float: left;
          height: 0;
          pointer-events: none;
        }
      ` }), composerMode && (_jsx("div", { "data-agent-composer-variant": layoutVariant, "data-agent-composer-slot": "mode-row", className: "agent-composer-mode-row px-2.5 pt-2 pb-0", children: _jsx(ComposerModeChip, { mode: composerMode, onRemove: () => {
                        setComposerMode(null);
                        composerModeRef.current = null;
                        editor?.commands.focus("end");
                    } }) })), _jsx("div", { "data-agent-composer-variant": layoutVariant, "data-agent-composer-slot": "editor-wrap", className: `agent-composer-editor-wrap ${composerMode ? "px-2 pt-1 pb-1" : "px-2 pt-2 pb-1"}`, children: _jsx(EditorContent, { editor: editor, "data-agent-composer-variant": layoutVariant, "data-agent-composer-slot": "editor", className: "agent-composer-editor aui-composer flex-1 min-w-0 [&_.ProseMirror]:outline-none [&_.ProseMirror_p]:m-0 px-0.5" }) }), voiceEnabled && _jsx(VoiceRecordingOverlay, { voice: voice }), _jsxs("div", { "data-agent-composer-variant": layoutVariant, "data-agent-composer-slot": "toolbar", className: "agent-composer-toolbar flex items-center gap-1 px-2 py-1.5", children: [attachButton ??
                        (plusMenuMode === "hidden" ? null : (_jsx(ComposerPlusMenu, { onSelectMode: handleSelectMode, mode: plusMenuMode }))), toolbarSlot ?? modeControl, _jsx("div", { "data-agent-composer-slot": "toolbar-spacer", className: "flex-1" }), selectedModel && availableModels && onModelChange && (_jsx(ModelSelector, { model: selectedModel, effort: selectedEffort, engines: availableModels, onChange: onModelChange, onEffortChange: onEffortChange, providerConnectStatusEnabled: providerConnectStatusEnabled, onConnectProvider: onConnectProvider })), execMode && onExecModeChange && (_jsx(ModeSelector, { mode: execMode, onChange: onExecModeChange, planModeDisabled: planModeDisabled, planModeDisabledReason: planModeDisabledReason })), actionButton ?? (_jsxs(_Fragment, { children: [voiceEnabled && (_jsx(VoiceButton, { voice: voice, isMac: isMac, disabled: disabled })), extraActionButton, _jsxs(Tooltip, { children: [_jsx(TooltipTrigger, { asChild: true, children: _jsx("button", { type: "button", onClick: () => submitComposer("immediate"), disabled: !canSend, "data-agent-composer-slot": "send-button", className: "agent-composer-send-button shrink-0 flex h-7 w-7 items-center justify-center rounded-md bg-primary text-primary-foreground hover:opacity-90 disabled:opacity-30 disabled:cursor-not-allowed", children: _jsx(IconArrowUp, { className: "h-3.5 w-3.5" }) }) }), _jsx(TooltipContent, { children: "Send message" })] })] }))] }), _jsx(MentionPopover, { ref: popoverRef, type: popover?.type ?? "@", position: popover?.position ?? null, mentionItems: mentionItems, skills: filteredSkills, commands: filteredCommands, hint: hint, isLoading: popover?.type === "@" ? mentionsLoading : skillsLoading, query: popover?.query ?? "", onSelectMention: handleSelectMention, onSelectSkill: handleSelectSkill, onSelectCommand: handleSelectCommand, onClose: closePopover })] }));
}
//# sourceMappingURL=TiptapComposer.js.map