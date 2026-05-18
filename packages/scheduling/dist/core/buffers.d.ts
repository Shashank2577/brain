/**
 * Buffer application.
 *
 * Buffers pad a slot with prep/cool-down time that the host needs but the
 * attendee shouldn't see as part of the meeting. A before-event buffer
 * means the slot reserves extra time before its displayed start; the slot
 * itself is still shown at the true meeting time.
 *
 * The practical effect: a slot [10:00–10:30] with before=10 means the host
 * is considered "busy" from 09:50 to 10:30, so it conflicts with a 09:00–09:50
 * meeting only if THAT meeting also has an after-buffer.
 */
import type { BusyInterval } from "../shared/index.js";
/** Expand a busy interval to include before/after buffers. */
export declare function applyBuffers(busy: BusyInterval, beforeMinutes: number, afterMinutes: number): BusyInterval;
/**
 * Expand a proposed slot window (start→end) to include the event type's
 * before/after buffers. The expanded window is what collision detection
 * uses; the displayed slot remains the unexpanded window.
 */
export declare function expandSlotForConflictCheck(start: Date, end: Date, beforeMinutes: number, afterMinutes: number): {
    start: Date;
    end: Date;
};
//# sourceMappingURL=buffers.d.ts.map