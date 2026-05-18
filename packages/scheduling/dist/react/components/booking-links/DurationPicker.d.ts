export interface DurationPickerProps {
    value: number[];
    onChange: (next: number[]) => void;
    presets?: number[];
    /** Minimum valid duration, defaults to 5 (minutes). */
    min?: number;
}
export declare function DurationPicker(props: DurationPickerProps): import("react/jsx-runtime").JSX.Element;
//# sourceMappingURL=DurationPicker.d.ts.map