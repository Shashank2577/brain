export declare const WORKSPACE_APP_AUDIENCES: readonly ["internal", "public"];
export type WorkspaceAppAudience = (typeof WORKSPACE_APP_AUDIENCES)[number];
export declare const DEFAULT_WORKSPACE_APP_AUDIENCE: WorkspaceAppAudience;
export interface WorkspaceAppRouteAccess {
    publicPaths: string[];
    protectedPaths: string[];
}
export declare function normalizeWorkspaceAppAudience(value: unknown): WorkspaceAppAudience;
export declare function normalizeWorkspaceAppPathList(value: unknown): string[];
export declare function workspaceAppAudienceFromEnv(env?: Record<string, string | undefined>): WorkspaceAppAudience | undefined;
export declare function workspaceAppRouteAccessFromEnv(env?: Record<string, string | undefined>): WorkspaceAppRouteAccess;
export declare function workspaceAppAudienceFromPackageJson(pkg: unknown): WorkspaceAppAudience | undefined;
/**
 * Per-app route-access config read from a `package.json`. Each field is
 * `undefined` when the corresponding key is fully absent from every
 * supported alias chain — that lets callers distinguish "user didn't say"
 * from "user set [] to clear inherited overrides". `workspaceAppRouteAccess`
 * always emits a full `WorkspaceAppRouteAccess` for runtime consumption.
 */
export interface WorkspaceAppRouteAccessFromConfig {
    publicPaths?: string[];
    protectedPaths?: string[];
}
export declare function workspaceAppRouteAccessFromPackageJson(pkg: unknown): WorkspaceAppRouteAccessFromConfig;
//# sourceMappingURL=workspace-app-audience.d.ts.map