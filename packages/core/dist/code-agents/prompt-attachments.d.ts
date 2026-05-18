export interface AgentPromptAttachment {
    name: string;
    type?: string;
    size?: number;
    text?: string;
    /** Base64 data URL for image attachments (e.g. "data:image/png;base64,..."). */
    dataUrl?: string;
}
export declare function formatPromptWithAttachments(prompt: string, attachments: readonly AgentPromptAttachment[]): string;
export declare function escapePromptAttachmentAttribute(value: string): string;
//# sourceMappingURL=prompt-attachments.d.ts.map