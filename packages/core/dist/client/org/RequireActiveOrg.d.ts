import { ReactNode } from "react";
export interface RequireActiveOrgProps {
    children: ReactNode;
    /**
     * Override the heading shown on the create-org pane. Default: "Create your organization".
     */
    title?: string;
    /**
     * Override the description shown below the heading. Default explains that
     * an org is required to use the app.
     */
    description?: string;
    /** Optional extra classes on the blocking pane wrapper. */
    className?: string;
}
/**
 * Guards its children behind the user having an active organization.
 *
 * When the user has no active org, renders a blocking, centered pane in place
 * of `children` with:
 *   1. Any pending invitations (one-click accept), and
 *   2. A "Create your organization" form.
 *
 * As soon as an org is joined or created, `useOrg` refetches and `children`
 * renders normally.
 *
 * The pane fills whatever box this component is rendered into — it does **not**
 * position itself `fixed` over the viewport. Place it inside your app shell so
 * ambient UI (agent sidebar, global nav) stays accessible while the user
 * completes org setup.
 */
export declare function RequireActiveOrg({ children, title, description, className, }: RequireActiveOrgProps): import("react/jsx-runtime").JSX.Element;
//# sourceMappingURL=RequireActiveOrg.d.ts.map