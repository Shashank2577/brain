/**
 * useBookingFlow — the Booker state machine.
 *
 * Stages: "pick-date" → "pick-slot" → "fill-form" → "success"
 * (plus "error" for any step's failure).
 *
 * Persistence: stores the current selection in a tuple that can be mirrored
 * to URL query params and `application_state.booker-state` so both the agent
 * and a page refresh see the same state.
 */
import { useState, useCallback } from "react";
export function useBookingFlow(opts = {}) {
    const [state, setState] = useState(() => ({
        stage: "pick-date",
        selectedDate: null,
        selectedSlot: null,
        durationChoice: null,
        form: { name: "", email: "", notes: "", customResponses: {} },
        error: null,
        resultBookingUid: null,
        ...opts.initial,
    }));
    const update = useCallback((partial) => {
        setState((s) => {
            const next = { ...s, ...partial };
            opts.onStateChange?.(next);
            return next;
        });
    }, [opts.onStateChange]);
    const selectDate = useCallback((date) => update({ selectedDate: date, selectedSlot: null, stage: "pick-slot" }), [update]);
    const selectSlot = useCallback((slot) => update({ selectedSlot: slot, stage: "fill-form" }), [update]);
    const setForm = useCallback((patch) => update({ form: { ...state.form, ...patch } }), [update, state.form]);
    const backToDate = useCallback(() => update({ stage: "pick-date", selectedSlot: null }), [update]);
    const backToSlot = useCallback(() => update({ stage: "pick-slot" }), [update]);
    const submitStart = useCallback(() => update({ stage: "submitting" }), [update]);
    const submitSuccess = useCallback((uid) => update({ stage: "success", resultBookingUid: uid, error: null }), [update]);
    const submitError = useCallback((err) => update({ stage: "error", error: err }), [update]);
    return {
        state,
        update,
        selectDate,
        selectSlot,
        setForm,
        backToDate,
        backToSlot,
        submitStart,
        submitSuccess,
        submitError,
    };
}
//# sourceMappingURL=useBookingFlow.js.map