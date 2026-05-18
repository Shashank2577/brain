/**
 * `useDevOption` — read/write a dev-overlay option backed by localStorage.
 *
 * Storage layout: `agent-native-dev-overlay-option-<panelId>-<optionId>` holds
 * a JSON-encoded value. Falls back to `defaultValue` when the key is missing
 * or the JSON is corrupt.
 */
export declare const DEV_OVERLAY_STORAGE_PREFIX = "agent-native-dev-overlay-";
export declare function devOptionKey(panelId: string, optionId: string): string;
export declare function useDevOption<T>(panelId: string, optionId: string, defaultValue: T): [T, (next: T) => void];
export declare function clearAllDevOverlayStorage(): void;
//# sourceMappingURL=use-dev-option.d.ts.map