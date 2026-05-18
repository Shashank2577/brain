import { jsx as _jsx, jsxs as _jsxs, Fragment as _Fragment } from "react/jsx-runtime";
import { useCallback, useEffect, useMemo, useRef, useState, } from "react";
import { AssistantRuntimeProvider, ThreadPrimitive, useAui, useComposer, useLocalRuntime, } from "@assistant-ui/react";
import { CompositeAttachmentAdapter, SimpleImageAttachmentAdapter, } from "@assistant-ui/react";
import { IconX } from "@tabler/icons-react";
import { cn } from "../utils.js";
import { AgentComposerFrame } from "./AgentComposerFrame.js";
import { TiptapComposer, } from "./TiptapComposer.js";
import { useChatModels } from "../use-chat-models.js";
import { TooltipProvider } from "../components/ui/tooltip.js";
import { isPastedTextAttachmentName } from "./pasted-text.js";
import { PastedTextChip } from "./PastedTextChip.js";
import { PROMPT_DOCUMENT_ATTACHMENT_ACCEPT, TextAttachmentAdapter, } from "./attachment-accept.js";
const MAX_INLINE_TEXT_FILE_CHARS = 60_000;
// Minimal pass-through adapter. PromptComposer always submits through
// onSubmitOverride, so the runtime never actually calls this — but
// `useLocalRuntime` needs *something* shaped like a ChatModelAdapter.
const NOOP_ADAPTER = {
    async *run() {
        return;
    },
};
/**
 * Local binary document adapter so reference PDFs, decks, and docs can be
 * attached without dragging the whole assistant chat module into bundles that
 * just want a prompt popover.
 */
class BinaryDocumentAttachmentAdapter {
    accept = PROMPT_DOCUMENT_ATTACHMENT_ACCEPT;
    async add(state) {
        return {
            id: state.file.name,
            type: "document",
            name: state.file.name,
            contentType: state.file.type || "application/octet-stream",
            file: state.file,
            status: { type: "requires-action", reason: "composer-send" },
        };
    }
    async send(attachment) {
        return {
            ...attachment,
            status: { type: "complete" },
            content: [],
        };
    }
    async remove() {
        /* noop */
    }
}
function isInlineableTextFile(file) {
    if (file.type.startsWith("text/"))
        return true;
    if (file.type === "application/json")
        return true;
    return /\.(txt|md|markdown|csv|json|yaml|yml|html?|css|xml)$/i.test(file.name);
}
function formatInlineTextFile(name, text) {
    const truncated = text.length > MAX_INLINE_TEXT_FILE_CHARS;
    const body = truncated ? text.slice(0, MAX_INLINE_TEXT_FILE_CHARS) : text;
    return [
        `<uploaded-text-file name="${name}">`,
        body,
        truncated
            ? `[Truncated after ${MAX_INLINE_TEXT_FILE_CHARS} characters.]`
            : "",
        "</uploaded-text-file>",
    ]
        .filter(Boolean)
        .join("\n");
}
function readFileDataUrl(file) {
    return new Promise((resolve, reject) => {
        const reader = new FileReader();
        reader.onload = () => resolve(String(reader.result || ""));
        reader.onerror = () => reject(reader.error ?? new Error("Could not read file"));
        reader.readAsDataURL(file);
    });
}
function formatInlineImageFile(name, contentType, dataUrl) {
    return [
        `<uploaded-image name="${name}" contentType="${contentType}">`,
        dataUrl,
        "</uploaded-image>",
    ].join("\n");
}
export async function buildPromptComposerSubmission(options) {
    const files = [];
    const pastedTextBlocks = [];
    const rawText = options.text;
    for (const att of options.attachments ?? []) {
        const a = att;
        if ("file" in a && a.file instanceof File) {
            const file = a.file;
            if (isPastedTextAttachmentName(file.name)) {
                try {
                    pastedTextBlocks.push(await file.text());
                }
                catch {
                    files.push(file);
                }
            }
            else {
                if (isInlineableTextFile(file)) {
                    try {
                        pastedTextBlocks.push(formatInlineTextFile(file.name, await file.text()));
                    }
                    catch {
                        // Keep the upload path fallback below.
                    }
                }
                else if (file.type.startsWith("image/") && !rawText.trim()) {
                    try {
                        pastedTextBlocks.push(formatInlineImageFile(file.name, file.type, await readFileDataUrl(file)));
                    }
                    catch {
                        // Keep the upload path fallback below.
                    }
                }
                files.push(file);
            }
        }
    }
    return {
        text: pastedTextBlocks.length
            ? [rawText.trim(), ...pastedTextBlocks].filter(Boolean).join("\n\n")
            : rawText,
        files,
    };
}
function getImageSrc(attachment) {
    if (attachment.type !== "image")
        return null;
    if ("file" in attachment && attachment.file) {
        return URL.createObjectURL(attachment.file);
    }
    const imagePart = attachment.content?.find((part) => part.type === "image");
    return imagePart && "image" in imagePart ? imagePart.image : null;
}
function ImagePreviewLightbox({ src, alt, onClose, }) {
    useEffect(() => {
        const handler = (e) => {
            if (e.key === "Escape")
                onClose();
        };
        document.addEventListener("keydown", handler);
        document.body.style.overflow = "hidden";
        return () => {
            document.removeEventListener("keydown", handler);
            document.body.style.overflow = "";
        };
    }, [onClose]);
    return (_jsxs("div", { role: "dialog", "aria-label": "Image preview", onClick: onClose, className: "fixed inset-0 z-[300] flex items-center justify-center bg-black/80 p-6 cursor-zoom-out", children: [_jsx("img", { src: src, alt: alt, onClick: (e) => e.stopPropagation(), className: "max-h-full max-w-full object-contain rounded-md shadow-2xl cursor-default" }), _jsx("button", { type: "button", onClick: onClose, "aria-label": "Close preview", className: "absolute right-4 top-4 flex h-8 w-8 cursor-pointer items-center justify-center rounded-full border border-white/30 bg-black/40 text-white hover:bg-black/60", children: _jsx(IconX, { className: "h-4 w-4" }) })] }));
}
function AttachmentChip({ attachment, onRemove, }) {
    const src = useMemo(() => getImageSrc(attachment), [attachment]);
    const [previewOpen, setPreviewOpen] = useState(false);
    useEffect(() => () => {
        if (src?.startsWith("blob:"))
            URL.revokeObjectURL(src);
    }, [src]);
    if (isPastedTextAttachmentName(attachment.name)) {
        return _jsx(PastedTextChip, { attachment: attachment, onRemove: onRemove });
    }
    if (src) {
        return (_jsxs(_Fragment, { children: [_jsxs("button", { type: "button", onClick: () => setPreviewOpen(true), "aria-label": `Preview ${attachment.name}`, className: "agent-composer-attachment-image group relative flex h-16 min-w-16 max-w-28 cursor-zoom-in items-center justify-center overflow-hidden rounded-lg border border-border/70 bg-muted/50", children: [_jsx("img", { src: src, alt: attachment.name, className: "max-h-full max-w-full object-contain p-1" }), _jsx("span", { role: "button", tabIndex: 0, onClick: (e) => {
                                e.stopPropagation();
                                onRemove(attachment.id);
                            }, onKeyDown: (e) => {
                                if (e.key === "Enter" || e.key === " ") {
                                    e.preventDefault();
                                    e.stopPropagation();
                                    onRemove(attachment.id);
                                }
                            }, "aria-label": `Remove ${attachment.name}`, className: "absolute right-1 top-1 flex h-5 w-5 cursor-pointer items-center justify-center rounded-full border border-border/60 bg-background/90 text-muted-foreground hover:text-foreground", children: _jsx(IconX, { className: "h-3 w-3" }) })] }), previewOpen ? (_jsx(ImagePreviewLightbox, { src: src, alt: attachment.name, onClose: () => setPreviewOpen(false) })) : null] }));
    }
    return (_jsxs("div", { className: "agent-composer-attachment-chip group relative inline-flex max-w-[200px] items-center gap-2 rounded-md border border-border/70 bg-muted/50 px-2 py-1.5 text-xs", children: [_jsx("div", { className: "flex h-6 w-6 shrink-0 items-center justify-center rounded bg-background text-[9px] font-semibold uppercase text-muted-foreground", children: attachment.name.split(".").pop() || "file" }), _jsx("span", { className: "min-w-0 truncate font-medium", children: attachment.name }), _jsx("button", { type: "button", onClick: () => onRemove(attachment.id), "aria-label": `Remove ${attachment.name}`, className: "flex h-5 w-5 shrink-0 cursor-pointer items-center justify-center rounded text-muted-foreground hover:text-foreground", children: _jsx(IconX, { className: "h-3 w-3" }) })] }));
}
function PromptAttachmentStrip() {
    const attachments = useComposer((state) => state.attachments);
    const aui = useAui();
    const handleRemove = useCallback((id) => {
        void aui.composer().attachment({ id }).remove();
    }, [aui]);
    if (attachments.length === 0)
        return null;
    return (_jsx("div", { className: "agent-composer-attachment-strip flex flex-wrap gap-2 px-2 pt-2", children: attachments.map((attachment) => (_jsx(AttachmentChip, { attachment: attachment, onRemove: handleRemove }, attachment.id))) }));
}
function PromptComposerInner({ onSubmit, placeholder, disabled, autoFocus, className, style, rootClassName, rootStyle, draftScope, preserveDraftOnSubmit = false, showModelSelector = true, voiceEnabled = true, attachmentsEnabled = true, plusMenuMode, initialText, initialTextKey, modeControl, toolbarSlot, actionButton, extraActionButton, layoutVariant, slashCommands, slashSkills, includeDefaultSlashCommands, includeDefaultSlashSkills, onSlashCommand, availableModels, selectedModel, selectedEngine, selectedEffort, onModelChange, onEffortChange, modelStatusChecksEnabled, onTextChange, onConnectProvider, composerRef, }) {
    const localRef = useRef(null);
    const handleRef = composerRef ?? localRef;
    const hostManagedModels = Boolean(availableModels && selectedModel && onModelChange);
    const resolvedModelStatusChecksEnabled = modelStatusChecksEnabled ?? !hostManagedModels;
    const models = useChatModels({
        enabled: showModelSelector && resolvedModelStatusChecksEnabled,
    });
    const composerModel = showModelSelector
        ? (selectedModel ?? models.selectedModel)
        : undefined;
    const composerEngine = showModelSelector
        ? (selectedEngine ?? models.selectedEngine)
        : undefined;
    const composerEffort = showModelSelector
        ? (selectedEffort ?? models.selectedEffort)
        : undefined;
    const composerModelGroups = showModelSelector
        ? (availableModels ?? models.availableModels)
        : undefined;
    const handleModelChange = showModelSelector
        ? (onModelChange ?? models.onModelChange)
        : undefined;
    const handleEffortChange = showModelSelector
        ? (onEffortChange ?? models.onEffortChange)
        : undefined;
    useEffect(() => {
        if (!autoFocus)
            return;
        const id = window.setTimeout(() => {
            const target = typeof handleRef === "object" && handleRef && "current" in handleRef
                ? handleRef.current
                : null;
            target?.focus();
        }, 50);
        return () => window.clearTimeout(id);
    }, [autoFocus, handleRef]);
    const handleSubmit = useCallback(async (text, references, attachments, submitOptions) => {
        // PromptComposer hosts (NewWorkspaceAppFlow, create-extension, create-deck,
        // …) submit a single string prompt — they don't run the assistant-ui
        // attachment send pipeline. TiptapComposer auto-converts large pastes
        // into a "Pasted text" chip, which would otherwise disappear into an
        // unprocessed File. Inline the chip body back into the prompt text so
        // newlines and full content survive the round-trip.
        const { text: finalText, files } = await buildPromptComposerSubmission({
            text,
            attachments,
        });
        onSubmit(finalText, files, references, {
            intent: submitOptions?.intent ?? "immediate",
            model: composerModel,
            engine: composerEngine,
            effort: composerEffort,
        });
    }, [composerEffort, composerEngine, composerModel, onSubmit]);
    return (_jsxs(AgentComposerFrame, { className: cn("text-left", className), rootClassName: rootClassName, style: style, rootStyle: rootStyle, layoutVariant: layoutVariant, children: [_jsx(PromptAttachmentStrip, {}), _jsx(TiptapComposer, { focusRef: handleRef, disabled: disabled, placeholder: placeholder, initialText: initialText, initialTextKey: initialTextKey, onSubmit: handleSubmit, clearOnSubmit: !preserveDraftOnSubmit, plusMenuMode: plusMenuMode ?? (attachmentsEnabled ? "upload-only" : "hidden"), modeControl: modeControl, toolbarSlot: toolbarSlot, actionButton: actionButton, extraActionButton: extraActionButton, layoutVariant: layoutVariant, slashCommands: slashCommands, slashSkills: slashSkills, includeDefaultSlashCommands: includeDefaultSlashCommands, includeDefaultSlashSkills: includeDefaultSlashSkills, onSlashCommand: onSlashCommand, voiceEnabled: voiceEnabled, onTextChange: onTextChange, draftScope: draftScope, selectedModel: composerModel, selectedEffort: composerEffort, availableModels: composerModelGroups, onModelChange: handleModelChange, onEffortChange: handleEffortChange, providerConnectStatusEnabled: resolvedModelStatusChecksEnabled, onConnectProvider: onConnectProvider })] }));
}
/**
 * Standalone composer that mirrors the agent sidebar's input experience —
 * voice dictation, file upload, model selector, submit-on-Enter — for use in
 * popovers and inline prompt forms (create tool, create deck, create dashboard,
 * the Dispatch new-app flow, etc.).
 *
 * The host owns submission: when the user presses Enter or clicks submit,
 * `onSubmit(text, files, references, options)` is called. PromptComposer runs
 * its own minimal assistant-ui runtime so it can be dropped into any subtree
 * without needing the outer chat to be mounted.
 */
export function PromptComposer(props) {
    const attachmentAdapter = useMemo(() => new CompositeAttachmentAdapter([
        new SimpleImageAttachmentAdapter(),
        new BinaryDocumentAttachmentAdapter(),
        new TextAttachmentAdapter(),
    ]), []);
    const runtime = useLocalRuntime(NOOP_ADAPTER, {
        adapters: { attachments: attachmentAdapter },
    });
    return (_jsx(TooltipProvider, { delayDuration: 200, children: _jsx(AssistantRuntimeProvider, { runtime: runtime, children: _jsx(ThreadPrimitive.Root, { className: "contents", style: { display: "contents" }, children: _jsx(PromptComposerInner, { ...props }) }) }) }));
}
//# sourceMappingURL=PromptComposer.js.map