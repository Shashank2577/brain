/**
 * Returns whether the app is running in dev mode and whether mode can be toggled.
 * Fetches /_agent-native/agent-chat/mode on first call, then stays in sync via setDevMode.
 */
export declare function useDevMode(apiBase?: string): {
    isDevMode: boolean;
    canToggle: boolean;
    isLoading: boolean;
    setDevMode: (devMode: boolean) => Promise<void>;
};
//# sourceMappingURL=use-dev-mode.d.ts.map