import { type Ref } from "react";
import { type TiptapComposerHandle } from "./TiptapComposer.js";
import type { Reference } from "./types.js";
import type { ReasoningEffort } from "../../shared/reasoning-effort.js";
/**
 * Files the user attached via the "+" button in PromptComposer. The host owns
 * what to do with them — typically POST to a per-app upload endpoint and pass
 * the resulting URLs/paths into the prompt that gets sent to the agent.
 */
export type PromptComposerFile = File;
export interface PromptComposerSubmitOptions {
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
    /** Called whenever the plain editor text changes. */
    onTextChange?: (text: string) => void;
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