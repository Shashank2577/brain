import type { AgentPromptAttachment } from "../code-agents/prompt-attachments.js";
export type CodeAgentRunStatus = "queued" | "running" | "paused" | "needs-approval" | "completed" | "errored" | "unknown";
export declare const CODE_AGENT_PERMISSION_MODES: readonly ["read-only", "ask-before-edit", "auto-edit", "full-auto"];
export type CodeAgentPermissionMode = (typeof CODE_AGENT_PERMISSION_MODES)[number];
export interface CodeAgentRunProgress {
    label?: string;
    completed: number;
    total: number;
    failed?: number;
    percent: number;
}
export interface CodeAgentRunDetail {
    label: string;
    value: string;
}
export type CodeAgentFollowUpMode = "immediate" | "queued";
export interface CodeAgentPendingFollowUp {
    id: string;
    prompt: string;
    mode: CodeAgentFollowUpMode;
    createdAt: string;
    eventId?: string;
    permissionMode?: CodeAgentPermissionMode;
    source?: string;
    attachments?: AgentPromptAttachment[];
}
export interface CodeAgentRunRecord {
    schemaVersion: 1;
    id: string;
    goalId: string;
    title: string;
    subtitle?: string;
    status: CodeAgentRunStatus;
    phase?: string;
    needsApproval?: boolean;
    progress?: CodeAgentRunProgress;
    permissionMode?: CodeAgentPermissionMode;
    details?: CodeAgentRunDetail[];
    artifactRoot?: string;
    surfaceUrl?: string;
    cwd: string;
    createdAt: string;
    updatedAt: string;
    metadata?: Record<string, unknown>;
}
export type CodeAgentTranscriptEventKind = "user" | "system" | "note" | "artifact" | "status";
export interface CodeAgentTranscriptEvent {
    schemaVersion: 1;
    id: string;
    runId: string;
    kind: CodeAgentTranscriptEventKind;
    message: string;
    createdAt: string;
    metadata?: Record<string, unknown>;
}
export interface CreateCodeAgentRunInput {
    goalId: string;
    title: string;
    subtitle?: string;
    status?: CodeAgentRunStatus;
    phase?: string;
    needsApproval?: boolean;
    progress?: CodeAgentRunProgress;
    permissionMode?: CodeAgentPermissionMode;
    details?: CodeAgentRunDetail[];
    artifactRoot?: string;
    surfaceUrl?: string;
    cwd?: string;
    metadata?: Record<string, unknown>;
}
export interface AppendCodeAgentTranscriptEventInput {
    runId: string;
    kind: CodeAgentTranscriptEventKind;
    message: string;
    createdAt?: string;
    metadata?: Record<string, unknown>;
}
export interface QueueCodeAgentFollowUpInput {
    runId: string;
    prompt: string;
    mode: CodeAgentFollowUpMode;
    eventId?: string;
    permissionMode?: CodeAgentPermissionMode;
    source?: string;
    createdAt?: string;
    attachments?: AgentPromptAttachment[];
}
export declare function codeAgentStoreRoot(): string;
export declare function codeAgentRunsDir(): string;
export declare function codeAgentRunArtifactsDir(runId: string): string;
export declare function codeAgentTranscriptsDir(): string;
export declare function codeAgentRunTranscriptPath(runId: string): string;
export declare function createCodeAgentRunRecord(input: CreateCodeAgentRunInput): CodeAgentRunRecord;
export declare function normalizeCodeAgentPermissionMode(value: unknown): CodeAgentPermissionMode | null;
export declare function writeCodeAgentRunRecord(record: CodeAgentRunRecord): void;
export declare function getCodeAgentRunRecord(runId: string): CodeAgentRunRecord | null;
export declare function updateCodeAgentRunRecord(runId: string, updates: Partial<CodeAgentRunRecord> | ((record: CodeAgentRunRecord) => Partial<CodeAgentRunRecord>)): CodeAgentRunRecord | null;
export declare function listCodeAgentRunRecords(goalId?: string): CodeAgentRunRecord[];
export declare function getLastCodeAgentRunRecord(goalId?: string): CodeAgentRunRecord | null;
export declare function appendCodeAgentTranscriptEvent(input: AppendCodeAgentTranscriptEventInput): CodeAgentTranscriptEvent;
export declare function listCodeAgentTranscriptEvents(runId: string): CodeAgentTranscriptEvent[];
export declare function isActiveCodeAgentRun(run: CodeAgentRunRecord): boolean;
export declare function queueCodeAgentFollowUp(input: QueueCodeAgentFollowUpInput): CodeAgentPendingFollowUp | null;
export declare function dequeueCodeAgentFollowUp(runId: string): CodeAgentPendingFollowUp | null;
//# sourceMappingURL=code-agent-runs.d.ts.map