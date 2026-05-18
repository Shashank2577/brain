import { codeAgentRunArtifactsDir, codeAgentRunTranscriptPath, getCodeAgentRunRecord, listCodeAgentRunRecords, listCodeAgentTranscriptEvents, } from "../cli/code-agent-runs.js";
export function toBackgroundAgentRun(run) {
    return {
        schemaVersion: 1,
        id: run.id,
        kind: "code",
        source: "local-code",
        sourceLabel: "Local Code",
        sourceRecord: {
            type: "code-agent-run",
            id: run.id,
        },
        title: run.title,
        subtitle: run.subtitle,
        status: run.status,
        phase: run.phase,
        cwd: run.cwd,
        createdAt: run.createdAt,
        updatedAt: run.updatedAt,
        goalId: run.goalId,
        permissionMode: run.permissionMode,
        progress: run.progress,
        needsInput: run.status === "paused" || run.status === "needs-approval",
        needsApproval: run.needsApproval === true || run.status === "needs-approval",
        details: run.details,
        transcriptPath: codeAgentRunTranscriptPath(run.id),
        artifactRoot: run.artifactRoot ?? codeAgentRunArtifactsDir(run.id),
        surfaceUrl: run.surfaceUrl,
        metadata: run.metadata,
    };
}
export function toBackgroundAgentTranscriptEvent(event) {
    return {
        schemaVersion: 1,
        id: event.id,
        runId: event.runId,
        kind: event.kind,
        source: "local-code",
        sourceRecord: {
            type: "code-agent-transcript-event",
            id: event.id,
        },
        message: event.message,
        createdAt: event.createdAt,
        metadata: event.metadata,
    };
}
export function listBackgroundAgentRuns(options = {}) {
    return listCodeAgentRunRecords(options.goalId).map(toBackgroundAgentRun);
}
export function getBackgroundAgentRun(runId) {
    const run = getCodeAgentRunRecord(runId);
    return run ? toBackgroundAgentRun(run) : null;
}
export function listBackgroundAgentTranscriptEvents(runId) {
    return listCodeAgentTranscriptEvents(runId).map(toBackgroundAgentTranscriptEvent);
}
//# sourceMappingURL=background-run.js.map