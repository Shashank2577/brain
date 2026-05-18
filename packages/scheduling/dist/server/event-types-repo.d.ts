import type { EventType, Location, CustomField, RecurringEventRule } from "../shared/index.js";
export declare function listEventTypes(params: {
    /**
     * If provided and `useAccessFilter` is not true, narrow rows to this owner.
     * For org-aware list calls, prefer `useAccessFilter: true` instead.
     */
    ownerEmail?: string;
    teamId?: string;
    includeHidden?: boolean;
    /**
     * When true, apply the framework `accessFilter` (owner OR shared OR
     * org-visibility OR public) instead of plain ownerEmail equality. This is
     * the right mode for any UI/agent listing, since it admits org-shared and
     * explicitly-shared event types in addition to the user's own.
     */
    useAccessFilter?: boolean;
}): Promise<EventType[]>;
export declare function getEventTypeById(id: string): Promise<EventType | null>;
export declare function getEventTypeBySlug(params: {
    ownerEmail?: string;
    teamId?: string;
    slug: string;
}): Promise<EventType | null>;
export declare function createEventType(input: {
    ownerEmail?: string;
    teamId?: string;
    orgId?: string;
    title: string;
    slug: string;
    length: number;
    description?: string;
    schedulingType?: EventType["schedulingType"];
    locations?: Location[];
    customFields?: CustomField[];
    scheduleId?: string;
    color?: string;
    recurringEvent?: RecurringEventRule;
}): Promise<EventType>;
export declare function updateEventType(id: string, patch: Partial<EventType>): Promise<EventType>;
export declare function deleteEventType(id: string): Promise<void>;
export declare function resolveEventTypeSlug(params: {
    ownerEmail?: string;
    teamId?: string;
    slug: string;
}): Promise<EventType | null>;
//# sourceMappingURL=event-types-repo.d.ts.map