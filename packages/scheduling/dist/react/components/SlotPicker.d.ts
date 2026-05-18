/**
 * SlotPicker — minimal, unstyled primitive that renders a vertical list of
 * available slots grouped by date. Consumers style the buttons via their
 * own Tailwind class layer.
 *
 * This is the "headless" spec: if you want a fully styled picker, look at
 * `templates/scheduling/app/components/booker/SlotPicker.tsx`.
 */
import type { Slot } from "../../shared/index.js";
export interface SlotPickerProps {
    slots: Slot[];
    timezone: string;
    selectedStart?: string;
    onSelect: (slot: Slot) => void;
    timeFormat?: "12h" | "24h";
    className?: string;
    slotClassName?: string;
    dayClassName?: string;
}
export declare function SlotPicker(props: SlotPickerProps): import("react/jsx-runtime").JSX.Element;
//# sourceMappingURL=SlotPicker.d.ts.map