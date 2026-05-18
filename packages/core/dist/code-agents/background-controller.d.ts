import { type CodeAgentFollowUpMode, type CodeAgentPermissionMode } from "../cli/code-agent-runs.js";
import { type BackgroundAgentRun, type BackgroundAgentTranscriptEvent, type ListBackgroundAgentRunsOptions } from "./background-run.js";
import type { ReasoningEffort } from "../shared/reasoning-effort.js";
export type BackgroundAgentControlCommand = "approve" | "resume" | "retry" | "stop";
export interface BackgroundAgentControlInput {
    runId: string;
    command: BackgroundAgentControlCommand;
    stdout?: NodeJS.WritableStream;
}
export interface BackgroundAgentFollowUpInput {
    runId: string;
    prompt: string;
    mode?: CodeAgentFollowUpMode;
    permissionMode?: CodeAgentPermissionMode;
    model?: string;
    reasoningEffort?: ReasoningEffort;
    source?: string;
    metadata?: Record<string, unknown>;
    stdout?: NodeJS.WritableStream;
}
export interface BackgroundAgentControlResult {
    ok: boolean;
    runId: string;
    run: BackgroundAgentRun | null;
    queued?: boolean;
    message?: string;
    error?: string;
}
export interface BackgroundAgentController {
    list(options?: ListBackgroundAgentRunsOptions): Promise<BackgroundAgentRun[]> | BackgroundAgentRun[];
    get(runId: string): Promise<BackgroundAgentRun | null> | BackgroundAgentRun | null;
    transcript(runId: string): Promise<BackgroundAgentTranscriptEvent[]> | BackgroundAgentTranscriptEvent[];
    sendFollowUp(input: BackgroundAgentFollowUpInput): Promise<BackgroundAgentControlResult>;
    control(input: BackgroundAgentControlInput): Promise<BackgroundAgentControlResult>;
}
export declare function createCompositeBackgroundAgentController(controllers: BackgroundAgentController[]): BackgroundAgentController;
export declare function createLocalCodeBackgroundAgentController(): BackgroundAgentController;
export declare const localCodeBackgroundAgentController: BackgroundAgentController;
//# sourceMappingURL=background-controller.d.ts.map