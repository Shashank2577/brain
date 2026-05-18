export interface WorkspaceAppSummary {
    id: string;
    name: string;
    description?: string;
    path: string;
    url?: string | null;
    isDispatch?: boolean;
    audience?: "internal" | "public";
    publicPaths?: string[];
    protectedPaths?: string[];
    status?: "ready" | "pending";
    statusLabel?: string;
    builderUrl?: string | null;
    branchName?: string | null;
    createdAt?: string | null;
    agentCardUrl?: string | null;
    agentCardReachable?: boolean;
    a2aEndpointUrl?: string | null;
    agentName?: string | null;
    agentSkillsCount?: number | null;
    archived?: boolean;
}
export declare function workspaceAppHref(app: WorkspaceAppSummary): string | null;
export declare function isPendingBuilderHref(app: WorkspaceAppSummary): boolean;
//# sourceMappingURL=workspace-apps.d.ts.map