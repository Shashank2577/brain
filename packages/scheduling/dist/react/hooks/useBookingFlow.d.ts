import type { Slot } from "../../shared/index.js";
export type BookerStage = "pick-date" | "pick-slot" | "fill-form" | "submitting" | "success" | "error";
export interface BookerState {
    stage: BookerStage;
    selectedDate: string | null;
    selectedSlot: Slot | null;
    durationChoice: number | null;
    form: {
        name: string;
        email: string;
        notes: string;
        customResponses: Record<string, any>;
    };
    error: string | null;
    resultBookingUid: string | null;
}
export interface UseBookingFlowOpts {
    initial?: Partial<BookerState>;
    onStateChange?: (state: BookerState) => void;
}
export declare function useBookingFlow(opts?: UseBookingFlowOpts): {
    state: BookerState;
    update: (partial: Partial<BookerState>) => void;
    selectDate: (date: string) => void;
    selectSlot: (slot: Slot) => void;
    setForm: (patch: Partial<BookerState["form"]>) => void;
    backToDate: () => void;
    backToSlot: () => void;
    submitStart: () => void;
    submitSuccess: (uid: string) => void;
    submitError: (err: string) => void;
};
//# sourceMappingURL=useBookingFlow.d.ts.map