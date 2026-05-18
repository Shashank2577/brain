export interface DreamSettings {
    enabled: boolean;
    schedule: string;
    sourceId: string;
    sourceIds?: string[];
    allSources: boolean;
    query?: string | null;
    limit: number;
    sourceTimeoutMs: number;
    sourceConcurrency?: number;
    sourceStartStaggerMs?: number;
    threadConcurrency?: number;
    threadTimeoutMs?: number;
    minCandidateCount: number;
}
export interface DreamSettingsDraft {
    enabled: boolean;
    schedule: string;
    sourceId: string;
    sourceIdsText: string;
    allSources: boolean;
    query: string;
    limit: string;
    sourceTimeoutMs: string;
    sourceConcurrency: string;
    sourceStartStaggerMs: string;
    threadConcurrency: string;
    threadTimeoutMs: string;
    minCandidateCount: string;
}
export declare function dreamSettingsToDraft(settings: DreamSettings | null | undefined): DreamSettingsDraft;
export declare function splitSourceIds(value: string): string[];
export declare function dreamSettingsUpdateFromDraft(draft: DreamSettingsDraft): Partial<DreamSettings>;
//# sourceMappingURL=dream-settings.d.ts.map