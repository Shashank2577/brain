import { type CSSProperties, type Ref, type ReactNode } from "react";
import { type ComposerSubmitIntent, type TiptapComposerHandle } from "./TiptapComposer.js";
import type { AgentComposerLayoutVariant, Reference, SkillResult, SlashCommand } from "./types.js";
import { type EngineModelGroup } from "../use-chat-models.js";
import type { ReasoningEffort } from "../../shared/reasoning-effort.js";
/**
 * Files the user attached via the "+" button in PromptComposer. The host owns
 * what to do with them — typically POST to a per-app upload endpoint and pass
 * the resulting URLs/paths into the prompt that gets sent to the agent.
 */
export type PromptComposerFile = File;
export interface PromptComposerSubmitOptions {
    intent?: ComposerSubmitIntent;
    model?: string;
    engine?: string;
    effort?: ReasoningEffort;
}
export interface PromptComposerProps {
    /** Called when the user submits the composer. */
    onSubmit: (text: string, files: PromptComposerFile[], references: Reference[], options: PromptComposerSubmitOptions) => void;
    placeholder?: string;
    disabled?: boolean;
    autoFocus?: boolean;
    className?: string;
    style?: CSSProperties;
    rootClassName?: string;
    rootStyle?: CSSProperties;
    /** Forwarded to TiptapComposer for draft persistence. */
    draftScope?: string;
    /** Keep the submitted prompt in the editor. Default: false. */
    preserveDraftOnSubmit?: boolean;
    /** Show the model selector (default: true). */
    showModelSelector?: boolean;
    /** Show the voice dictation button (default: true). */
    voiceEnabled?: boolean;
    /** Show file upload controls and pass submitted files to onSubmit (default: true). */
    attachmentsEnabled?: boolean;
    /**
     * Controls the shared "+" affordance. Defaults to upload-only for standalone
     * prompt forms; chat surfaces can opt into the full sidebar menu.
     */
    plusMenuMode?: "full" | "upload-only" | "hidden";
    /** Programmatically seed the composer with plain text. */
    initialText?: string;
    /** Stable key used to re-apply `initialText` when the host picks a preset. */
    initialTextKey?: string | number;
    /** Optional host-owned control rendered directly after the "+" button. */
    modeControl?: ReactNode;
    /** Explicit host-owned toolbar slot rendered directly after the "+" button. */
    toolbarSlot?: ReactNode;
    /** Custom action button to render instead of the default send button. */
    actionButton?: ReactNode;
    /** Extra button rendered alongside the default send button. */
    extraActionButton?: ReactNode;
    /** Shared sizing/layout variant for host surfaces. Default keeps sidebar behavior. */
    layoutVariant?: AgentComposerLayoutVariant;
    /** Additional slash commands surfaced in the shared / menu. */
    slashCommands?: SlashCommand[];
    /** Additional slash skills surfaced in the shared / menu. */
    slashSkills?: SkillResult[];
    /** Include built-in sidebar slash commands like /clear and /help. Default true. */
    includeDefaultSlashCommands?: boolean;
    /** Include app-discovered skills from the default agent endpoint. Default true. */
    includeDefaultSlashSkills?: boolean;
    /** Called when a slash command from the shared / menu is executed. */
    onSlashCommand?: (command: string) => void;
    /** External model list for hosts that already resolve models outside the app. */
    availableModels?: EngineModelGroup[];
    selectedModel?: string;
    selectedEngine?: string;
    selectedEffort?: ReasoningEffort;
    onModelChange?: (model: string, engine: string) => void;
    onEffortChange?: (effort: ReasoningEffort) => void;
    /**
     * Enable server-backed model/provider status checks. Defaults off when the
     * host supplies model state and callbacks, otherwise on.
     */
    modelStatusChecksEnabled?: boolean;
    /** Called whenever the plain editor text changes. */
    onTextChange?: (text: string) => void;
    /**
     * Override the Builder.io connect action in the model picker. When provided,
     * clicking "Connect Builder.io" calls this instead of opening a browser popup.
     * Used by the Electron desktop app to route through the native IPC handler.
     */
    onConnectProvider?: () => void;
    /** Imperative handle for focusing the composer. */
    composerRef?: Ref<TiptapComposerHandle>;
}
export declare function buildPromptComposerSubmission(options: {
    text: string;
    attachments?: ReadonlyArray<unknown>;
}): Promise<{
    text: string;
    files: File[];
}>;
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
export declare function PromptComposer(props: PromptComposerProps): import("react/jsx-runtime").JSX.Element;
//# sourceMappingURL=PromptComposer.d.ts.map