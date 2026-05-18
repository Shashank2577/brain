export declare const APPEARANCE_PRESETS: readonly [{
    readonly id: "default";
    readonly label: "Default";
    readonly swatch: "hsl(220 10% 30%)";
}, {
    readonly id: "warm";
    readonly label: "Warm";
    readonly swatch: "hsl(25 65% 55%)";
}, {
    readonly id: "ocean";
    readonly label: "Ocean";
    readonly swatch: "hsl(205 70% 55%)";
}, {
    readonly id: "forest";
    readonly label: "Forest";
    readonly swatch: "hsl(145 55% 45%)";
}, {
    readonly id: "rose";
    readonly label: "Rose";
    readonly swatch: "hsl(345 60% 55%)";
}, {
    readonly id: "slate";
    readonly label: "Slate";
    readonly swatch: "hsl(215 25% 45%)";
}];
export type AppearancePresetId = (typeof APPEARANCE_PRESETS)[number]["id"];
export declare function getStoredAppearance(): AppearancePresetId;
export declare function applyAppearance(preset: AppearancePresetId): void;
export declare function useAppearance(): AppearancePresetId;
/**
 * Polls `application_state.appearance` and applies the server-side preset on
 * the client. Use once near the root of the app (e.g. in your `AppLayout`).
 *
 * The agent's `change-appearance` action writes to `application_state.appearance`
 * server-side; this hook surfaces that write into the DOM `data-appearance`
 * attribute and localStorage so the user sees the change immediately and the
 * choice persists across reloads.
 */
export declare function useAppearanceSync(): void;
//# sourceMappingURL=appearance.d.ts.map