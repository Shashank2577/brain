export interface InvitationBannerProps {
    className?: string;
}
/**
 * Top-of-app banner that surfaces:
 *   - Pending org invitations (one-click Accept).
 *   - Domain-match orgs the user can auto-join because their email domain
 *     matches `organizations.allowed_domain` (one-click Join). Lets a new
 *     signup at e.g. `someone@builder.io` see and join the existing
 *     Builder.io org without going through the picker.
 *
 * Renders nothing when there's nothing to surface.
 */
export declare function InvitationBanner({ className }: InvitationBannerProps): import("react/jsx-runtime").JSX.Element;
//# sourceMappingURL=InvitationBanner.d.ts.map