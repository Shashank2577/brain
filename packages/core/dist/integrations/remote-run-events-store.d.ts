import type { RemoteRunEvent } from "./remote-types.js";
export declare function insertRemoteRunEvents(input: {
    deviceId: string;
    remoteRunId: string;
    events: Array<{
        seq: number;
        event: unknown;
    }>;
}): Promise<{
    inserted: number;
}>;
export declare function listRemoteRunEvents(input: {
    deviceId: string;
    remoteRunId: string;
    afterSeq?: number;
    limit?: number;
}): Promise<RemoteRunEvent[]>;
//# sourceMappingURL=remote-run-events-store.d.ts.map