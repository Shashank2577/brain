import { type DispatchCtx } from "./dispatch-store.js";
import { type WorkspaceResourceKind } from "./workspace-resources-store.js";
type DreamStatus = "running" | "completed" | "failed";
type ProposalTargetType = "personal-memory" | "shared-learnings" | "workspace-instruction" | "workspace-skill" | "workspace-knowledge" | "workspace-agent";
type ProposalRisk = "low" | "medium" | "high";
type DreamSourceStatus = "ok" | "timed_out" | "error";
export interface DreamSourceHealth {
    sourceId: string;
    label?: string | null;
    status: DreamSourceStatus;
    startedAt: number;
    completedAt: number;
    durationMs: number;
    timeoutMs: number;
    inspectedThreadCount: number;
    candidateCount: number;
    errorCount: number;
    threadErrorCount: number;
    message?: string | null;
}
interface DreamCandidateReason {
    code: string;
    label: string;
    score: number;
    evidenceCount: number;
}
export interface DreamEvidence {
    kind: string;
    label: string;
    snippet: string;
    threadId: string;
    threadTitle?: string;
    sourceId?: string | null;
    runId?: string | null;
    messageIndex?: number;
    createdAt?: number | null;
}
export interface DreamCandidate {
    thread: {
        id: string;
        ownerEmail: string;
        title: string;
        preview: string;
        messageCount: number;
        createdAt: number;
        updatedAt: number;
    };
    sourceId: string;
    score: number;
    reasons: DreamCandidateReason[];
    evidenceCounts: Record<string, number>;
    evidence: DreamEvidence[];
    latestRunStatus: string | null;
}
export interface DreamProposalInput {
    targetType: ProposalTargetType;
    targetPath: string;
    title: string;
    summary: string;
    rationale: string;
    content: string;
    evidence: DreamEvidence[];
    confidence: number;
    risk: ProposalRisk;
}
export interface DreamMemoryNote {
    path: string;
    content: string;
}
export interface DreamMemoryContext {
    personalIndex: string;
    personalNotes: DreamMemoryNote[];
    sharedLearnings: string;
    workspaceResources?: DreamMemoryNote[];
}
export interface DreamProposalBuildResult {
    proposals: DreamProposalInput[];
    guardrailNotes: string[];
}
export interface DreamProposalBuildOptions {
    personalMemoryAllowed?: boolean;
    personalMemoryBlockReason?: string | null;
}
export interface DreamSettings {
    scope: "user" | "org";
    scopeId: string;
    enabled: boolean;
    schedule: string;
    sourceId: string;
    sourceIds: string[];
    allSources: boolean;
    query: string | null;
    limit: number;
    sourceTimeoutMs: number;
    sourceConcurrency: number;
    sourceStartStaggerMs: number;
    threadConcurrency: number;
    threadTimeoutMs: number;
    minCandidateCount: number;
}
export declare function getDreamSettings(): Promise<DreamSettings>;
export declare function setDreamSettings(input: Partial<Pick<DreamSettings, "enabled" | "schedule" | "sourceId" | "sourceIds" | "allSources" | "query" | "limit" | "sourceTimeoutMs" | "sourceConcurrency" | "sourceStartStaggerMs" | "threadConcurrency" | "threadTimeoutMs" | "minCandidateCount">>): Promise<DreamSettings>;
interface ListDreamCandidatesInput {
    sourceId?: string;
    sourceIds?: string[];
    allSources?: boolean;
    query?: string;
    ownerEmail?: string;
    limit?: number;
    sourceTimeoutMs?: number;
    sourceConcurrency?: number;
    sourceStartStaggerMs?: number;
    threadConcurrency?: number;
    threadTimeoutMs?: number;
}
export declare function listDreamCandidates(input: ListDreamCandidatesInput): Promise<{
    source: Record<string, unknown>;
    access: Record<string, unknown>;
    query: string;
    inspectedThreadCount: number;
    candidateCount: number;
    errors: Record<string, unknown>[];
    sources: DreamSourceHealth[];
    candidates: DreamCandidate[];
}>;
export declare function buildProposalInputs(candidates: DreamCandidate[], memoryContext?: DreamMemoryContext, options?: DreamProposalBuildOptions): DreamProposalBuildResult;
export declare function createDreamReport(input: {
    sourceId?: string;
    sourceIds?: string[];
    allSources?: boolean;
    query?: string;
    ownerEmail?: string;
    limit?: number;
    sourceTimeoutMs?: number;
    sourceConcurrency?: number;
    sourceStartStaggerMs?: number;
    threadConcurrency?: number;
    threadTimeoutMs?: number;
    title?: string;
}): Promise<{
    dream: {
        sourceHealth: DreamSourceHealth[];
        id: string;
        ownerEmail: string;
        orgId: string;
        createdBy: string;
        createdAt: number;
        updatedAt: number;
        status: string;
        summary: string;
        sourceId: string;
        title: string;
        query: string;
        report: string;
        candidateCount: number;
        inspectedThreadCount: number;
        error: string;
        startedAt: number;
        completedAt: number;
    };
    proposals: {
        evidence: DreamEvidence[];
        id: string;
        ownerEmail: string;
        orgId: string;
        createdAt: number;
        updatedAt: number;
        targetType: string;
        status: string;
        summary: string;
        title: string;
        dreamId: string;
        targetPath: string;
        rationale: string;
        content: string;
        confidence: number;
        risk: string;
        appliedBy: string;
        appliedAt: number;
        rejectedBy: string;
        rejectedAt: number;
    }[];
}>;
export declare function listDreams(input?: {
    limit?: number;
    status?: DreamStatus | "all";
}): Promise<{
    count: number;
    dreams: {
        proposalCounts: Record<string, number>;
        sourceHealth: DreamSourceHealth[];
        id: string;
        ownerEmail: string;
        orgId: string;
        createdBy: string;
        createdAt: number;
        updatedAt: number;
        status: string;
        summary: string;
        sourceId: string;
        title: string;
        query: string;
        report: string;
        candidateCount: number;
        inspectedThreadCount: number;
        error: string;
        startedAt: number;
        completedAt: number;
    }[];
}>;
export declare function getDream(dreamId: string): Promise<{
    dream: {
        sourceHealth: DreamSourceHealth[];
        id: string;
        ownerEmail: string;
        orgId: string;
        createdBy: string;
        createdAt: number;
        updatedAt: number;
        status: string;
        summary: string;
        sourceId: string;
        title: string;
        query: string;
        report: string;
        candidateCount: number;
        inspectedThreadCount: number;
        error: string;
        startedAt: number;
        completedAt: number;
    };
    proposals: {
        evidence: DreamEvidence[];
        id: string;
        ownerEmail: string;
        orgId: string;
        createdAt: number;
        updatedAt: number;
        targetType: string;
        status: string;
        summary: string;
        title: string;
        dreamId: string;
        targetPath: string;
        rationale: string;
        content: string;
        confidence: number;
        risk: string;
        appliedBy: string;
        appliedAt: number;
        rejectedBy: string;
        rejectedAt: number;
    }[];
}>;
export declare function previewDreamProposal(proposalId: string): Promise<{
    proposal: {
        evidence: DreamEvidence[];
        id: string;
        ownerEmail: string;
        orgId: string;
        createdAt: number;
        updatedAt: number;
        targetType: string;
        status: string;
        summary: string;
        title: string;
        dreamId: string;
        targetPath: string;
        rationale: string;
        content: string;
        confidence: number;
        risk: string;
        appliedBy: string;
        appliedAt: number;
        rejectedBy: string;
        rejectedAt: number;
    };
    target: {
        type: string;
        path: string;
        kind: WorkspaceResourceKind | null;
        resourceId: string | null;
    };
    operation: "create" | "update" | "append";
    targetExists: boolean;
    currentContent: string;
    proposedContent: string;
    approval: {
        required: boolean;
        policyEnabled: boolean;
        willRequestApproval: boolean;
    };
}>;
export declare function applyApprovedDreamProposal(proposalId: string, actor?: string, ctx?: DispatchCtx): Promise<{
    proposal: {
        evidence: DreamEvidence[];
        id: string;
        ownerEmail: string;
        orgId: string;
        createdAt: number;
        updatedAt: number;
        targetType: string;
        status: string;
        summary: string;
        title: string;
        dreamId: string;
        targetPath: string;
        rationale: string;
        content: string;
        confidence: number;
        risk: string;
        appliedBy: string;
        appliedAt: number;
        rejectedBy: string;
        rejectedAt: number;
    };
    result: unknown;
}>;
export declare function applyDreamProposal(proposalId: string): Promise<{
    proposal: {
        evidence: DreamEvidence[];
        id: string;
        ownerEmail: string;
        orgId: string;
        createdAt: number;
        updatedAt: number;
        targetType: string;
        status: string;
        summary: string;
        title: string;
        dreamId: string;
        targetPath: string;
        rationale: string;
        content: string;
        confidence: number;
        risk: string;
        appliedBy: string;
        appliedAt: number;
        rejectedBy: string;
        rejectedAt: number;
    };
    result: unknown;
}>;
export declare function rejectDreamProposal(proposalId: string, reason?: string | null): Promise<{
    evidence: DreamEvidence[];
    id: string;
    ownerEmail: string;
    orgId: string;
    createdAt: number;
    updatedAt: number;
    targetType: string;
    status: string;
    summary: string;
    title: string;
    dreamId: string;
    targetPath: string;
    rationale: string;
    content: string;
    confidence: number;
    risk: string;
    appliedBy: string;
    appliedAt: number;
    rejectedBy: string;
    rejectedAt: number;
}>;
export declare function ensureDreamJob(input: {
    schedule?: string;
    sourceId?: string;
    sourceIds?: string[];
    allSources?: boolean;
    query?: string;
    limit?: number;
    sourceTimeoutMs?: number;
    sourceConcurrency?: number;
    sourceStartStaggerMs?: number;
    threadConcurrency?: number;
    threadTimeoutMs?: number;
    minCandidateCount?: number;
}): Promise<{
    path: string;
    owner: string;
    schedule: string;
    enabled: boolean;
    runAs: string;
    sourceId: string;
    sourceIds: string[];
    allSources: boolean;
    query: string;
    limit: number;
    sourceTimeoutMs: number;
    sourceConcurrency: number;
    sourceStartStaggerMs: number;
    threadConcurrency: number;
    threadTimeoutMs: number;
    minCandidateCount: number;
}>;
export {};
//# sourceMappingURL=dreams-store.d.ts.map