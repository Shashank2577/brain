import type { EventType } from "../../shared/index.js";
export interface UseEventTypeOpts {
    id?: string;
    slug?: string;
    ownerEmail?: string;
    teamId?: string;
    fetchEventType: (params: {
        id?: string;
        slug?: string;
        ownerEmail?: string;
        teamId?: string;
    }) => Promise<{
        eventType: EventType | null;
    }>;
}
export declare function useEventType(opts: UseEventTypeOpts): {
    eventType: EventType;
    isLoading: boolean;
    error: Error;
};
//# sourceMappingURL=useEventType.d.ts.map