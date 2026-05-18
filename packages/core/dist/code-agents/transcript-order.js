export function getCodeAgentTranscriptSeq(event) {
    const value = event.metadata?.seq;
    return typeof value === "number" && Number.isFinite(value) ? value : null;
}
export function compareCodeAgentTranscriptEvents(a, b) {
    const seqA = getCodeAgentTranscriptSeq(a);
    const seqB = getCodeAgentTranscriptSeq(b);
    if (seqA !== null && seqB !== null && seqA !== seqB)
        return seqA - seqB;
    const created = a.createdAt.localeCompare(b.createdAt);
    if (created !== 0)
        return created;
    return a.id.localeCompare(b.id);
}
export function mergeCodeAgentTranscriptEvents(current, incoming) {
    if (incoming.length === 0)
        return [...current];
    const byId = new Map(current.map((event) => [event.id, event]));
    for (const event of incoming)
        byId.set(event.id, event);
    return [...byId.values()].sort(compareCodeAgentTranscriptEvents);
}
export function isCodeAgentRunActive(run) {
    const runnerState = stringMetadata(run.metadata, "runnerState");
    if (runnerState === "exited" ||
        runnerState === "failed" ||
        runnerState === "interrupted" ||
        runnerState === "stopped") {
        return false;
    }
    return !(run.needsApproval ||
        run.status === "completed" ||
        run.status === "errored" ||
        run.status === "needs-approval" ||
        run.status === "paused" ||
        run.phase === "complete" ||
        run.phase === "error" ||
        run.phase === "approval-required" ||
        run.phase === "paused" ||
        run.phase === "missing-credentials" ||
        run.phase === "stopped");
}
function stringMetadata(metadata, key) {
    const value = metadata?.[key];
    return typeof value === "string" ? value : undefined;
}
//# sourceMappingURL=transcript-order.js.map