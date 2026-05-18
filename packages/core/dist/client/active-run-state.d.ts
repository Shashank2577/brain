export interface ActiveRunState {
    threadId: string;
    runId: string;
    lastSeq: number;
}
export declare function setActiveRun(state: ActiveRunState): void;
export declare function getActiveRun(): ActiveRunState | null;
export declare function updateActiveRunSeq(seq: number): void;
export declare function clearActiveRun(): void;
//# sourceMappingURL=active-run-state.d.ts.map