import { type AppearancePresetId } from "./appearance.js";
export interface AppearancePickerProps {
    className?: string;
    /**
     * Called after a preset is applied (e.g. to persist server-side via
     * the `change-appearance` action so the choice survives across devices).
     */
    onChange?: (preset: AppearancePresetId) => void;
}
export declare function AppearancePicker({ className, onChange, }: AppearancePickerProps): import("react/jsx-runtime").JSX.Element;
//# sourceMappingURL=AppearancePicker.d.ts.map