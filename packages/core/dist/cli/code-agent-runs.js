import crypto from "crypto";
import fs from "fs";
import os from "os";
import path from "path";
export const CODE_AGENT_PERMISSION_MODES = [
    "read-only",
    "ask-before-edit",
    "auto-edit",
    "full-auto",
];
const STORE_ENV = "AGENT_NATIVE_CODE_AGENTS_HOME";
export function codeAgentStoreRoot() {
    return path.resolve(process.env[STORE_ENV] ??
        path.join(os.homedir(), ".agent-native", "code-agents"));
}
export function codeAgentRunsDir() {
    return path.join(codeAgentStoreRoot(), "runs");
}
export function codeAgentRunArtifactsDir(runId) {
    return path.join(codeAgentStoreRoot(), "artifacts", runId);
}
export function codeAgentTranscriptsDir() {
    return path.join(codeAgentStoreRoot(), "transcripts");
}
export function codeAgentRunTranscriptPath(runId) {
    return path.join(codeAgentTranscriptsDir(), `${runId}.jsonl`);
}
export function createCodeAgentRunRecord(input) {
    const now = new Date().toISOString();
    const id = `${input.goalId}-${timestampSlug(now)}-${crypto.randomUUID().slice(0, 8)}`;
    const record = {
        schemaVersion: 1,
        id,
        goalId: input.goalId,
        title: input.title,
        subtitle: input.subtitle,
        status: input.status ?? "queued",
        phase: input.phase,
        needsApproval: input.needsApproval,
        progress: input.progress,
        permissionMode: input.permissionMode,
        details: input.details,
        artifactRoot: input.artifactRoot,
        surfaceUrl: input.surfaceUrl,
        cwd: input.cwd ?? process.cwd(),
        createdAt: now,
        updatedAt: now,
        metadata: input.metadata,
    };
    writeCodeAgentRunRecord(record);
    return record;
}
export function normalizeCodeAgentPermissionMode(value) {
    if (typeof value !== "string")
        return null;
    return CODE_AGENT_PERMISSION_MODES.includes(value)
        ? value
        : null;
}
export function writeCodeAgentRunRecord(record) {
    fs.mkdirSync(codeAgentRunsDir(), { recursive: true });
    fs.writeFileSync(codeAgentRunRecordPath(record.id), `${JSON.stringify(record, null, 2)}\n`);
}
export function getCodeAgentRunRecord(runId) {
    return readRunFile(codeAgentRunRecordPath(runId));
}
export function updateCodeAgentRunRecord(runId, updates) {
    const record = getCodeAgentRunRecord(runId);
    if (!record)
        return null;
    const patch = typeof updates === "function" ? updates(record) : updates;
    const next = {
        ...record,
        ...patch,
        metadata: {
            ...(record.metadata ?? {}),
            ...(patch.metadata ?? {}),
        },
        updatedAt: patch.updatedAt ?? new Date().toISOString(),
    };
    writeCodeAgentRunRecord(next);
    return next;
}
export function listCodeAgentRunRecords(goalId) {
    const dir = codeAgentRunsDir();
    if (!fs.existsSync(dir))
        return [];
    return fs
        .readdirSync(dir)
        .filter((file) => file.endsWith(".json"))
        .map((file) => readRunFile(path.join(dir, file)))
        .filter((run) => Boolean(run))
        .filter((run) => !goalId || run.goalId === goalId)
        .sort((a, b) => b.updatedAt.localeCompare(a.updatedAt));
}
export function getLastCodeAgentRunRecord(goalId) {
    return listCodeAgentRunRecords(goalId)[0] ?? null;
}
export function appendCodeAgentTranscriptEvent(input) {
    const createdAt = input.createdAt ?? new Date().toISOString();
    const event = {
        schemaVersion: 1,
        id: `evt-${timestampSlug(createdAt)}-${crypto.randomUUID().slice(0, 8)}`,
        runId: input.runId,
        kind: input.kind,
        message: input.message,
        createdAt,
        metadata: input.metadata,
    };
    fs.mkdirSync(codeAgentTranscriptsDir(), { recursive: true });
    fs.appendFileSync(codeAgentRunTranscriptPath(input.runId), `${JSON.stringify(event)}\n`);
    touchCodeAgentRunRecord(input.runId, createdAt);
    return event;
}
export function listCodeAgentTranscriptEvents(runId) {
    const transcriptPath = codeAgentRunTranscriptPath(runId);
    if (!fs.existsSync(transcriptPath))
        return [];
    return fs
        .readFileSync(transcriptPath, "utf-8")
        .split(/\r?\n/)
        .filter(Boolean)
        .map(readTranscriptLine)
        .filter((event) => Boolean(event));
}
export function isActiveCodeAgentRun(run) {
    return run.status === "running" || run.status === "needs-approval";
}
export function queueCodeAgentFollowUp(input) {
    const createdAt = input.createdAt ?? new Date().toISOString();
    const followUp = {
        id: `followup-${timestampSlug(createdAt)}-${crypto.randomUUID().slice(0, 8)}`,
        prompt: input.prompt,
        mode: input.mode,
        createdAt,
        eventId: input.eventId,
        permissionMode: input.permissionMode,
        source: input.source,
        ...(input.attachments && input.attachments.length > 0
            ? { attachments: input.attachments }
            : {}),
    };
    const updated = updateCodeAgentRunRecord(input.runId, (record) => ({
        metadata: {
            pendingFollowUps: [
                ...readPendingFollowUps(record.metadata?.pendingFollowUps),
                followUp,
            ],
        },
    }));
    return updated ? followUp : null;
}
export function dequeueCodeAgentFollowUp(runId) {
    let selected = null;
    updateCodeAgentRunRecord(runId, (record) => {
        const [first, ...rest] = readPendingFollowUps(record.metadata?.pendingFollowUps);
        selected = first ?? null;
        return {
            metadata: {
                pendingFollowUps: rest.length > 0 ? rest : undefined,
            },
        };
    });
    return selected;
}
function codeAgentRunRecordPath(runId) {
    return path.join(codeAgentRunsDir(), `${runId}.json`);
}
function readPendingFollowUps(value) {
    if (!Array.isArray(value))
        return [];
    return value
        .map((item) => {
        if (!item || typeof item !== "object")
            return null;
        const candidate = item;
        if (typeof candidate.id !== "string" ||
            typeof candidate.prompt !== "string" ||
            typeof candidate.createdAt !== "string" ||
            (candidate.mode !== "immediate" && candidate.mode !== "queued")) {
            return null;
        }
        return {
            id: candidate.id,
            prompt: candidate.prompt,
            mode: candidate.mode,
            createdAt: candidate.createdAt,
            eventId: typeof candidate.eventId === "string" ? candidate.eventId : undefined,
            permissionMode: normalizeCodeAgentPermissionMode(candidate.permissionMode) ??
                undefined,
            source: typeof candidate.source === "string" ? candidate.source : undefined,
        };
    })
        .filter((item) => Boolean(item));
}
function touchCodeAgentRunRecord(runId, updatedAt) {
    const record = readRunFile(codeAgentRunRecordPath(runId));
    if (!record)
        return;
    writeCodeAgentRunRecord({ ...record, updatedAt });
}
function readRunFile(filePath) {
    try {
        const raw = JSON.parse(fs.readFileSync(filePath, "utf-8"));
        if (!raw || typeof raw !== "object")
            return null;
        const record = raw;
        if (record.schemaVersion !== 1 ||
            typeof record.id !== "string" ||
            typeof record.goalId !== "string" ||
            typeof record.title !== "string" ||
            typeof record.status !== "string" ||
            typeof record.cwd !== "string" ||
            typeof record.createdAt !== "string" ||
            typeof record.updatedAt !== "string") {
            return null;
        }
        return record;
    }
    catch {
        return null;
    }
}
function readTranscriptLine(line) {
    try {
        const raw = JSON.parse(line);
        if (!raw || typeof raw !== "object")
            return null;
        const event = raw;
        const kind = isTranscriptEventKind(event.kind)
            ? event.kind
            : normalizeTranscriptKind(event.type ?? event.role);
        const message = typeof event.message === "string"
            ? event.message
            : typeof event.text === "string"
                ? event.text
                : typeof event.content === "string"
                    ? event.content
                    : undefined;
        if (event.schemaVersion !== 1 ||
            typeof event.id !== "string" ||
            typeof event.runId !== "string" ||
            !kind ||
            typeof message !== "string" ||
            typeof event.createdAt !== "string") {
            return null;
        }
        return {
            ...event,
            kind,
            message,
        };
    }
    catch {
        return null;
    }
}
function normalizeTranscriptKind(value) {
    if (typeof value !== "string")
        return null;
    const normalized = value.toLowerCase();
    if (normalized === "human" || normalized === "prompt")
        return "user";
    if (normalized === "assistant")
        return "system";
    if (isTranscriptEventKind(normalized))
        return normalized;
    return null;
}
function isTranscriptEventKind(value) {
    return (value === "user" ||
        value === "system" ||
        value === "note" ||
        value === "artifact" ||
        value === "status");
}
function timestampSlug(value) {
    return value.replace(/\D/g, "").slice(0, 14);
}
//# sourceMappingURL=code-agent-runs.js.map