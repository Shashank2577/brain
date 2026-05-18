import { type AgentNativeActionManifestEntry, type AgentNativeHostContext, type AgentNativeHostRequestOptions, type AgentNativeJsonSchema, type BuiltInAgentNativeHostCommand } from "./host-bridge.js";
export declare const AGENT_NATIVE_HOST_TOOL_NAMES: {
    readonly viewHostScreen: "view-host-screen";
    readonly listHostActions: "list-host-actions";
    readonly runHostAction: "run-host-action";
    readonly sendHostCommand: "send-host-command";
};
export type AgentNativeHostToolName = (typeof AGENT_NATIVE_HOST_TOOL_NAMES)[keyof typeof AGENT_NATIVE_HOST_TOOL_NAMES];
export type AgentNativeHostToolParameters = AgentNativeJsonSchema & {
    type: "object";
    properties?: Record<string, AgentNativeJsonSchema>;
    required?: string[];
};
export interface AgentNativeHostToolDefinition<TInput = unknown, TResult = unknown> {
    name: AgentNativeHostToolName;
    description: string;
    parameters: AgentNativeHostToolParameters;
    execute(input?: TInput): Promise<TResult>;
}
export interface RunAgentNativeHostActionToolInput {
    name: string;
    args?: unknown;
}
export interface SendAgentNativeHostCommandToolInput {
    /**
     * Built-in or custom host command. Defaults to refreshData so callers can
     * use this tool as a simple host refresh primitive.
     */
    command?: BuiltInAgentNativeHostCommand | string;
    payload?: unknown;
}
export type CreateAgentNativeHostToolsOptions = AgentNativeHostRequestOptions;
export type AgentNativeHostToolSet = {
    [AGENT_NATIVE_HOST_TOOL_NAMES.viewHostScreen]: AgentNativeHostToolDefinition<unknown, AgentNativeHostContext>;
    [AGENT_NATIVE_HOST_TOOL_NAMES.listHostActions]: AgentNativeHostToolDefinition<unknown, AgentNativeActionManifestEntry[]>;
    [AGENT_NATIVE_HOST_TOOL_NAMES.runHostAction]: AgentNativeHostToolDefinition<RunAgentNativeHostActionToolInput, unknown>;
    [AGENT_NATIVE_HOST_TOOL_NAMES.sendHostCommand]: AgentNativeHostToolDefinition<SendAgentNativeHostCommandToolInput, unknown>;
};
export declare function createAgentNativeHostTools(options?: CreateAgentNativeHostToolsOptions): AgentNativeHostToolSet;
//# sourceMappingURL=host-tools.d.ts.map