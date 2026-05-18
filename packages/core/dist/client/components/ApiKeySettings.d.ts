interface ApiKeySettingsProps {
    /** Path to the settings page (used for linking). Default: "/settings" */
    settingsPath?: string;
}
/**
 * Reusable component that shows the status of configured API keys
 * and lets users enter missing ones. Fetches from /_agent-native/env-status
 * and saves via POST /_agent-native/env-vars.
 */
export declare function ApiKeySettings({ settingsPath: _settingsPath, }: ApiKeySettingsProps): import("react/jsx-runtime").JSX.Element;
export {};
//# sourceMappingURL=ApiKeySettings.d.ts.map