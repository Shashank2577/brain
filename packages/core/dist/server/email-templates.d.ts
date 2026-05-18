/**
 * Transactional email renderers for the framework's system emails.
 *
 * Each exported function returns `{ subject, html, text }` so callers can pass
 * the result straight to `sendEmail({ to, ...rendered })`. All three share the
 * same visual identity via the generic `renderEmail` helper in
 * `email-template.ts` — dark card, Inter typography, prominent CTA button.
 *
 * If you need to add another system email (e.g. magic-link, change-email
 * confirmation), add it here rather than inlining `renderEmail` at the call
 * site — keeps the transactional look-and-feel consistent.
 */
export interface RenderedEmailMessage {
    subject: string;
    html: string;
    text: string;
}
export interface RenderInviteEmailArgs {
    /** Email address of the person being invited. */
    invitee: string;
    /** Name of the organization they're being invited to. */
    orgName: string;
    /** URL the recipient clicks to accept — usually the app's root URL. */
    acceptUrl: string;
    /** Email (or display name) of the person who sent the invitation. */
    inviter: string;
}
export declare function renderInviteEmail(args: RenderInviteEmailArgs): RenderedEmailMessage;
export interface RenderVerifySignupEmailArgs {
    /** The email address being verified. */
    email: string;
    /** The full verification URL from better-auth. */
    verifyUrl: string;
}
export declare function renderVerifySignupEmail(args: RenderVerifySignupEmailArgs): RenderedEmailMessage;
export interface RenderResetPasswordEmailArgs {
    /** The account email the reset is for. */
    email: string;
    /** The full reset URL (includes the signed token). */
    resetUrl: string;
}
export declare function renderResetPasswordEmail(args: RenderResetPasswordEmailArgs): RenderedEmailMessage;
//# sourceMappingURL=email-templates.d.ts.map