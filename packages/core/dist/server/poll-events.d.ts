/**
 * Stream in-process poll events over SSE.
 *
 * This is the fast path for agent/tool/action writes that happen in the same
 * server process. The regular /poll endpoint remains the cross-process and
 * serverless cold-start fallback because it can detect DB timestamp changes
 * even when the write happened somewhere this EventEmitter could not see.
 */
export declare function createPollEventsHandler(): import("h3").EventHandlerWithFetch<import("h3").EventHandlerRequest, Promise<string | URLSearchParams | ReadableStream<any> | Blob | ArrayBuffer | ArrayBufferView<ArrayBuffer> | FormData | {
    error: string;
}>>;
//# sourceMappingURL=poll-events.d.ts.map