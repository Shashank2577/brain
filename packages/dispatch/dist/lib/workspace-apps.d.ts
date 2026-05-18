export interface WorkspaceAppSummary {
    id: string;
    name: string;
    description?: string;
    path: string;
    url?: string | null;
    isDispatch?: boolean;
    status?: "ready" | "pending";
    statusLabel?: string;
    builderUrl?: string | null;
    branchName?: string | null;
    archived?: boolean;
}
export declare function workspaceAppHref(app: WorkspaceAppSummary): string | null;
export declare function isPendingBuilderHref(app: WorkspaceAppSummary): boolean;
//# sourceMappingURL=workspace-apps.d.ts.map