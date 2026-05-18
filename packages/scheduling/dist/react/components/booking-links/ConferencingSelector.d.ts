export type ConferencingType = "none" | "google_meet" | "zoom" | "custom";
export interface ConferencingValue {
    type: ConferencingType;
    /** Used for `custom` — the meeting URL. Ignored for `zoom` (OAuth-created). */
    url?: string;
}
export type ProviderStatus = "connected" | "disconnected" | "not-configured";
export interface ConferencingSelectorProps {
    value: ConferencingValue;
    onChange: (next: ConferencingValue) => void;
    zoomStatus?: ProviderStatus;
    googleStatus?: ProviderStatus;
    onConnectZoom?: () => void;
    onConnectGoogle?: () => void;
    /** Hide the label above the grid (for use inside a card with its own title). */
    hideLabel?: boolean;
}
export declare function ConferencingSelector(props: ConferencingSelectorProps): import("react/jsx-runtime").JSX.Element;
//# sourceMappingURL=ConferencingSelector.d.ts.map