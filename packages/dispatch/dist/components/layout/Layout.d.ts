import { type ComponentType, type ReactNode } from "react";
export type DispatchNavSection = "primary" | "operations";
export type DispatchNavIcon = ComponentType<{
    size?: number | string;
    className?: string;
}>;
export interface DispatchNavItem {
    /** Stable id used for keys and navigation.view. Avoid built-in ids. */
    id: string;
    /** React Router path for the tab, usually backed by an app/routes/*.tsx file. */
    to: string;
    label: string;
    icon?: DispatchNavIcon;
    /** Defaults to "operations", which is where local management tools usually fit. */
    section?: DispatchNavSection;
    /** Override active matching for nested or multi-route tools. */
    match?: (pathname: string) => boolean;
}
export interface DispatchExtensionConfig {
    /** Extra sidebar tabs supplied by the generated workspace. */
    navItems?: readonly DispatchNavItem[];
    /** Extra React Query keys to invalidate when Dispatch receives DB sync events. */
    queryKeys?: readonly string[];
}
export declare function NavContent({ onNavigate, extensions, }: {
    onNavigate?: () => void;
    extensions?: DispatchExtensionConfig;
}): import("react/jsx-runtime").JSX.Element;
export declare function Layout({ children, extensions, }: {
    children: ReactNode;
    extensions?: DispatchExtensionConfig;
}): import("react/jsx-runtime").JSX.Element;
//# sourceMappingURL=Layout.d.ts.map