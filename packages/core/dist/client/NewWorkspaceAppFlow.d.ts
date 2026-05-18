export interface VaultSecretOption {
    id: string;
    name: string;
    credentialKey: string;
    provider?: string | null;
    description?: string | null;
}
export interface WorkspaceResourceOption {
    id: string;
    kind: "skill" | "instruction" | "agent" | "knowledge";
    name: string;
    description?: string | null;
    path: string;
    scope: "all" | "selected";
    updatedAt?: number;
}
export interface NewWorkspaceAppFlowProps {
    sourceApp?: string;
    className?: string;
    dispatchBasePath?: string | null;
}
export declare function NewWorkspaceAppFlow({ sourceApp, className, dispatchBasePath, }: NewWorkspaceAppFlowProps): import("react/jsx-runtime").JSX.Element;
//# sourceMappingURL=NewWorkspaceAppFlow.d.ts.map