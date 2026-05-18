/**
 * Conflict detection — does a proposed interval overlap any busy interval?
 */
import type { BusyInterval } from "../shared/index.js";
export declare function hasConflict(slot: {
    start: Date;
    end: Date;
}, busy: BusyInterval[]): boolean;
/** Merge overlapping busy intervals into a canonical, non-overlapping set. */
export declare function mergeBusy(busy: BusyInterval[]): BusyInterval[];
//# sourceMappingURL=conflicts.d.ts.map