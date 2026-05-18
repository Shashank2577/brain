import type { AgentEngine } from "../agent/engine/types.js";
import { type ReasoningEffort } from "../shared/reasoning-effort.js";
import { type CodeAgentRunRecord } from "./code-agent-runs.js";
export interface ExecuteCodeAgentRunOptions {
    runId: string;
    prompt?: string;
    appendUserEvent?: boolean;
    engine?: AgentEngine;
    model?: string;
    reasoningEffort?: ReasoningEffort;
    stdout?: NodeJS.WritableStream;
    signal?: AbortSignal;
}
export declare function executeCodeAgentRun(options: ExecuteCodeAgentRunOptions): Promise<CodeAgentRunRecord | null>;
export declare function executeExistingCodeAgentRun(runId: string, options?: Omit<ExecuteCodeAgentRunOptions, "runId">): Promise<CodeAgentRunRecord | null>;
export declare function executePendingCodeAgentApproval(runId: string, options?: {
    stdout?: NodeJS.WritableStream;
}): Promise<CodeAgentRunRecord | null>;
export type CodeAgentCommandPermission = {
    kind: "read";
} | {
    kind: "write";
} | {
    kind: "approval-required";
    reason: string;
} | {
    kind: "forbidden";
    reason: string;
};
export declare function classifyCodeAgentCommandPermission(command: string): CodeAgentCommandPermission;
//# sourceMappingURL=code-agent-executor.d.ts.map