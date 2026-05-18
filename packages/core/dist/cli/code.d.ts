import { type CodeAgentFollowUpMode, type CodeAgentPermissionMode } from "./code-agent-runs.js";
export type CodeAgentGoalId = "task" | "migrate" | "audit";
export interface CodeAgentCliGoal {
    id: CodeAgentGoalId;
    slashCommand: string;
    aliases: string[];
    summary: string;
    backingCommand: "task" | "migrate" | "audit-agent-web";
}
export type CodeCliCommand = {
    kind: "shell";
} | {
    kind: "help";
} | {
    kind: "list-goals";
} | {
    kind: "serve";
    relayUrl?: string;
} | {
    kind: "execute-existing-run";
    runId: string;
} | {
    kind: "control";
    subcommand: CodeAgentControlSubcommand;
    args: string[];
} | {
    kind: "record-follow-up";
    prompt: string;
    runId?: string;
    permissionMode?: CodeAgentPermissionMode;
    followUpMode?: CodeAgentFollowUpMode;
} | {
    kind: "run-project-command";
    commandName: string;
    forwardedArgs: string[];
} | {
    kind: "run-goal";
    goalId: CodeAgentGoalId;
    forwardedArgs: string[];
};
export declare const CODE_AGENT_CLI_GOALS: CodeAgentCliGoal[];
type CodeAgentControlSubcommand = "approve" | "attach" | "list" | "logs" | "ps" | "resume" | "status" | "stop" | "ui";
export interface CodeShellOptions {
    input?: NodeJS.ReadableStream;
    output?: NodeJS.WritableStream;
    runGoal?: CodeGoalRunner;
}
type CodeGoalRunner = (goalId: CodeAgentGoalId, forwardedArgs: string[], output?: NodeJS.WritableStream) => Promise<void>;
type CodeShellLineResult = "continue" | "exit";
export declare function resolveCodeCommand(argv: string[]): CodeCliCommand;
export declare function runCode(argv: string[], options?: CodeShellOptions): Promise<void>;
export declare function runCodeShell(options?: CodeShellOptions): Promise<void>;
export declare function handleCodeShellLine(line: string, options: Required<Pick<CodeShellOptions, "output" | "runGoal">>): Promise<CodeShellLineResult>;
export declare function codeUsage(): string;
export declare function codeShellIntro(): string;
export declare function codeShellHelp(): string;
export declare function codeShellFreeTextMessage(): string;
export declare function parseCodeShellArgs(line: string): {
    ok: true;
    args: string[];
} | {
    ok: false;
    error: string;
};
export {};
//# sourceMappingURL=code.d.ts.map