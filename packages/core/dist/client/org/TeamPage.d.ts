import { type ReactNode } from "react";
export interface TeamPageProps {
    /**
     * Optional wrapper around the page contents. Templates pass their own Layout
     * component so the Team page renders inside the template's chrome.
     */
    layout?: (children: ReactNode) => ReactNode;
    /**
     * Title shown at the top of the page. Defaults to "Team".
     */
    title?: string;
    /**
     * Description shown on the "Create an Organization" card. Defaults to
     * "Set up a team to collaborate with your colleagues."
     */
    createOrgDescription?: string;
    /**
     * Class applied to the outer max-width container. Templates can use this to
     * tweak page width.
     */
    className?: string;
}
/**
 * Default Team management page. Templates can route directly to this component
 * or wrap it with their own Layout via the `layout` prop.
 */
export declare function TeamPage({ layout, title, createOrgDescription, className, }: TeamPageProps): import("react/jsx-runtime").JSX.Element;
//# sourceMappingURL=TeamPage.d.ts.map