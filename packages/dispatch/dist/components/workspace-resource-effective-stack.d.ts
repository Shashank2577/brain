export declare function appAvailabilityLabel(value?: string): "Inherited by all apps" | "Granted to this app" | "Not granted" | "Select app" | "Not managed" | "Checking";
export declare function appLayerState(layer: any): {
    label: string;
    className: string;
};
export declare function formatResourceTimestamp(value?: number | null): string;
export declare function AppResourceEffectiveStack({ appId, resource, }: {
    appId: string;
    resource: any;
}): import("react/jsx-runtime").JSX.Element;
//# sourceMappingURL=workspace-resource-effective-stack.d.ts.map