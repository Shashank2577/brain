export declare function workspaceResourceMutationMessage(result: any, fallback: string): string;
export declare function ImpactPreview({ operation, resourceId, path, scope, enabled, }: {
    operation: "create" | "update" | "delete";
    resourceId?: string;
    path?: string;
    scope?: "all" | "selected";
    enabled?: boolean;
}): import("react/jsx-runtime").JSX.Element;
//# sourceMappingURL=workspace-resource-impact-preview.d.ts.map