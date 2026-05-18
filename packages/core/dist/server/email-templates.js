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
import { renderEmail, emailStrong } from "./email-template.js";
import { getAppName } from "./app-name.js";
/**
 * Strip CRLF from any field that flows into the Subject line — a malicious
 * org name, inviter, or app name could otherwise inject Bcc/Reply-To headers
 * via "Name\r\nBcc: attacker@...".
 */
function stripCrlf(s) {
    return s.replace(/[\r\n]+/g, " ").trim();
}
function resolveAppName() {
    return stripCrlf(getAppName() || "Agent Native");
}
export function renderInviteEmail(args) {
    const invitee = stripCrlf(args.invitee);
    const orgName = stripCrlf(args.orgName || "your team");
    const inviter = stripCrlf(args.inviter);
    const appName = resolveAppName();
    const onApp = appName ? ` on ${appName}` : "";
    const { html, text } = renderEmail({
        preheader: `${inviter} invited you to join ${orgName}${onApp}.`,
        heading: `You're invited to join ${orgName}`,
        paragraphs: [
            `${emailStrong(inviter)} invited you to join ${emailStrong(orgName)}${appName ? ` on ${emailStrong(appName)}` : ""}.`,
            `Sign in with ${emailStrong(invitee)} to accept the invitation.`,
        ],
        cta: { label: "Accept invitation", url: args.acceptUrl },
        footer: `If you weren't expecting this, you can safely ignore this email.`,
    });
    return {
        subject: `${inviter} invited you to join ${orgName}${onApp}`,
        html,
        text,
    };
}
export function renderVerifySignupEmail(args) {
    const email = stripCrlf(args.email);
    const appName = resolveAppName();
    const { html, text } = renderEmail({
        preheader: `Confirm ${email} to finish setting up your ${appName} account.`,
        heading: `Verify your email for ${appName}`,
        paragraphs: [
            `Thanks for signing up for ${emailStrong(appName)}. To finish creating your account, confirm that ${emailStrong(email)} is your email address.`,
            `This link expires in 1 hour.`,
        ],
        cta: { label: "Verify email", url: args.verifyUrl },
        footer: `If you didn't sign up, you can safely ignore this email.`,
    });
    return {
        subject: `Verify your email for ${appName}`,
        html,
        text,
    };
}
export function renderResetPasswordEmail(args) {
    const email = stripCrlf(args.email);
    const appName = resolveAppName();
    const { html, text } = renderEmail({
        preheader: `Reset the password for ${email}. This link expires in 1 hour.`,
        heading: `Reset your ${appName} password`,
        paragraphs: [
            `Someone requested a password reset for ${emailStrong(email)}. Click the button below to choose a new password.`,
            `This link expires in 1 hour.`,
        ],
        cta: { label: "Reset password", url: args.resetUrl },
        footer: `If you didn't request this, you can safely ignore this email — your password won't change.`,
    });
    return {
        subject: `Reset your ${appName} password`,
        html,
        text,
    };
}
//# sourceMappingURL=email-templates.js.map