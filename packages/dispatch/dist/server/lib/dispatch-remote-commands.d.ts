import type { IncomingMessage, PlatformAdapter } from "@agent-native/core/server";
export type RemoteCodeCommand = {
    type: "create";
    prompt: string;
} | {
    type: "list";
} | {
    type: "status";
    runRef?: string;
} | {
    type: "continue";
    runRef: string;
    text: string;
} | {
    type: "approve";
    approvalId: string;
} | {
    type: "deny";
    approvalId: string;
} | {
    type: "stop";
    runRef: string;
} | {
    type: "help";
    reason?: string;
};
export interface RemoteCodeCommandEnvelope {
    kind: "code-agent";
    ownerEmail: string;
    command: Exclude<RemoteCodeCommand, {
        type: "help";
    }>;
    source: {
        platform: string;
        externalThreadId: string;
        senderId?: string;
        senderName?: string;
        messageId?: string;
        timestamp: number;
    };
}
export interface RemoteCodeRunSummary {
    id?: string;
    runId?: string;
    title?: string;
    prompt?: string;
    status?: string;
    updatedAt?: string | number | Date;
    createdAt?: string | number | Date;
}
export interface RemoteCodeCommandResult {
    ok?: boolean;
    status?: string;
    hostOnline?: boolean;
    hostStatus?: string;
    commandId?: string;
    requestId?: string;
    runId?: string;
    run?: RemoteCodeRunSummary;
    runs?: RemoteCodeRunSummary[];
    message?: string;
    error?: string;
}
export type RemoteCodeCommandRelay = (envelope: RemoteCodeCommandEnvelope) => Promise<RemoteCodeCommandResult>;
export interface HandleRemoteCodeCommandOptions {
    resolveOwner: () => Promise<string> | string;
    relay?: RemoteCodeCommandRelay;
}
export declare function parseTelegramCodeCommand(incoming: Pick<IncomingMessage, "platform" | "text" | "platformContext">): RemoteCodeCommand | null;
export declare function handleRemoteCodeCommand(incoming: IncomingMessage, _adapter: PlatformAdapter, options: HandleRemoteCodeCommandOptions): Promise<{
    handled: true;
    responseText?: string;
} | {
    handled: false;
}>;
export declare function createRemoteCodeCommandEnvelope(incoming: IncomingMessage, ownerEmail: string, command: Exclude<RemoteCodeCommand, {
    type: "help";
}>): RemoteCodeCommandEnvelope;
export declare function enqueueRemoteCodeCommand(envelope: RemoteCodeCommandEnvelope): Promise<RemoteCodeCommandResult>;
export declare function formatRemoteCodeCommandResult(command: Exclude<RemoteCodeCommand, {
    type: "help";
}>, result: RemoteCodeCommandResult): string;
//# sourceMappingURL=dispatch-remote-commands.d.ts.map