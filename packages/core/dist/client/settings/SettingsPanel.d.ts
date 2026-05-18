export interface SettingsPanelProps {
    isDevMode: boolean;
    onToggleDevMode: () => void;
    showDevToggle: boolean;
    devAppUrl?: string;
    initialSection?: string | null;
    sectionRequestKey?: number;
}
export declare function SettingsPanel({ isDevMode, onToggleDevMode, showDevToggle, devAppUrl, initialSection, sectionRequestKey, }: SettingsPanelProps): import("react/jsx-runtime").JSX.Element;
//# sourceMappingURL=SettingsPanel.d.ts.map