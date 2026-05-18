export interface ConnectedAgent {
    id: string;
    name: string;
    description: string;
    url: string;
    color: string;
    source: "builtin" | "custom" | "workspace";
    resourceId?: string;
    path?: string;
    scope?: "shared" | "personal";
}
export declare function AgentsPanel({ agents, onRefresh, }: {
    agents: ConnectedAgent[];
    onRefresh: () => void;
}): import("react/jsx-runtime").JSX.Element;
//# sourceMappingURL=agents-panel.d.ts.map