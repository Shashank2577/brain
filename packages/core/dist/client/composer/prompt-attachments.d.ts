import { formatPromptWithAttachments, escapePromptAttachmentAttribute, type AgentPromptAttachment } from "../../code-agents/prompt-attachments.js";
export { formatPromptWithAttachments, escapePromptAttachmentAttribute, type AgentPromptAttachment, };
export declare const AGENT_PROMPT_MAX_INLINE_TEXT_CHARS = 60000;
export declare const AGENT_PROMPT_MAX_INLINE_IMAGE_BYTES: number;
export interface ReadAgentPromptAttachmentOptions {
    maxInlineTextChars?: number;
    maxInlineImageBytes?: number;
}
export declare function readAgentPromptAttachment(file: File, options?: ReadAgentPromptAttachmentOptions): Promise<AgentPromptAttachment>;
export declare function isInlineableAgentPromptFile(file: File): boolean;
//# sourceMappingURL=prompt-attachments.d.ts.map