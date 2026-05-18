export interface WorkspaceAppSummary {
    id: string;
    name: string;
    description: string;
    path: string;
    url: string | null;
    isDispatch: boolean;
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
export interface ListWorkspaceAppsOptions {
    includeAgentCards?: boolean;
    /**
     * Include apps the current viewer has hidden (archived). Defaults to false
     * so polling/UI callers see only the visible set; the apps page passes true
     * when rendering the "Hidden apps" expander.
     */
    includeArchived?: boolean;
}
export interface AvailableWorkspaceTemplate {
    name: string;
    label: string;
    hint: string;
    icon: string;
    color: string;
    colorRgb: string;
    core: boolean;
}
export interface AppCreationSettings {
    builderProjectId: string | null;
    builderProjectIdSource: "env" | "dispatch" | "default" | "unset";
    envBuilderProjectId: string | null;
    savedBuilderProjectId: string | null;
    builderBranchingEnabled: boolean;
}
export interface WorkspaceInfo {
    /** Slug from the workspace root package.json `name` (e.g. "on-call-todo-manager"). */
    name: string | null;
    /** Title-cased version for display (e.g. "On Call Todo Manager"). */
    displayName: string | null;
    /** Absolute path to the workspace root, if detected. */
    rootPath: string | null;
    /** Number of apps currently scaffolded under apps/. */
    appCount: number;
}
export declare function archiveWorkspaceApp(input: {
    appId: string;
}): Promise<{
    archivedAppIds: string[];
}>;
export declare function unarchiveWorkspaceApp(input: {
    appId: string;
}): Promise<{
    archivedAppIds: string[];
}>;
export declare function removePendingWorkspaceApp(input: {
    appId: string;
}): Promise<{
    removed: boolean;
}>;
export declare function getEnvBuilderProjectId(): string | null;
/**
 * Read the workspace's identity from the workspace root's package.json. Used to
 * surface "Workspace: <name>" in the Dispatch UI so first-time users can see
 * the container their apps live inside (rather than only seeing app names like
 * "starter" / "dispatch" with no parent context).
 */
export declare function getWorkspaceInfo(): WorkspaceInfo;
export declare function listWorkspaceApps(options?: ListWorkspaceAppsOptions): Promise<WorkspaceAppSummary[]>;
export declare function listAvailableWorkspaceTemplates(): Promise<AvailableWorkspaceTemplate[]>;
export declare function scaffoldWorkspaceAppFromTemplate(input: {
    template: string;
    appId?: string | null;
}): Promise<{
    appId: string;
    template: string;
    output: string;
}>;
export declare function getAppCreationSettings(): Promise<AppCreationSettings>;
export declare function setAppCreationSettings(input: {
    builderProjectId?: string | null;
}): Promise<AppCreationSettings>;
export declare function startWorkspaceAppCreation(input: {
    prompt: string;
    appId?: string | null;
    template?: string | null;
    secretIds?: string[];
    resourceIds?: string[];
}): Promise<{
    mode: string;
    appId: string;
    message: string;
    prompt?: undefined;
    projectId?: undefined;
    path?: undefined;
    branchName?: undefined;
    url?: undefined;
    workspaceUrl?: undefined;
    status?: undefined;
} | {
    mode: string;
    appId: string;
    prompt: string;
    message: string;
    projectId?: undefined;
    path?: undefined;
    branchName?: undefined;
    url?: undefined;
    workspaceUrl?: undefined;
    status?: undefined;
} | {
    mode: string;
    appId: string;
    projectId: string;
    message: string;
    prompt?: undefined;
    path?: undefined;
    branchName?: undefined;
    url?: undefined;
    workspaceUrl?: undefined;
    status?: undefined;
} | {
    mode: string;
    appId: string;
    path: string;
    projectId: string;
    branchName: string;
    url: string;
    workspaceUrl: string;
    status: string;
    message: string;
    prompt?: undefined;
}>;
//# sourceMappingURL=app-creation-store.d.ts.map