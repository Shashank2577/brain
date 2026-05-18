import { type CodeAgentPermissionMode, type CodeAgentRunDetail, type CodeAgentRunProgress, type CodeAgentRunRecord, type CodeAgentRunStatus, type CodeAgentTranscriptEvent, type CodeAgentTranscriptEventKind } from "../cli/code-agent-runs.js";
export type BackgroundAgentRunKind = "code" | "agent-team";
export type BackgroundAgentRunSource = "local-code" | "hosted-agent-team";
export type BackgroundAgentRunStatus = CodeAgentRunStatus;
export interface BackgroundAgentRunSourceRecord {
    type: "code-agent-run" | "agent-team-task";
    id: string;
    threadId?: string;
}
export interface BackgroundAgentRun {
    schemaVersion: 1;
    id: string;
    kind: BackgroundAgentRunKind;
    source: BackgroundAgentRunSource;
    sourceLabel?: string;
    sourceRecord: BackgroundAgentRunSourceRecord;
    title: string;
    subtitle?: string;
    status: BackgroundAgentRunStatus;
    phase?: string;
    cwd?: string;
    createdAt: string;
    updatedAt: string;
    goalId: string;
    permissionMode?: CodeAgentPermissionMode;
    progress?: CodeAgentRunProgress;
    needsInput: boolean;
    needsApproval: boolean;
    details?: CodeAgentRunDetail[];
    transcriptPath?: string;
    artifactRoot?: string;
    surfaceUrl?: string;
    metadata?: Record<string, unknown>;
}
export interface BackgroundAgentTranscriptEvent {
    schemaVersion: 1;
    id: string;
    runId: string;
    kind: CodeAgentTranscriptEventKind;
    source: BackgroundAgentRunSource;
    sourceRecord: {
        type: "code-agent-transcript-event" | "agent-team-run-event";
        id: string;
        seq?: number;
    };
    message: string;
    createdAt: string;
    metadata?: Record<string, unknown>;
}
export interface ListBackgroundAgentRunsOptions {
    goalId?: string;
}
export declare function toBackgroundAgentRun(run: CodeAgentRunRecord): BackgroundAgentRun;
export declare function toBackgroundAgentTranscriptEvent(event: CodeAgentTranscriptEvent): BackgroundAgentTranscriptEvent;
export declare function listBackgroundAgentRuns(options?: ListBackgroundAgentRunsOptions): BackgroundAgentRun[];
export declare function getBackgroundAgentRun(runId: string): BackgroundAgentRun | null;
export declare function listBackgroundAgentTranscriptEvents(runId: string): BackgroundAgentTranscriptEvent[];
//# sourceMappingURL=background-run.d.ts.map