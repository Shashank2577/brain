import type { A2AConfig, JsonRpcResponse } from "./types.js";
/**
 * Process a previously-enqueued A2A task. Called by the `_process-task`
 * route in `server.ts`, in a fresh function execution. Atomically claims the
 * task, reconstructs the caller's request context from the task's metadata,
 * runs the handler, and persists the outcome.
 *
 * Idempotent on duplicate dispatches: the atomic claim returns null if some
 * other invocation already picked the task up, in which case we no-op.
 */
export declare function processA2ATaskFromQueue(taskId: string, config: A2AConfig, event?: any): Promise<void>;
/**
 * H3-compatible JSON-RPC handler. Returns JSON directly (H3 serializes it).
 * Streaming is handled via H3's node response when needed.
 */
export declare function handleJsonRpcH3(body: any, event: any, config: A2AConfig): Promise<JsonRpcResponse>;
//# sourceMappingURL=handlers.d.ts.map