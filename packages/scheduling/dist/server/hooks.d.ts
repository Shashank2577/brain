import type { Booking } from "../shared/index.js";
export declare function onBookingCreated(booking: Booking): Promise<void>;
export declare function onBookingRescheduled(original: Booking, next: Booking): Promise<void>;
export declare function onBookingCancelled(booking: Booking): Promise<void>;
export declare function onBookingNoShow(booking: Booking): Promise<void>;
//# sourceMappingURL=hooks.d.ts.map