import type { RemoteCommand, RemoteCommandKind } from "./remote-types.js";
export declare function isRemoteCommandKind(value: unknown): value is RemoteCommandKind;
export declare function enqueueRemoteCommand(input: {
    deviceId: string;
    ownerEmail: string;
    orgId?: string | null;
    kind: RemoteCommandKind;
    params?: unknown;
    platform?: string | null;
    externalThreadId?: string | null;
    nextCheckAt?: number;
}): Promise<RemoteCommand>;
export declare function getRemoteCommand(id: string): Promise<RemoteCommand | null>;
export declare function listRemoteCommandsForOwner(input: {
    ownerEmail: string;
    orgId?: string | null;
    limit?: number;
}): Promise<RemoteCommand[]>;
export declare function claimNextRemoteCommand(deviceId: string): Promise<RemoteCommand | null>;
export declare function updateRemoteCommandResult(input: {
    deviceId: string;
    commandId: string;
    status: "running" | "completed" | "failed";
    result?: unknown;
    errorMessage?: string | null;
}): Promise<RemoteCommand | null>;
export declare function retryStaleRemoteCommands(options?: {
    claimedStaleAfterMs?: number;
    runningStaleAfterMs?: number;
    maxAttempts?: number;
    limit?: number;
}): Promise<{
    retried: number;
    failed: number;
}>;
//# sourceMappingURL=remote-commands-store.d.ts.map