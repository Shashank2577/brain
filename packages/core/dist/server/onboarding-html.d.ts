/**
 * First-run onboarding page for agent-native apps.
 *
 * Shown when Better Auth is active and the user isn't signed in.
 * Provides a path to create or sign into an account from day one.
 *
 * After first account exists, this page acts as a normal login page.
 */
import { type GoogleAuthMode } from "./google-auth-mode.js";
export interface OnboardingHtmlOptions {
    /**
     * Hide email/password forms and show ONLY the Google sign-in button.
     * Useful for templates (mail, calendar) where Google is required anyway.
     * If Google OAuth env vars are not configured, an error message is shown.
     */
    googleOnly?: boolean;
    /**
     * Product marketing content shown alongside the sign-in form.
     * When provided, the page uses a split layout: marketing on the left,
     * sign-in form on the right (stacked on mobile).
     */
    marketing?: {
        appName: string;
        tagline: string;
        description?: string;
        features?: string[];
        runLocalCommand?: string;
    };
    /**
     * Optional preflight copy shown before redirecting through Google sign-in.
     * Use this when a hosted app needs to warn about provider-specific consent
     * screens while leaving self-hosted deployments untouched.
     */
    googleSignInNotice?: {
        host?: string;
        title: string;
        body: string | string[];
        continueLabel?: string;
        cancelLabel?: string;
    };
    /**
     * Google sign-in flow: `'popup'`, `'redirect'`, or `'auto'` (default).
     * Falls back to `GOOGLE_AUTH_MODE` env var, then `'auto'`. Builder web
     * iframes use popup; Builder desktop preview/editor surfaces use redirect.
     */
    googleAuthMode?: GoogleAuthMode;
}
export declare function getOnboardingHtml(opts?: OnboardingHtmlOptions): string;
/** @deprecated Use getOnboardingHtml() instead */
export declare const ONBOARDING_HTML: string;
/**
 * HTML for the password reset page — shown when the user clicks the link in
 * their reset email. Posts `{ newPassword, token }` to Better Auth's
 * `/reset-password` endpoint, then redirects to the login page.
 */
export declare function getResetPasswordHtml(): string;
//# sourceMappingURL=onboarding-html.d.ts.map