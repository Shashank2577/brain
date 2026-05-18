/**
 * Reusable dark-themed HTML email template.
 *
 * Email clients have limited CSS support, so everything is inlined and layout
 * uses tables for Outlook compatibility. The design mirrors the app's dark UI:
 * near-black card on neutral background, Inter typography with safe fallbacks.
 *
 * Default is monochrome (white CTA on dark). Pass `brandColor` to tint the
 * CTA button and inline links — Clips, for example, passes its purple.
 *
 * Usage:
 *   const { html, text } = renderEmail({
 *     preheader: "…",
 *     heading: "You're invited to join Acme",
 *     paragraphs: ["Alice invited you to join…"],
 *     cta: { label: "Accept invite", url: "https://…" },
 *     footer: "If you weren't expecting this, ignore this email.",
 *   });
 */
export interface EmailCta {
    label: string;
    url: string;
}
export interface RenderEmailArgs {
    /** Short preview text shown by email clients next to the subject. */
    preheader?: string;
    /** Large headline at the top of the card. */
    heading: string;
    /** Body paragraphs rendered after the heading. Plain strings — escaped. */
    paragraphs: string[];
    /** Primary call-to-action rendered as a real button. */
    cta?: EmailCta;
    /** Small muted text under the CTA (e.g. expiry note). */
    footer?: string;
    /**
     * Optional brand hex color for the CTA button and inline links. Defaults to
     * a monochrome near-white button with dark text.
     */
    brandColor?: string;
}
export interface RenderedEmail {
    html: string;
    text: string;
}
export declare function renderEmail(args: RenderEmailArgs): RenderedEmail;
/**
 * Build an inline `<strong>` tag with consistent styling for use inside
 * paragraph strings passed to `renderEmail`. Escapes the content.
 */
export declare function emailStrong(text: string): string;
/**
 * Build a labelled inline link for paragraph strings passed to `renderEmail`.
 * Use this instead of rendering raw URLs in the visible email body.
 */
export declare function emailLink(label: string, url: string): string;
//# sourceMappingURL=email-template.d.ts.map