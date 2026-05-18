import { DEFAULT_OBSERVABILITY_CONFIG } from "./types.js";
function spanId() {
    return `span-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;
}
/** Keys whose values are stripped from persisted tool inputs when
 *  `captureToolArgs` is enabled. Matched case-insensitively and tolerant
 *  of `_` / `-` separators. M14 in the MCP/A2A audit: tool calls
 *  routinely receive credentials verbatim (db-exec INSERTs, fetchTool
 *  Authorization headers, ad-hoc bearer tokens) — keeping those values
 *  out of agent_trace_spans.metadata avoids long-term storage of
 *  short-lived secrets. */
const SENSITIVE_FIELD_PATTERN = /^(authorization|cookie|api[_-]?key|password|secret|token|access[_-]?token|refresh[_-]?token|bearer)$/i;
/** Recursively walk a structured value and replace sensitive field
 *  values with the literal string "[REDACTED]". Pure (returns a copy);
 *  the original input is never mutated. Cycles are tolerated via a
 *  small WeakSet seen-tracker that returns "[Circular]" for repeats. */
export function redactSensitiveFields(value) {
    return redactWalk(value, new WeakSet());
}
function redactWalk(value, seen) {
    if (value === null || typeof value !== "object")
        return value;
    if (seen.has(value))
        return "[Circular]";
    seen.add(value);
    if (Array.isArray(value)) {
        return value.map((v) => redactWalk(v, seen));
    }
    const out = {};
    for (const [k, v] of Object.entries(value)) {
        if (SENSITIVE_FIELD_PATTERN.test(k)) {
            out[k] = "[REDACTED]";
        }
        else {
            out[k] = redactWalk(v, seen);
        }
    }
    return out;
}
export async function getObservabilityConfig() {
    try {
        const { getSetting } = await import("../settings/store.js");
        const stored = await getSetting("observability-config");
        if (stored) {
            return {
                ...DEFAULT_OBSERVABILITY_CONFIG,
                ...stored,
            };
        }
    }
    catch { }
    return DEFAULT_OBSERVABILITY_CONFIG;
}
export async function instrumentAgentLoop(opts) {
    const { runAgentLoop, loopOpts, runId, threadId, userId, config } = opts;
    const runStart = Date.now();
    const parentSpanId = spanId();
    const spans = [];
    let toolInvocationCounter = 0;
    // Keyed by counter to handle concurrent calls to the same tool name
    const pendingTools = new Map();
    // Secondary index: tool name → latest invocation counter (for tool_done matching)
    const toolNameToCounter = new Map();
    let toolCallCount = 0;
    let successfulTools = 0;
    let failedTools = 0;
    const instrumentedSend = (event) => {
        try {
            if (event.type === "tool_start") {
                const counter = toolInvocationCounter++;
                const sid = spanId();
                pendingTools.set(counter, {
                    spanId: sid,
                    startMs: Date.now(),
                    toolName: event.tool,
                    input: event.input,
                });
                toolNameToCounter.set(event.tool, counter);
            }
            else if (event.type === "tool_done") {
                const counter = toolNameToCounter.get(event.tool);
                const pending = counter !== undefined ? pendingTools.get(counter) : undefined;
                if (counter !== undefined) {
                    pendingTools.delete(counter);
                    toolNameToCounter.delete(event.tool);
                }
                toolCallCount++;
                const isError = typeof event.result === "string" &&
                    (event.result.startsWith("Error") ||
                        event.result.startsWith("Error running "));
                if (isError)
                    failedTools++;
                else
                    successfulTools++;
                const span = {
                    id: pending?.spanId ?? spanId(),
                    runId,
                    threadId,
                    userId,
                    parentSpanId,
                    spanType: "tool_call",
                    name: event.tool,
                    inputTokens: 0,
                    outputTokens: 0,
                    cacheReadTokens: 0,
                    cacheWriteTokens: 0,
                    costCentsX100: 0,
                    durationMs: pending ? Date.now() - pending.startMs : 0,
                    status: isError ? "error" : "success",
                    errorMessage: isError ? event.result : null,
                    metadata: config.captureToolArgs && pending
                        ? // Strip Authorization/api-key/token-shaped values before
                            // persisting (M14 in the MCP/A2A audit). Tool-runtime
                            // execution still sees the unredacted input — only the
                            // long-lived span row is sanitized.
                            {
                                input: redactSensitiveFields(pending.input),
                            }
                        : null,
                    createdAt: Date.now(),
                };
                spans.push(span);
            }
        }
        catch { }
        loopOpts.send(event);
    };
    let usage;
    let runStatus = "success";
    let errorMessage = null;
    try {
        usage = await runAgentLoop({ ...loopOpts, send: instrumentedSend });
    }
    catch (err) {
        runStatus = "error";
        errorMessage = err?.message ?? String(err);
        throw err;
    }
    finally {
        const runEnd = Date.now();
        const totalDurationMs = runEnd - runStart;
        let costCentsX100 = 0;
        try {
            const { calculateCost } = await import("../usage/store.js");
            if (usage) {
                costCentsX100 = calculateCost(usage.inputTokens, usage.outputTokens, usage.model, usage.cacheReadTokens, usage.cacheWriteTokens);
            }
        }
        catch { }
        let llmCallCount = 0;
        if (usage) {
            llmCallCount = 1;
            const llmSpan = {
                id: spanId(),
                runId,
                threadId,
                userId,
                parentSpanId,
                spanType: "llm_call",
                name: usage.model,
                inputTokens: usage.inputTokens,
                outputTokens: usage.outputTokens,
                cacheReadTokens: usage.cacheReadTokens,
                cacheWriteTokens: usage.cacheWriteTokens,
                costCentsX100,
                durationMs: totalDurationMs,
                status: runStatus,
                errorMessage,
                metadata: null,
                createdAt: runStart,
            };
            spans.push(llmSpan);
        }
        const parentSpan = {
            id: parentSpanId,
            runId,
            threadId,
            userId,
            parentSpanId: null,
            spanType: "agent_run",
            name: "agent_run",
            inputTokens: usage?.inputTokens ?? 0,
            outputTokens: usage?.outputTokens ?? 0,
            cacheReadTokens: usage?.cacheReadTokens ?? 0,
            cacheWriteTokens: usage?.cacheWriteTokens ?? 0,
            costCentsX100,
            durationMs: totalDurationMs,
            status: runStatus,
            errorMessage,
            metadata: null,
            createdAt: runStart,
        };
        spans.push(parentSpan);
        const summary = {
            runId,
            threadId,
            userId,
            totalSpans: spans.length,
            llmCalls: llmCallCount,
            toolCalls: toolCallCount,
            successfulTools,
            failedTools,
            totalDurationMs,
            totalCostCentsX100: costCentsX100,
            totalInputTokens: usage?.inputTokens ?? 0,
            totalOutputTokens: usage?.outputTokens ?? 0,
            model: usage?.model ?? loopOpts.model,
            createdAt: runStart,
        };
        writeTraceData(spans, summary, runId, config).catch(() => { });
    }
    return usage;
}
async function writeTraceData(spans, summary, runId, config) {
    const { insertTraceSpan, upsertTraceSummary } = await import("./store.js");
    await Promise.all(spans.map((s) => insertTraceSpan(s).catch(() => { })));
    await upsertTraceSummary(summary).catch(() => { });
    // Fire automated evals after trace data is persisted
    try {
        const { evaluateRun } = await import("./evals.js");
        await evaluateRun(runId, { sampleRate: config.evalSampleRate });
    }
    catch { }
}
//# sourceMappingURL=traces.js.map