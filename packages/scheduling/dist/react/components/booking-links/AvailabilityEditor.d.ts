export type DayKey = "monday" | "tuesday" | "wednesday" | "thursday" | "friday" | "saturday" | "sunday";
export interface TimeSlot {
    start: string;
    end: string;
}
export interface DaySchedule {
    enabled: boolean;
    slots: TimeSlot[];
}
export type WeeklySchedule = Record<DayKey, DaySchedule>;
export interface AvailabilityEditorProps {
    value: WeeklySchedule;
    onChange: (next: WeeklySchedule) => void;
}
export declare function AvailabilityEditor({ value, onChange, }: AvailabilityEditorProps): import("react/jsx-runtime").JSX.Element;
/**
 * Summarize a `WeeklySchedule` in a short phrase, e.g. "Weekdays, 9 am - 5 pm".
 * Useful for list-row subtitles.
 */
export declare function summarizeAvailability(ws: WeeklySchedule): string;
//# sourceMappingURL=AvailabilityEditor.d.ts.map