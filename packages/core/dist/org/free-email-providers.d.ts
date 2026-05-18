/**
 * Free / public mailbox providers that should NOT be allowed as an
 * organization's auto-join domain.
 *
 * Why: the auto-join feature lets anyone who signs up with an email at the
 * org's `allowed_domain` join the org without an invitation. That is safe
 * for company-owned domains (`acme.com`) — the company controls who gets
 * an `@acme.com` address. It is catastrophic for shared mailbox providers
 * (`gmail.com`, `outlook.com`, etc.) — anyone in the world can create a
 * matching address and would be auto-added to the org.
 *
 * The list intentionally errs on the side of well-known providers; if a
 * future provider isn't here we'll learn from a bug report rather than
 * pretend we have an exhaustive registry.
 */
export declare const FREE_EMAIL_PROVIDER_DOMAINS: ReadonlySet<string>;
export declare function isFreeEmailProvider(domain: string): boolean;
//# sourceMappingURL=free-email-providers.d.ts.map