export interface OrgSwitcherAppLink {
    id: string;
    name: string;
    href: string;
    description?: string;
    isDispatch: boolean;
    status?: "ready" | "pending";
}
export interface VisibleOrgAppLinks {
    links: OrgSwitcherAppLink[];
    overflowCount: number;
}
type RuntimeEnv = Record<string, string | boolean | undefined>;
export declare const ORG_SWITCHER_MAX_APP_LINKS = 9;
export declare function parseWorkspaceAppLinks(payload: unknown, env?: RuntimeEnv): OrgSwitcherAppLink[] | null;
export declare function parseWorkspaceAppLinksJson(raw: string | undefined, env?: RuntimeEnv): OrgSwitcherAppLink[] | null;
export declare function defaultOrgAppLinks(): OrgSwitcherAppLink[];
export declare function isWorkspaceAppEnvironment(env?: RuntimeEnv): boolean;
export declare function dispatchOverviewHref(apps: OrgSwitcherAppLink[], env?: RuntimeEnv): string;
export declare function dispatchAppsHref(apps: OrgSwitcherAppLink[], env?: RuntimeEnv): string;
export declare function visibleOrgAppLinks(apps: OrgSwitcherAppLink[], max?: number): VisibleOrgAppLinks;
export interface UseOrgSwitcherAppLinksResult {
    apps: OrgSwitcherAppLink[];
    isWorkspace: boolean;
    isLoading: boolean;
    dispatchHref: string;
    dispatchAllAppsHref: string;
}
export declare function useOrgSwitcherAppLinks(enabled: boolean): UseOrgSwitcherAppLinksResult;
export {};
//# sourceMappingURL=workspace-app-links.d.ts.map