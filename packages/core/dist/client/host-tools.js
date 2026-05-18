import { requestAgentNativeHostActions, requestAgentNativeHostContext, runAgentNativeHostAction, sendAgentNativeHostCommand, } from "./host-bridge.js";
export const AGENT_NATIVE_HOST_TOOL_NAMES = {
    viewHostScreen: "view-host-screen",
    listHostActions: "list-host-actions",
    runHostAction: "run-host-action",
    sendHostCommand: "send-host-command",
};
const EMPTY_PARAMETERS = {
    type: "object",
    properties: {},
    additionalProperties: false,
};
const RUN_HOST_ACTION_PARAMETERS = {
    type: "object",
    properties: {
        name: {
            type: "string",
            description: "Name of the live host action to run. Use list-host-actions first when you need the current action names and schemas.",
        },
        args: {
            description: "JSON-serializable arguments for the host action. Match the action schema returned by list-host-actions.",
        },
    },
    required: ["name"],
    additionalProperties: false,
};
const SEND_HOST_COMMAND_PARAMETERS = {
    type: "object",
    properties: {
        command: {
            type: "string",
            description: "Built-in or custom host command. Defaults to refreshData when omitted.",
        },
        payload: {
            description: "JSON-serializable payload for the host command, such as a route target or refresh query key.",
        },
    },
    additionalProperties: false,
};
function isRecord(value) {
    return Boolean(value) && typeof value === "object" && !Array.isArray(value);
}
function optionalRecordInput(value, toolName) {
    if (value === undefined || value === null)
        return {};
    if (isRecord(value))
        return value;
    throw new Error(`${toolName} input must be an object`);
}
function readRequiredString(value, key, toolName) {
    const raw = value[key];
    if (typeof raw === "string" && raw.trim())
        return raw;
    throw new Error(`${toolName} requires a non-empty ${key}`);
}
export function createAgentNativeHostTools(options = {}) {
    return {
        [AGENT_NATIVE_HOST_TOOL_NAMES.viewHostScreen]: {
            name: AGENT_NATIVE_HOST_TOOL_NAMES.viewHostScreen,
            description: "View the current host app screen and context exposed to the embedded Agent-Native iframe, including route, selection, resource, user, organization, capabilities, and screen snapshot when available.",
            parameters: EMPTY_PARAMETERS,
            execute: async () => requestAgentNativeHostContext(options),
        },
        [AGENT_NATIVE_HOST_TOOL_NAMES.listHostActions]: {
            name: AGENT_NATIVE_HOST_TOOL_NAMES.listHostActions,
            description: "List live browser-session actions currently exposed by the host page. These actions may change as the user navigates and only work while the host page is connected.",
            parameters: EMPTY_PARAMETERS,
            execute: async () => requestAgentNativeHostActions(options),
        },
        [AGENT_NATIVE_HOST_TOOL_NAMES.runHostAction]: {
            name: AGENT_NATIVE_HOST_TOOL_NAMES.runHostAction,
            description: "Run a live browser-session action exposed by the host page. Use list-host-actions first to discover available action names and argument schemas.",
            parameters: RUN_HOST_ACTION_PARAMETERS,
            execute: async (input) => {
                const record = optionalRecordInput(input, AGENT_NATIVE_HOST_TOOL_NAMES.runHostAction);
                const name = readRequiredString(record, "name", AGENT_NATIVE_HOST_TOOL_NAMES.runHostAction);
                return runAgentNativeHostAction(name, record.args, options);
            },
        },
        [AGENT_NATIVE_HOST_TOOL_NAMES.sendHostCommand]: {
            name: AGENT_NATIVE_HOST_TOOL_NAMES.sendHostCommand,
            description: "Send a command to the host app, such as refreshData, navigate, remountView, hardReload, openResource, requestApproval, or an app-specific command. Omit command to request a data refresh.",
            parameters: SEND_HOST_COMMAND_PARAMETERS,
            execute: async (input) => {
                const record = optionalRecordInput(input, AGENT_NATIVE_HOST_TOOL_NAMES.sendHostCommand);
                const command = typeof record.command === "string" && record.command.trim()
                    ? record.command
                    : "refreshData";
                return sendAgentNativeHostCommand(command, record.payload, options);
            },
        },
    };
}
//# sourceMappingURL=host-tools.js.map