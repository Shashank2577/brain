import type { Booking } from "../../shared/index.js";
export interface UseRescheduleOpts {
    uid: string;
    fetchBooking: (uid: string) => Promise<{
        booking: Booking | null;
    }>;
}
export declare function useReschedule(opts: UseRescheduleOpts): {
    booking: Booking;
    isLoading: boolean;
    error: Error;
};
//# sourceMappingURL=useReschedule.d.ts.map