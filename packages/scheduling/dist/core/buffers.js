import { addMinutes } from "./time.js";
/** Expand a busy interval to include before/after buffers. */
export function applyBuffers(busy, beforeMinutes, afterMinutes) {
    return {
        ...busy,
        start: new Date(addMinutes(new Date(busy.start), -beforeMinutes)).toISOString(),
        end: new Date(addMinutes(new Date(busy.end), afterMinutes)).toISOString(),
    };
}
/**
 * Expand a proposed slot window (start→end) to include the event type's
 * before/after buffers. The expanded window is what collision detection
 * uses; the displayed slot remains the unexpanded window.
 */
export function expandSlotForConflictCheck(start, end, beforeMinutes, afterMinutes) {
    return {
        start: addMinutes(start, -beforeMinutes),
        end: addMinutes(end, afterMinutes),
    };
}
//# sourceMappingURL=buffers.js.map