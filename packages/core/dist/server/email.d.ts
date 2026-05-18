/**
 * Email transport for system emails (password resets, invitations, notifications).
 *
 * Providers are selected by env var:
 *   RESEND_API_KEY    — https://resend.com
 *   SENDGRID_API_KEY  — https://sendgrid.com
 *   EMAIL_FROM        — "Name <addr@domain>" (optional; defaults to Resend's sandbox)
 *
 * With neither provider configured, `sendEmail` logs the message to the console
 * so the reset-password flow still works end-to-end for local development.
 */
export type EmailProvider = "resend" | "sendgrid" | "dev";
export interface EmailAttachment {
    filename: string;
    content: string | Buffer;
    contentType?: string;
}
export interface SendEmailArgs {
    to: string;
    subject: string;
    html: string;
    text?: string;
    from?: string;
    cc?: string | string[];
    replyTo?: string;
    inReplyTo?: string;
    references?: string;
    attachments?: EmailAttachment[];
}
export declare function isEmailConfigured(): boolean;
export declare function getEmailProvider(): EmailProvider;
export declare function sendEmail(args: SendEmailArgs): Promise<void>;
//# sourceMappingURL=email.d.ts.map