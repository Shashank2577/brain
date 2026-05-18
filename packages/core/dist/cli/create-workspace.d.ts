export interface CreateWorkspaceOptions {
    name?: string;
    /** Pre-select these templates in the picker. */
    template?: string;
    noInstall?: boolean;
}
export declare function createWorkspace(opts?: CreateWorkspaceOptions): Promise<void>;
//# sourceMappingURL=create-workspace.d.ts.map