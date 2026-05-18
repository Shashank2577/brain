import type { AgentChatEvent } from "../agent/types.js";
import type { AgentLoopUsage } from "../agent/production-agent.js";
import type { ObservabilityConfig } from "./types.js";
/** Recursively walk a structured value and replace sensitive field
 *  values with the literal string "[REDACTED]". Pure (returns a copy);
 *  the original input is never mutated. Cycles are tolerated via a
 *  small WeakSet seen-tracker that returns "[Circular]" for repeats. */
export declare function redactSensitiveFields(value: unknown): unknown;
export declare function getObservabilityConfig(): Promise<ObservabilityConfig>;
export declare function instrumentAgentLoop(opts: {
    runAgentLoop: (loopOpts: {
        engine: any;
        model: string;
        systemPrompt: string;
        tools: any[];
        messages: any[];
        actions: Record<string, any>;
        send: (event: AgentChatEvent) => void;
        signal: AbortSignal;
        providerOptions?: any;
    }) => Promise<AgentLoopUsage>;
    loopOpts: {
        engine: any;
        model: string;
        systemPrompt: string;
        tools: any[];
        messages: any[];
        actions: Record<string, any>;
        send: (event: AgentChatEvent) => void;
        signal: AbortSignal;
        providerOptions?: any;
    };
    runId: string;
    threadId: string | null;
    /** Owner of this run; persisted on every span + summary so dashboard
     *  reads can filter to a single user. Null for unauthenticated callers
     *  (background tasks, etc.) — those rows aren't returned by per-user
     *  reads. */
    userId: string | null;
    config: ObservabilityConfig;
}): Promise<AgentLoopUsage>;
//# sourceMappingURL=traces.d.ts.map