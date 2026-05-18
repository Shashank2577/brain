import type { ChatModelRunResult } from "@assistant-ui/react";
export type ContentPart = {
    type: "text";
    text: string;
} | {
    type: "tool-call";
    toolCallId: string;
    toolName: string;
    argsText: string;
    args: Record<string, string>;
    result?: string;
};
export interface SSEEvent {
    type: string;
    text?: string;
    tool?: string;
    label?: string;
    input?: Record<string, string>;
    result?: string;
    error?: string;
    seq?: number;
    agent?: string;
    status?: string;
    reason?: string;
    taskId?: string;
    threadId?: string;
    description?: string;
    preview?: string;
    currentStep?: string;
    summary?: string;
    errorCode?: string;
    upgradeUrl?: string;
    details?: string;
    recoverable?: boolean;
    maxIterations?: number;
}
export type AgentAutoContinueReason = "run_timeout" | "loop_limit" | "no_progress" | "stream_ended" | "stale_run";
export declare class AgentAutoContinueSignal extends Error {
    readonly reason: AgentAutoContinueReason;
    readonly maxIterations?: number;
    constructor(options: {
        reason: AgentAutoContinueReason;
        maxIterations?: number;
    });
}
export declare const SSE_NO_PROGRESS_TIMEOUT_MS = 75000;
/**
 * Process a single SSE event and update the content accumulator.
 * Returns: "continue" to keep going, "done" to stop, or a yield-ready result.
 */
export declare function processEvent(ev: SSEEvent, content: ContentPart[], toolCallCounter: {
    value: number;
}, tabId: string | undefined): {
    action: "continue" | "done" | "yield" | "error" | "missing_api_key" | "auto_continue";
    result?: ChatModelRunResult;
    autoContinue?: {
        reason: AgentAutoContinueReason;
        maxIterations?: number;
    };
};
/**
 * Read and process SSE events from a ReadableStream response body.
 * Yields ChatModelRunResult for each meaningful event.
 *
 * When `runId` is provided, every yielded result carries
 * `metadata.custom.runId` so the UI can expose the trace ID via
 * "Copy Request ID" — including mid-stream, so users can grab it before
 * the run completes (or if the run hangs / ends prematurely).
 */
export declare function readSSEStream(body: ReadableStream<Uint8Array>, content: ContentPart[], toolCallCounter: {
    value: number;
}, tabId: string | undefined, onSeq?: (seq: number) => void, runId?: string | null): AsyncGenerator<ChatModelRunResult>;
/**
 * Read raw SSE events from a ReadableStream and process them into ContentPart[].
 * Unlike readSSEStream, this doesn't yield ChatModelRunResult — it updates the
 * content array in-place and calls onUpdate for each meaningful change.
 * Designed for reconnection scenarios where we render outside assistant-ui's runtime.
 */
export declare function readSSEStreamRaw(body: ReadableStream<Uint8Array>, content: ContentPart[], toolCallCounter: {
    value: number;
}, tabId: string | undefined, onUpdate: (content: ContentPart[]) => void): Promise<void>;
//# sourceMappingURL=sse-event-processor.d.ts.map