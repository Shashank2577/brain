import type { Slot } from "../../shared/index.js";
export interface UseSlotsOpts {
    eventTypeId?: string;
    slug?: string;
    ownerEmail?: string;
    teamId?: string;
    from: string;
    to: string;
    timezone?: string;
    /** Consumer-provided fetch function — typically calls `check-availability` */
    fetchSlots: (params: {
        eventTypeId?: string;
        slug?: string;
        ownerEmail?: string;
        teamId?: string;
        from: string;
        to: string;
        timezone?: string;
    }) => Promise<{
        slots: Slot[];
    }>;
    /** If false, don't fetch (e.g. waiting on a dependency) */
    enabled?: boolean;
}
export interface UseSlotsResult {
    slots: Slot[];
    isLoading: boolean;
    error: Error | null;
    refetch: () => void;
}
export declare function useSlots(opts: UseSlotsOpts): UseSlotsResult;
//# sourceMappingURL=useSlots.d.ts.map