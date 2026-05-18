import type { AgentChatAttachment } from "../agent/types.js";
export interface PreUploadedImageAttachment {
    name?: string;
    url: string;
    provider: string;
    contentType?: string;
}
export interface PreUploadAttachmentsResult {
    /** Same array reference. Each image attachment that was uploaded also gets a
     *  `url` property attached (non-breaking; consumers that don't read it are
     *  unaffected). */
    attachments: AgentChatAttachment[];
    /** Set when at least one image was uploaded. List of hosted URLs the agent
     *  can embed in HTML, slide content, documents, etc. */
    uploaded: PreUploadedImageAttachment[];
    /** True if at least one image attachment failed to upload because no
     *  file-upload provider is configured. Templates use this to render a
     *  "Connect Builder.io" suggestion. */
    providerMissing: boolean;
    /** A pre-formatted block to inject into the user message text so the agent
     *  has each hosted URL inline. Null when nothing was uploaded or no provider
     *  is configured. */
    injectedText: string | null;
}
/**
 * Pre-upload chat image attachments through the active file-upload provider
 * (Builder.io by default) so the agent can embed hosted URLs in HTML, slide
 * content, and outbound messages. Keeps the original base64 data URL on the
 * attachment so multimodal vision still works — only adds a hosted `url`.
 *
 * Safe to call when no provider is configured: it returns the attachments
 * untouched with `providerMissing: true` so callers can surface a connect-
 * Builder.io hint to the agent.
 */
export declare function preUploadImageAttachments(opts: {
    attachments: AgentChatAttachment[] | undefined;
    ownerEmail: string | null | undefined;
}): Promise<PreUploadAttachmentsResult>;
//# sourceMappingURL=pre-upload-attachments.d.ts.map