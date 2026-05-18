import type { Schedule, WeeklyAvailability, DateOverride, AvailabilityInterval } from "../shared/index.js";
export declare function listSchedules(ownerEmailOrParams: string | {
    ownerEmail?: string;
    useAccessFilter?: boolean;
}): Promise<Schedule[]>;
export declare function getScheduleById(id: string): Promise<Schedule | null>;
export declare function createSchedule(input: {
    ownerEmail: string;
    orgId?: string;
    name: string;
    timezone: string;
    isDefault?: boolean;
    weeklyAvailability?: WeeklyAvailability[];
}): Promise<Schedule>;
export declare function updateSchedule(id: string, patch: {
    name?: string;
    timezone?: string;
    weeklyAvailability?: WeeklyAvailability[];
    dateOverrides?: DateOverride[];
    isDefault?: boolean;
}): Promise<Schedule>;
export declare function deleteSchedule(id: string): Promise<void>;
export declare function setDefaultSchedule(ownerEmail: string, scheduleId: string): Promise<void>;
export declare function upsertDateOverride(scheduleId: string, date: string, intervals: AvailabilityInterval[]): Promise<void>;
export declare function removeDateOverride(scheduleId: string, date: string): Promise<void>;
//# sourceMappingURL=schedules-repo.d.ts.map