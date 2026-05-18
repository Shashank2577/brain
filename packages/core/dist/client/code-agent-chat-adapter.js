import { unwrapAttachmentEnvelope } from "./composer/pasted-text.js";
import { compareCodeAgentTranscriptEvents, isCodeAgentRunActive, } from "../code-agents/transcript-order.js";
import { normalizeCodeAgentTranscript, } from "../code-agents/transcript-normalizer.js";
export function createCodeAgentChatAdapter(options) {
    const pollIntervalMs = options.pollIntervalMs ?? 1000;
    const idlePollIntervalMs = options.idlePollIntervalMs ?? 5000;
    const terminalIdlePolls = options.terminalIdlePolls ?? 3;
    const stopOnAbort = options.stopOnAbort === true;
    return {
        async *run({ messages, abortSignal }) {
            const runId = options.runIdRef.current;
            if (!runId) {
                yield errorResult("Select an Agent-Native Code session first.");
                return;
            }
            const lastUserMessage = latestUserMessage(messages);
            const attachments = lastUserMessage
                ? extractPromptAttachmentsFromAssistantMessage(lastUserMessage)
                : [];
            const prompt = latestUserText(messages).trim() ||
                (attachments.length > 0 ? "Use the attached context." : "");
            if (!prompt.trim()) {
                yield errorResult("Enter a follow-up prompt.");
                return;
            }
            let stoppedFromAbort = false;
            const stopForAbort = () => {
                stoppedFromAbort = true;
                if (stopOnAbort) {
                    void options.controller.control({ runId, command: "stop" });
                }
            };
            if (abortSignal.aborted) {
                stopForAbort();
                return;
            }
            abortSignal.addEventListener("abort", stopForAbort, { once: true });
            try {
                const initialEvents = await options.controller.transcript(runId);
                const seenEventIds = new Set(initialEvents.map((event) => event.id));
                const tailedEvents = [];
                if (!options.attachOnlyRef?.current) {
                    const beforeSendRun = await options.controller.get(runId);
                    const response = await options.controller.sendFollowUp({
                        runId,
                        prompt,
                        mode: options.followUpModeRef?.current ??
                            (beforeSendRun && isCodeAgentRunActive(beforeSendRun)
                                ? "queued"
                                : "immediate"),
                        permissionMode: options.permissionModeRef?.current,
                        engine: options.engineRef?.current,
                        model: options.modelRef?.current,
                        reasoningEffort: options.effortRef?.current,
                        source: "code-agent-chat",
                        metadata: attachments.length > 0 ? { attachments } : undefined,
                    });
                    if (!response.ok) {
                        yield errorResult(response.error ?? response.message ?? "Could not send follow-up.", runId);
                        return;
                    }
                }
                let yieldedContent = false;
                let idleTerminalPolls = 0;
                while (!abortSignal.aborted) {
                    const [events, run] = await Promise.all([
                        options.controller.transcript(runId),
                        options.controller.get(runId),
                    ]);
                    const nextEvents = events
                        .filter((event) => !seenEventIds.has(event.id))
                        .sort(compareCodeAgentTranscriptEvents);
                    for (const event of nextEvents) {
                        seenEventIds.add(event.id);
                        tailedEvents.push(event);
                    }
                    const content = codeAgentTranscriptEventsToContent(tailedEvents);
                    if (content.length > 0 && nextEvents.length > 0) {
                        yieldedContent = true;
                        yield withRunMetadata({ content: [...content] }, runId);
                    }
                    if (run && isCodeAgentRunActive(run)) {
                        idleTerminalPolls = 0;
                    }
                    else if (nextEvents.length === 0) {
                        idleTerminalPolls += 1;
                    }
                    else {
                        idleTerminalPolls = 0;
                    }
                    if (idleTerminalPolls >= terminalIdlePolls) {
                        if (content.length > 0 && !yieldedContent) {
                            yield withRunMetadata({ content: [...content] }, runId);
                        }
                        return;
                    }
                    await sleep(run && isCodeAgentRunActive(run)
                        ? pollIntervalMs
                        : idlePollIntervalMs, abortSignal);
                }
            }
            finally {
                abortSignal.removeEventListener("abort", stopForAbort);
                if (stoppedFromAbort) {
                    return;
                }
            }
        },
    };
}
export function codeAgentTranscriptEventsToContent(events) {
    const normalized = normalizeCodeAgentTranscript(events.map(toCoreCodeAgentTranscriptEvent));
    const content = [];
    const appendText = (text) => {
        const trimmed = text.trim();
        if (!trimmed)
            return;
        const last = content.at(-1);
        if (last?.type === "text") {
            last.text = `${last.text}${last.text ? "\n\n" : ""}${trimmed}`;
        }
        else {
            content.push({ type: "text", text: trimmed });
        }
    };
    for (const item of normalized.items) {
        const part = contentPartForCodeAgentTranscriptItem(item);
        if (!part)
            continue;
        if (part.type === "text") {
            appendText(part.text);
        }
        else {
            content.push(part);
        }
    }
    return content;
}
function latestUserMessage(messages) {
    for (let index = messages.length - 1; index >= 0; index--) {
        const message = messages[index];
        if (message.role === "user")
            return message;
    }
    return undefined;
}
function latestUserText(messages) {
    const message = latestUserMessage(messages);
    return (message?.content
        .filter((part) => part.type === "text")
        .map((part) => part.text)
        .join("\n") ?? "");
}
function extractPromptAttachmentsFromAssistantMessage(message) {
    const attachments = [];
    for (const att of message.attachments ?? []) {
        const name = att.name ?? "attachment";
        for (const part of att.content ?? []) {
            if (part.type === "image" && typeof part.image === "string") {
                attachments.push({
                    name,
                    type: att.contentType,
                    dataUrl: part.image,
                });
            }
            else if (part.type === "file" && typeof part.data === "string") {
                attachments.push({
                    name,
                    type: att.contentType ??
                        (typeof part.mimeType === "string" ? part.mimeType : undefined),
                    ...(part.data.startsWith("data:")
                        ? { dataUrl: part.data }
                        : { text: part.data }),
                });
            }
            else if (part.type === "text" && typeof part.text === "string") {
                attachments.push({
                    name,
                    type: att.contentType,
                    text: unwrapAttachmentEnvelope(part.text),
                });
            }
        }
    }
    return attachments;
}
function toCoreCodeAgentTranscriptEvent(event) {
    return {
        schemaVersion: 1,
        id: event.id,
        runId: event.runId,
        kind: (event.kind ??
            event.type ??
            "status"),
        message: event.message ?? event.text ?? "",
        createdAt: event.createdAt,
        metadata: {
            ...(event.metadata ?? {}),
            ...(event.artifactPath ? { artifactPath: event.artifactPath } : {}),
            ...(event.artifactUrl ? { artifactUrl: event.artifactUrl } : {}),
        },
    };
}
function contentPartForCodeAgentTranscriptItem(item) {
    if (item.type === "assistant") {
        return item.text.trim() ? { type: "text", text: item.text.trim() } : null;
    }
    if (item.type === "tool") {
        return toolContentPartForCodeAgentTranscriptItem(item);
    }
    if (item.type === "status") {
        const text = statusTextForCodeAgentTranscriptItem(item);
        return text ? { type: "text", text } : null;
    }
    return null;
}
function toolContentPartForCodeAgentTranscriptItem(item) {
    return {
        type: "tool-call",
        toolCallId: `code-tool-${item.id}`,
        toolName: item.tool ?? item.label ?? "code-agent",
        argsText: previewValue(item.input) ?? "",
        args: recordArgs(item.input),
        ...(item.result !== undefined
            ? { result: previewValue(item.result) ?? "" }
            : {}),
    };
}
function statusTextForCodeAgentTranscriptItem(item) {
    if (item.statusKind === "artifact") {
        const event = item.events[0];
        const path = stringMetadata(event?.metadata, "artifactPath") ??
            stringMetadata(event?.metadata, "path");
        const url = stringMetadata(event?.metadata, "artifactUrl");
        const target = url ?? path;
        return target
            ? `Artifact: ${item.text}\n${target}`
            : `Artifact: ${item.text}`;
    }
    if (item.level === "info" && item.statusKind !== "note")
        return null;
    return item.text;
}
function recordArgs(value) {
    if (!value || typeof value !== "object" || Array.isArray(value))
        return {};
    const result = {};
    for (const [key, entry] of Object.entries(value)) {
        result[key] =
            typeof entry === "string" ? entry : (previewValue(entry) ?? "");
    }
    return result;
}
function previewValue(value) {
    if (value === undefined || value === null)
        return undefined;
    const text = typeof value === "string" ? value : (JSON.stringify(value, null, 2) ?? "");
    const trimmed = text.trim();
    if (!trimmed)
        return undefined;
    return trimmed.length > 4000 ? `${trimmed.slice(0, 4000)}\n...` : trimmed;
}
function stringMetadata(metadata, key) {
    const value = metadata?.[key];
    return typeof value === "string" && value.trim() ? value.trim() : undefined;
}
function withRunMetadata(result, runId) {
    const metadata = (result.metadata ?? {});
    const custom = metadata.custom && typeof metadata.custom === "object"
        ? metadata.custom
        : {};
    return {
        ...result,
        metadata: {
            ...metadata,
            custom: { ...custom, runId },
        },
    };
}
function errorResult(message, runId) {
    return withRunMetadata({
        content: [{ type: "text", text: message }],
        status: { type: "incomplete", reason: "error" },
    }, runId ?? "code-agent");
}
function sleep(ms, abortSignal) {
    if (abortSignal.aborted)
        return Promise.resolve();
    return new Promise((resolve) => {
        const timeout = setTimeout(resolve, ms);
        abortSignal.addEventListener("abort", () => {
            clearTimeout(timeout);
            resolve();
        }, { once: true });
    });
}
//# sourceMappingURL=code-agent-chat-adapter.js.map