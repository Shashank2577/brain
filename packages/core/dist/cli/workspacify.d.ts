export interface WorkspacifyOptions {
    /** Target app directory (already populated with the copied template) */
    appDir: string;
    /** App name (e.g. "mail") */
    appName: string;
    /** Source template name (e.g. "starter" when appName is "crm") */
    templateName?: string;
    /** Workspace root directory */
    workspaceRoot: string;
    /** Shared workspace package name (e.g. "@my-company/shared") */
    workspaceCoreName: string;
    /** Version range to use for the published @agent-native/core package */
    coreDependencyVersion?: string;
}
export declare function workspacifyApp(opts: WorkspacifyOptions): void;
/**
 * Parse a workspace core package name into its npm scope.
 *   "@my-company/shared" → "my-company"
 *   "shared"             → ""  (no scope — shouldn't happen)
 */
export declare function parseWorkspaceScope(workspaceCoreName: string): string;
//# sourceMappingURL=workspacify.d.ts.map