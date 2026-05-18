import type { AgentCard, Message, Task } from "./types.js";
export declare class A2ATaskTimeoutError extends Error {
    readonly taskId: string;
    readonly lastTask: Task;
    readonly lastState: string;
    readonly timeoutMs: number;
    constructor(taskId: string, lastTask: Task, timeoutMs: number);
}
/**
 * Sign a JWT for A2A cross-app identity verification.
 *
 * Uses an org-level secret by default for direct org-secret workflows. Callers
 * that are doing ordinary hosted cross-app delegation can set
 * `preferGlobalSecret` so deployments with a shared A2A_SECRET don't depend on
 * every app database having an identical org row. The token contains the
 * caller's email as `sub`, so the receiving app can verify who's calling.
 */
export declare function signA2AToken(email: string, orgDomain?: string, orgSecret?: string, options?: {
    expiresIn?: string | number;
    preferGlobalSecret?: boolean;
}): Promise<string>;
export declare class A2AClient {
    private baseUrl;
    private apiKey?;
    private endpointCandidates;
    private endpointResolved;
    private requestTimeoutMs?;
    constructor(baseUrl: string, apiKey?: string, options?: {
        requestTimeoutMs?: number;
    });
    /**
     * Detect which A2A path the target agent uses.
     * Agent-native apps use /_agent-native/a2a, external agents may use /a2a.
     */
    resolveEndpoint(): Promise<void>;
    private headers;
    private rpc;
    getAgentCard(): Promise<AgentCard>;
    send(message: Message, opts?: {
        contextId?: string;
        metadata?: Record<string, unknown>;
        /**
         * If true, ask the server to return the task immediately in `working`
         * state and process the handler in the background. The caller should
         * then poll `getTask(taskId)` until `completed` / `failed` / `canceled`.
         *
         * Use this when you expect the handler may exceed a synchronous
         * serverless request budget.
         */
        async?: boolean;
    }): Promise<Task>;
    /**
     * Poll for a task by id. Used in async mode after `send({ async: true })`.
     */
    getTask(taskId: string): Promise<Task>;
    /**
     * Send a message in async mode and poll until the task reaches a terminal
     * state. This is the recommended path on serverless hosts with short
     * function timeouts (Netlify, Vercel) where a synchronous LLM-driven A2A
     * call can exceed the gateway limit.
     *
     * Each individual fetch returns quickly; long-running work happens on the
     * receiving side and is checked via `tasks/get`.
     */
    sendAndWait(message: Message, opts?: {
        contextId?: string;
        metadata?: Record<string, unknown>;
        /** Total time to wait for completion. Default 5 min. */
        timeoutMs?: number;
        /** Poll interval. Default 2s. */
        pollIntervalMs?: number;
        /** Called with each polled task — useful for surfacing progress. */
        onUpdate?: (task: Task) => void;
    }): Promise<Task>;
    stream(message: Message, opts?: {
        contextId?: string;
        metadata?: Record<string, unknown>;
    }): AsyncGenerator<Task>;
    private ensureEndpointCandidates;
    private postJson;
}
/**
 * One-shot convenience function: send a text message and get a text response.
 *
 * When A2A_SECRET is set and userEmail is provided, outbound calls are signed
 * with a JWT so the receiving app can cryptographically verify the caller's
 * identity (instead of blindly trusting metadata).
 */
export declare function callAgent(url: string, text: string, opts?: {
    apiKey?: string;
    contextId?: string;
    userEmail?: string;
    orgDomain?: string;
    orgSecret?: string;
    /**
     * Use async/poll instead of a single blocking POST. Recommended for
     * cross-app calls that may exceed a synchronous serverless request budget.
     * Defaults to true so callers get safe behavior out of the box.
     */
    async?: boolean;
    /** Total time to wait for the polled task (default 5 min). */
    timeoutMs?: number;
}): Promise<string>;
//# sourceMappingURL=client.d.ts.map