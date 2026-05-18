export interface OrgSwitcherProps {
    className?: string;
    /** Hide entirely when the user only belongs to one org. Default: false. */
    hideWhenSingle?: boolean;
    /** Keep the switcher's button height reserved while org state is loading. */
    reserveSpace?: boolean;
    /**
     * Optional path to navigate to when the user clicks "Workspace settings".
     * Templates that mount a dedicated team page (e.g. Dispatch's `/team`) can
     * pass it here. When unset, only the in-sidebar settings panel opens —
     * suitable for templates without a dedicated team page.
     */
    settingsPath?: string;
}
/**
 * Compact org switcher button. Shows the active org (or "Personal" when the
 * user has none); opens a popover with the user's other orgs, pending
 * invitations, inline forms to create a new org / invite a teammate, and a
 * sign-out item. Renders nothing in dev / no-auth mode.
 */
export declare function OrgSwitcher({ className, hideWhenSingle, reserveSpace, settingsPath, }: OrgSwitcherProps): import("react/jsx-runtime").JSX.Element;
//# sourceMappingURL=OrgSwitcher.d.ts.map