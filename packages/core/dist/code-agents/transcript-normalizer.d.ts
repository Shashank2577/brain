import type { CodeAgentTranscriptEvent } from "../cli/code-agent-runs.js";
export type { CodeAgentTranscriptEvent } from "../cli/code-agent-runs.js";
export type NormalizedCodeAgentTranscriptItem = NormalizedCodeAgentUserTurn | NormalizedCodeAgentAssistantTurn | NormalizedCodeAgentToolEvent | NormalizedCodeAgentStatusEvent;
export interface NormalizedCodeAgentTranscript {
    items: NormalizedCodeAgentTranscriptItem[];
    rawEvents: CodeAgentTranscriptEvent[];
    hiddenEvents: CodeAgentTranscriptEvent[];
}
export interface NormalizedCodeAgentTranscriptBase {
    id: string;
    createdAt: string;
    updatedAt: string;
    eventIds: string[];
    events: CodeAgentTranscriptEvent[];
    turnIndex: number;
}
export interface NormalizedCodeAgentUserTurn extends NormalizedCodeAgentTranscriptBase {
    type: "user";
    role: "user";
    text: string;
}
export interface NormalizedCodeAgentAssistantTurn extends NormalizedCodeAgentTranscriptBase {
    type: "assistant";
    role: "assistant";
    text: string;
    source: "system" | "runner-stdout";
    suppressedDuplicateEventIds?: string[];
}
export interface NormalizedCodeAgentToolEvent extends NormalizedCodeAgentTranscriptBase {
    type: "tool";
    tool?: string;
    label: string;
    state: "activity" | "running" | "completed";
    input?: unknown;
    result?: unknown;
    activities: string[];
    startedAt?: string;
    completedAt?: string;
}
export interface NormalizedCodeAgentStatusEvent extends NormalizedCodeAgentTranscriptBase {
    type: "status";
    level: "info" | "warning" | "error" | "approval";
    text: string;
    statusKind: CodeAgentTranscriptEvent["kind"];
    status?: string;
    phase?: string;
    metadata?: Record<string, unknown>;
}
export declare function normalizeCodeAgentTranscript(events: readonly CodeAgentTranscriptEvent[]): NormalizedCodeAgentTranscript;
//# sourceMappingURL=transcript-normalizer.d.ts.map