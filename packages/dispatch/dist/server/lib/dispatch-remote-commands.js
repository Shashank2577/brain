const CODE_COMMAND_RE = /^\/code(?:@[a-zA-Z0-9_]+)?(?:\s+|$)/i;
export function parseTelegramCodeCommand(incoming) {
    if (incoming.platform !== "telegram")
        return null;
    const rawText = rawTelegramText(incoming);
    if (!rawText || !CODE_COMMAND_RE.test(rawText))
        return null;
    return parseCodeCommandBody(rawText.replace(CODE_COMMAND_RE, "").trim());
}
export async function handleRemoteCodeCommand(incoming, _adapter, options) {
    const command = parseTelegramCodeCommand(incoming);
    if (!command)
        return { handled: false };
    if (command.type === "help") {
        return { handled: true, responseText: formatCodeCommandHelp(command) };
    }
    try {
        const ownerEmail = await options.resolveOwner();
        const envelope = createRemoteCodeCommandEnvelope(incoming, ownerEmail, command);
        const relay = options.relay ?? enqueueRemoteCodeCommand;
        const result = await relay(envelope);
        return {
            handled: true,
            responseText: formatRemoteCodeCommandResult(command, result),
        };
    }
    catch (error) {
        return {
            handled: true,
            responseText: error instanceof Error
                ? `I couldn't route that code command: ${error.message}`
                : "I couldn't route that code command.",
        };
    }
}
export function createRemoteCodeCommandEnvelope(incoming, ownerEmail, command) {
    return {
        kind: "code-agent",
        ownerEmail,
        command,
        source: {
            platform: incoming.platform,
            externalThreadId: incoming.externalThreadId,
            senderId: incoming.senderId,
            senderName: incoming.senderName,
            messageId: contextString(incoming.platformContext.messageId),
            timestamp: incoming.timestamp,
        },
    };
}
export async function enqueueRemoteCodeCommand(envelope) {
    const helperResult = await tryCoreRemoteCommandHelper(envelope);
    if (helperResult)
        return helperResult;
    const endpoint = `${resolveRemoteRelayBaseUrl()}/_agent-native/integrations/remote/enqueue`;
    const response = await fetch(endpoint, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(envelope),
    });
    let body = null;
    try {
        body = await response.json();
    }
    catch {
        body = null;
    }
    if (!response.ok) {
        const message = typeof body === "object" && body && "error" in body
            ? String(body.error)
            : `remote relay returned ${response.status}`;
        throw new Error(message);
    }
    return normalizeRemoteCodeCommandResult(body);
}
export function formatRemoteCodeCommandResult(command, result) {
    if (result.message?.trim())
        return result.message.trim();
    if (result.error?.trim())
        return `Code command failed: ${result.error.trim()}`;
    if (command.type === "list")
        return formatRunList(result.runs ?? []);
    if (command.type === "status")
        return formatStatus(command, result);
    const id = result.runId ||
        result.run?.runId ||
        result.run?.id ||
        result.commandId ||
        result.requestId;
    const suffix = id ? ` (${id})` : "";
    const offline = isOfflineOrSleeping(result);
    if (command.type === "create") {
        return offline
            ? `Queued code run${suffix}. Your computer looks offline or asleep, so it will pick this up when it wakes.`
            : `Queued code run${suffix}.`;
    }
    if (command.type === "continue") {
        return offline
            ? `Queued follow-up for ${command.runRef}. Your computer looks offline or asleep, so it will pick this up when it wakes.`
            : `Queued follow-up for ${command.runRef}.`;
    }
    if (command.type === "approve") {
        return `Approved code-agent request ${command.approvalId}.`;
    }
    if (command.type === "deny") {
        return `Denied code-agent request ${command.approvalId}.`;
    }
    if (command.type === "stop") {
        return offline
            ? `Queued stop request for ${command.runRef}. Your computer looks offline or asleep, so it will receive the stop request when it wakes.`
            : `Stop requested for ${command.runRef}.`;
    }
    return "Code command routed.";
}
function parseCodeCommandBody(body) {
    if (!body)
        return { type: "help" };
    const [verbRaw = "", ...restParts] = body.split(/\s+/);
    const verb = verbRaw.toLowerCase();
    const rest = restParts.join(" ").trim();
    if (verb === "help")
        return { type: "help" };
    if (verb === "list")
        return { type: "list" };
    if (verb === "status") {
        return rest ? { type: "status", runRef: rest } : { type: "status" };
    }
    if (verb === "continue") {
        const { first, rest: text } = splitFirst(rest);
        if (!first || !text) {
            return { type: "help", reason: "continue needs a run id and text" };
        }
        return { type: "continue", runRef: first, text };
    }
    if (verb === "approve") {
        return rest
            ? { type: "approve", approvalId: rest }
            : { type: "help", reason: "approve needs a request id" };
    }
    if (verb === "deny") {
        return rest
            ? { type: "deny", approvalId: rest }
            : { type: "help", reason: "deny needs a request id" };
    }
    if (verb === "stop") {
        return rest
            ? { type: "stop", runRef: rest }
            : { type: "help", reason: "stop needs a run id or list index" };
    }
    return { type: "create", prompt: body };
}
function rawTelegramText(incoming) {
    const context = incoming.platformContext;
    return (contextString(context.rawText) ||
        contextString(context.originalText) ||
        contextString(context.messageText) ||
        (CODE_COMMAND_RE.test(incoming.text) ? incoming.text : null));
}
function formatCodeCommandHelp(command) {
    const prefix = command?.reason ? `${command.reason}.\n\n` : "";
    return `${prefix}Use /code <prompt>, /code list, /code status [run], /code continue <run> <text>, /code approve <id>, /code deny <id>, or /code stop <run>.`;
}
function formatRunList(runs) {
    if (!runs.length)
        return "No recent code-agent runs found.";
    const lines = runs.slice(0, 8).map((run, index) => {
        const id = run.runId || run.id || "unknown";
        const title = run.title || run.prompt || "Untitled run";
        const status = run.status || "unknown";
        return `${index + 1}. ${title} — ${status} (${id})`;
    });
    return `Recent code-agent runs:\n${lines.join("\n")}`;
}
function formatStatus(command, result) {
    const run = result.run;
    const hostStatus = result.hostStatus || (result.hostOnline ? "online" : "offline");
    if (!run) {
        const target = command.runRef ? ` for ${command.runRef}` : "";
        return `Code-agent host is ${hostStatus}${target}.`;
    }
    const id = run.runId || run.id || command.runRef || "unknown";
    const title = run.title || run.prompt || "Untitled run";
    const status = run.status || result.status || "unknown";
    const updated = formatDate(run.updatedAt || run.createdAt);
    return [
        `Code run ${id}: ${status}`,
        `Task: ${title}`,
        `Host: ${hostStatus}`,
        updated ? `Updated: ${updated}` : "",
    ]
        .filter(Boolean)
        .join("\n");
}
function isOfflineOrSleeping(result) {
    if (result.hostOnline === false)
        return true;
    const status = result.hostStatus?.toLowerCase();
    return status === "offline" || status === "asleep" || status === "sleeping";
}
function splitFirst(value) {
    const trimmed = value.trim();
    const match = trimmed.match(/^(\S+)(?:\s+([\s\S]+))?$/);
    return { first: match?.[1] || "", rest: match?.[2]?.trim() || "" };
}
function contextString(value) {
    if (typeof value === "string" && value.trim())
        return value.trim();
    if (typeof value === "number" && Number.isFinite(value))
        return String(value);
    return undefined;
}
function formatDate(value) {
    if (!value)
        return null;
    const date = value instanceof Date ? value : new Date(value);
    if (Number.isNaN(date.getTime()))
        return null;
    return date.toISOString();
}
async function tryCoreRemoteCommandHelper(envelope) {
    const core = (await import("@agent-native/core/server"));
    const helper = core.enqueueRemoteCommand ||
        core.enqueueIntegrationRemoteCommand ||
        core.enqueueRemoteIntegrationCommand;
    if (typeof helper !== "function")
        return null;
    return normalizeRemoteCodeCommandResult(await helper(envelope));
}
function normalizeRemoteCodeCommandResult(value) {
    if (!value || typeof value !== "object")
        return { ok: true };
    const result = value;
    return {
        ok: result.ok,
        status: contextString(result.status),
        hostOnline: typeof result.hostOnline === "boolean" ? result.hostOnline : undefined,
        hostStatus: contextString(result.hostStatus),
        commandId: contextString(result.commandId),
        requestId: contextString(result.requestId),
        runId: contextString(result.runId),
        run: result.run,
        runs: Array.isArray(result.runs) ? result.runs : undefined,
        message: contextString(result.message),
        error: contextString(result.error),
    };
}
function resolveRemoteRelayBaseUrl() {
    const raw = process.env.WEBHOOK_BASE_URL ||
        process.env.APP_URL ||
        process.env.URL ||
        "http://localhost:3000";
    if (/^https?:\/\//i.test(raw))
        return raw.replace(/\/$/, "");
    return `https://${raw.replace(/\/$/, "")}`;
}
//# sourceMappingURL=dispatch-remote-commands.js.map