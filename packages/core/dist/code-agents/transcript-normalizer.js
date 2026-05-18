export function normalizeCodeAgentTranscript(events) {
    const items = [];
    const hiddenEvents = [];
    const eventOrder = new Map(events.map((event, index) => [event.id, index]));
    let turnIndex = -1;
    for (const event of events) {
        const currentTurnIndex = Math.max(turnIndex, 0);
        if (event.kind === "user") {
            turnIndex = turnIndex < 0 ? (items.length === 0 ? 0 : 1) : turnIndex + 1;
            items.push(createUserTurn(event, turnIndex));
            continue;
        }
        const assistantSource = assistantTextSource(event);
        if (assistantSource) {
            const text = assistantTextForEvent(event, assistantSource);
            if (!text) {
                hiddenEvents.push(event);
                continue;
            }
            const previous = items.at(-1);
            if (previous?.type === "assistant" &&
                previous.source === assistantSource &&
                previous.turnIndex === currentTurnIndex) {
                appendAssistantChunk(previous, event, text);
            }
            else {
                items.push(createAssistantTurn(event, assistantSource, currentTurnIndex, text));
            }
            continue;
        }
        const toolType = toolEventType(event);
        if (toolType) {
            appendToolEvent(items, event, toolType, currentTurnIndex);
            continue;
        }
        if (shouldShowStatusEvent(event)) {
            items.push(createStatusEvent(event, currentTurnIndex));
        }
        else {
            hiddenEvents.push(event);
        }
    }
    const dedupedItems = suppressDuplicateFinalAssistantText(items, hiddenEvents);
    hiddenEvents.sort((a, b) => (eventOrder.get(a.id) ?? 0) - (eventOrder.get(b.id) ?? 0));
    return {
        items: dedupedItems,
        rawEvents: [...events],
        hiddenEvents,
    };
}
function createUserTurn(event, turnIndex) {
    return {
        type: "user",
        role: "user",
        id: event.id,
        text: event.message,
        createdAt: event.createdAt,
        updatedAt: event.createdAt,
        eventIds: [event.id],
        events: [event],
        turnIndex,
    };
}
function createAssistantTurn(event, source, turnIndex, text) {
    return {
        type: "assistant",
        role: "assistant",
        id: event.id,
        text,
        source,
        createdAt: event.createdAt,
        updatedAt: event.createdAt,
        eventIds: [event.id],
        events: [event],
        turnIndex,
    };
}
function appendAssistantChunk(item, event, text) {
    item.text = shouldAppendAssistantChunkExactly(item, event)
        ? `${item.text}${text}`
        : joinAssistantChunks(item.text, text);
    item.updatedAt = event.createdAt;
    item.eventIds.push(event.id);
    item.events.push(event);
}
function createStatusEvent(event, turnIndex) {
    const metadata = event.metadata;
    return {
        type: "status",
        id: event.id,
        text: event.message,
        level: statusEventLevel(event),
        statusKind: event.kind,
        status: stringMetadata(metadata, "status"),
        phase: stringMetadata(metadata, "phase"),
        metadata,
        createdAt: event.createdAt,
        updatedAt: event.createdAt,
        eventIds: [event.id],
        events: [event],
        turnIndex,
    };
}
function appendToolEvent(items, event, toolType, turnIndex) {
    const tool = stringMetadata(event.metadata, "tool");
    const item = findOpenToolEvent(items, tool, turnIndex);
    if (!item) {
        items.push(createToolEvent(event, toolType, turnIndex));
        return;
    }
    item.updatedAt = event.createdAt;
    item.eventIds.push(event.id);
    item.events.push(event);
    if (toolType === "activity") {
        item.activities.push(event.message);
        if (item.state === "activity")
            item.label = event.message;
        return;
    }
    if (toolType === "tool_start") {
        const wasActivity = item.state === "activity";
        item.state = "running";
        item.startedAt = item.startedAt ?? event.createdAt;
        if (hasMetadataKey(event.metadata, "input")) {
            item.input = event.metadata?.input;
        }
        if (wasActivity || item.label === item.activities.at(-1)) {
            item.label = event.message;
        }
        return;
    }
    item.state = "completed";
    item.completedAt = event.createdAt;
    if (hasMetadataKey(event.metadata, "result")) {
        item.result = event.metadata?.result;
    }
}
function createToolEvent(event, toolType, turnIndex) {
    const metadata = event.metadata;
    const state = toolType === "tool_done"
        ? "completed"
        : toolType === "tool_start"
            ? "running"
            : "activity";
    return {
        type: "tool",
        id: event.id,
        tool: stringMetadata(metadata, "tool"),
        label: event.message,
        state,
        input: hasMetadataKey(metadata, "input") ? metadata?.input : undefined,
        result: hasMetadataKey(metadata, "result") ? metadata?.result : undefined,
        activities: toolType === "activity" ? [event.message] : [],
        startedAt: toolType === "tool_start" ? event.createdAt : undefined,
        completedAt: toolType === "tool_done" ? event.createdAt : undefined,
        createdAt: event.createdAt,
        updatedAt: event.createdAt,
        eventIds: [event.id],
        events: [event],
        turnIndex,
    };
}
function findOpenToolEvent(items, tool, turnIndex) {
    for (let index = items.length - 1; index >= 0; index -= 1) {
        const item = items[index];
        if (item.type !== "tool")
            continue;
        if (item.turnIndex !== turnIndex)
            continue;
        if (item.state === "completed")
            continue;
        if (tool && item.tool !== tool)
            continue;
        if (!tool && item.tool)
            continue;
        return item;
    }
    return null;
}
function suppressDuplicateFinalAssistantText(items, hiddenEvents) {
    const result = [];
    for (const item of items) {
        if (item.type !== "assistant" || item.source !== "system") {
            result.push(item);
            continue;
        }
        const stdoutItems = result.filter((candidate) => candidate.type === "assistant" &&
            candidate.source === "runner-stdout" &&
            candidate.turnIndex === item.turnIndex);
        if (stdoutItems.length === 0 ||
            !isSameAssistantText(stdoutItems.map((candidate) => candidate.text).join(" "), item.text)) {
            result.push(item);
            continue;
        }
        hiddenEvents.push(...item.events);
        const target = stdoutItems.length === 1 ? stdoutItems[0] : stdoutItems.at(-1);
        if (!target)
            continue;
        if (stdoutItems.length === 1) {
            target.text = item.text;
            target.updatedAt = item.updatedAt;
        }
        target.eventIds.push(...item.eventIds);
        target.events.push(...item.events);
        target.suppressedDuplicateEventIds = [
            ...(target.suppressedDuplicateEventIds ?? []),
            ...item.eventIds,
        ];
    }
    return result;
}
function shouldShowStatusEvent(event) {
    if (event.kind === "artifact" || event.kind === "note")
        return true;
    if (event.kind !== "status")
        return false;
    if (isLowSignalLifecycleEvent(event))
        return false;
    return true;
}
function isLowSignalLifecycleEvent(event) {
    const metadata = event.metadata;
    const type = stringMetadata(metadata, "type");
    if (type === "mcp-tools-connected")
        return true;
    if (statusEventLevel(event) !== "info")
        return false;
    const status = stringMetadata(metadata, "status");
    const phase = stringMetadata(metadata, "phase");
    if (status === "queued" || status === "running" || status === "completed") {
        return true;
    }
    if (phase === "queued" ||
        phase === "starting" ||
        phase === "executing" ||
        phase === "follow-up" ||
        phase === "complete") {
        return true;
    }
    return LOW_SIGNAL_STATUS_MESSAGES.some((pattern) => pattern.test(event.message));
}
const LOW_SIGNAL_STATUS_MESSAGES = [
    /^Agent-Native Code run started\.?$/i,
    /^Agent-Native Code run completed\.?$/i,
    /^Agent-Native Code process exited\.?$/i,
    /^Starting local Agent-Native Code execution\.?$/i,
    /^Remote Agent-Native Code run queued\.?$/i,
    /^Connected \d+ MCP tools? for this run\.?$/i,
];
function statusEventLevel(event) {
    const metadata = event.metadata;
    const status = stringMetadata(metadata, "status");
    const phase = stringMetadata(metadata, "phase");
    const source = stringMetadata(metadata, "source");
    const type = stringMetadata(metadata, "type");
    if (status === "needs-approval" ||
        Boolean(metadata?.pendingApproval) ||
        Boolean(metadata?.pendingApprovalId) ||
        Boolean(metadata?.approvalId) ||
        phase?.includes("approval") ||
        /\bapproval\b/i.test(event.message)) {
        return "approval";
    }
    if (event.kind === "status" &&
        (status === "errored" ||
            type === "error" ||
            type?.endsWith("-error") ||
            Boolean(metadata?.failed) ||
            typeof metadata?.errorCode === "string" ||
            source === "runner-stderr")) {
        return "error";
    }
    if (status === "paused" ||
        phase === "missing-credentials" ||
        phase === "stopped" ||
        /\b(missing|stopped|unavailable|denied)\b/i.test(event.message)) {
        return "warning";
    }
    return "info";
}
function assistantTextSource(event) {
    const source = stringMetadata(event.metadata, "source");
    const type = stringMetadata(event.metadata, "type");
    if (type === "assistant_delta") {
        return "runner-stdout";
    }
    if (event.kind === "status" && source === "runner-stdout") {
        return "runner-stdout";
    }
    if (event.kind === "system" || event.metadata?.role === "assistant") {
        return "system";
    }
    return null;
}
function shouldAppendAssistantChunkExactly(item, event) {
    return (item.source === "runner-stdout" &&
        (isAssistantDeltaEvent(event) || item.events.some(isAssistantDeltaEvent)));
}
function isAssistantDeltaEvent(event) {
    return stringMetadata(event.metadata, "type") === "assistant_delta";
}
function assistantTextForEvent(event, source) {
    if (source === "runner-stdout") {
        return stripRunnerDiagnostics(event.message, {
            trim: !isAssistantDeltaEvent(event),
        });
    }
    return event.message;
}
function stripRunnerDiagnostics(value, options = {}) {
    const stripped = value
        .replace(RUNNER_DIAGNOSTIC_LINE_PATTERNS.engineDetect, "")
        .replace(RUNNER_DIAGNOSTIC_LINE_PATTERNS.builderEngine, "")
        .replace(RUNNER_DIAGNOSTIC_LINE_PATTERNS.sessionStartedBanner, "");
    return options.trim === false ? stripped : stripped.trim();
}
const RUNNER_DIAGNOSTIC_LINE_PATTERNS = {
    engineDetect: /^\[engine-detect\][^\r\n]*(?:\r?\n|$)/gm,
    builderEngine: /^\[builder-engine\]\s*[←→][^\r\n]*(?:\r?\n|$)/gm,
    // Strip the "Agent-Native Code session started." banner block that the CLI
    // prints to stdout at the start of every run. It is informational for
    // terminal users but clutters the chat transcript.
    sessionStartedBanner: /\n?Agent-Native Code session started\.[\s\S]*?Streaming output below\. The transcript is saved with this run\.\n?/,
};
function toolEventType(event) {
    if (event.kind !== "status")
        return null;
    const type = stringMetadata(event.metadata, "type");
    if (type === "activity" || type === "tool_done" || type === "tool_start") {
        return type;
    }
    return null;
}
function joinAssistantChunks(previous, next) {
    if (!previous)
        return next;
    if (!next)
        return previous;
    if (/\s$/.test(previous) || /^\s/.test(next))
        return `${previous}${next}`;
    if (/^[.,!?;:)\]}'"`]/.test(next))
        return `${previous}${next}`;
    if (/[(\[{'"`]$/.test(previous))
        return `${previous}${next}`;
    return `${previous} ${next}`;
}
function canonicalText(value) {
    return value.replace(/\s+/g, " ").trim();
}
function isSameAssistantText(left, right) {
    if (canonicalText(left) === canonicalText(right))
        return true;
    return compactText(left) === compactText(right);
}
function compactText(value) {
    return canonicalText(value).replace(/\s+/g, "");
}
function stringMetadata(metadata, key) {
    const value = metadata?.[key];
    return typeof value === "string" ? value : undefined;
}
function hasMetadataKey(metadata, key) {
    return (Boolean(metadata) && Object.prototype.hasOwnProperty.call(metadata, key));
}
//# sourceMappingURL=transcript-normalizer.js.map