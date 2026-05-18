import type { ActionEntry } from "../agent/production-agent.js";
export interface CodingCommandResult {
    code: number | null;
    stdout: string;
    stderr: string;
    timedOut: boolean;
}
export interface CreateCodingToolRegistryOptions {
    cwd?: string;
    restrictToCwd?: boolean;
    commandTimeoutMs?: number;
    maxOutputChars?: number;
    maxFileReadChars?: number;
    bashThrowsOnNonZero?: boolean;
    canWrite?: (toolName: "edit" | "write") => string | null;
    beforeBash?: (input: {
        command: string;
        cwd: string;
        timeoutMs: number;
    }) => string | null | Promise<string | null>;
}
export declare function createCodingToolRegistry(options?: CreateCodingToolRegistryOptions): Record<"bash" | "read" | "edit" | "write", ActionEntry>;
export declare function runCodingCommand(command: string, cwd: string, timeoutMs: number, options?: {
    stdin?: string;
}): Promise<CodingCommandResult>;
export declare function formatCodingCommandResult(result: CodingCommandResult, maxChars?: number, options?: {
    omitEmptyExitCode?: boolean;
}): string;
export declare function truncateCodingOutput(value: string, max: number): string;
export declare function isReadOnlyShellCommand(command: string): boolean;
//# sourceMappingURL=index.d.ts.map