import { type ReactNode } from "react";
/**
 * DispatchShell renders the per-page title (with an optional click-to-open
 * description popover) into the global header via the HeaderActions store.
 * The actual chrome (sidebar, AgentSidebar, header bar with AgentToggleButton)
 * is provided by `Layout` mounted in `root.tsx`.
 */
export declare function DispatchShell({ title, description, children, }: {
    title: string;
    description?: string;
    children: ReactNode;
}): import("react/jsx-runtime").JSX.Element;
//# sourceMappingURL=dispatch-shell.d.ts.map