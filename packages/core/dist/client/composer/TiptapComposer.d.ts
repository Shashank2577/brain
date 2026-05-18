import React from "react";
import type { Reference } from "./types.js";
import { type ReasoningEffort } from "../../shared/reasoning-effort.js";
export interface TiptapComposerHandle {
    focus(): void;
}
export declare function canSubmitComposerContent(options: {
    hasEditorContent: boolean;
    attachmentCount: number;
    disabled?: boolean;
}): boolean;
export declare function displayableComposerModeMessage(options: {
    messagePrefix: string;
    trimmedText: string;
    attachmentCount: number;
}): string;
type ExecMode = "build" | "plan";
interface TiptapComposerProps {
    placeholder?: string;
    disabled?: boolean;
    focusRef?: React.Ref<TiptapComposerHandle>;
    /**
     * When provided, called instead of composerRuntime.send(). Used for queue
     * mode and standalone prompt popovers. Receives the live composer
     * attachments so callers (e.g. PromptComposer) can surface uploaded files.
     */
    onSubmit?: (text: string, references: Reference[], attachments?: ReadonlyArray<unknown>) => void;
    /**
     * Clear the editor after an onSubmit handler runs. Standalone workflows that
     * may fail outside the composer can keep the draft visible for quick edits.
     */
    clearOnSubmit?: boolean;
    /** Called whenever the plain editor text changes. */
    onTextChange?: (text: string) => void;
    /** Custom action button (e.g. stop button) to render instead of the default send button. */
    actionButton?: React.ReactNode;
    /** Extra button to render alongside the default send button (e.g. stop while running). */
    extraActionButton?: React.ReactNode;
    /** Custom attachment button to render instead of ComposerPrimitive.AddAttachment. */
    attachButton?: React.ReactNode;
    /** Called when a slash command (e.g. /clear, /help) is executed */
    onSlashCommand?: (command: string) => void;
    /** Current execution mode (build/plan) */
    execMode?: ExecMode;
    /** Callback to change execution mode */
    onExecModeChange?: (mode: ExecMode) => void;
    /** Disable Plan mode while leaving Act mode available. */
    planModeDisabled?: boolean;
    /** Explanation shown next to the disabled Plan option. */
    planModeDisabledReason?: string;
    /** Show the microphone button for voice dictation. Default true. */
    voiceEnabled?: boolean;
    /** Selected model override for this conversation */
    selectedModel?: string;
    /** Selected reasoning effort override for this conversation */
    selectedEffort?: ReasoningEffort;
    /** Available models grouped by provider */
    availableModels?: Array<{
        engine: string;
        label: string;
        models: string[];
        configured: boolean;
    }>;
    /** Callback when user picks a model */
    onModelChange?: (model: string, engine: string) => void;
    /** Callback when user picks a reasoning effort */
    onEffortChange?: (effort: ReasoningEffort) => void;
    /** Stable scope for persisted drafts, usually the active thread or tab id. */
    draftScope?: string;
    /**
     * Controls the "+" menu next to the composer. `"full"` (default) shows the
     * normal Upload / Skill / Job / Automation / Tool / MCP picker. `"upload-only"`
     * collapses it to a single button that opens the file picker directly.
     * `"hidden"` hides attachment controls for text-only prompt surfaces.
     */
    plusMenuMode?: "full" | "upload-only" | "hidden";
    /**
     * When true and the composer is running inside the Builder.io webview/iframe,
     * intercept "build me an app/agent" prompts and forward them to the parent
     * Builder chat via `builder.submitChat` instead of sending to the local
     * agent. Off by default — the chat sidebar opts in; standalone prompt
     * forms (NewWorkspaceAppFlow, etc.) handle delegation themselves with
     * extra context (vault keys, computed app ids) that the raw composer
     * text lacks.
     */
    interceptBuildRequestsForBuilder?: boolean;
}
export declare function createTiptapComposerExtensions(getPlaceholder: () => string | undefined): (import("@tiptap/core").Node<any, any> | import("@tiptap/core").Extension<import("@tiptap/starter-kit").StarterKitOptions, any> | import("@tiptap/core").Extension<import("@tiptap/extension-placeholder").PlaceholderOptions, any>)[];
export declare function TiptapComposer({ placeholder, disabled, focusRef, onSubmit, clearOnSubmit, onTextChange, actionButton, extraActionButton, attachButton, onSlashCommand, execMode, onExecModeChange, planModeDisabled, planModeDisabledReason, voiceEnabled, selectedModel, selectedEffort, availableModels, onModelChange, onEffortChange, draftScope, plusMenuMode, interceptBuildRequestsForBuilder, }: TiptapComposerProps): import("react/jsx-runtime").JSX.Element;
export {};
//# sourceMappingURL=TiptapComposer.d.ts.map