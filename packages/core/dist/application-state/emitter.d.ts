import { EventEmitter } from "events";
export interface AppStateEvent {
    source: "app-state";
    type: "change" | "delete";
    key: string;
    owner?: string;
    requestSource?: string;
}
export declare function getAppStateEmitter(): EventEmitter;
export declare function emitAppStateChange(key: string, requestSource?: string, owner?: string): void;
export declare function emitAppStateDelete(key: string, requestSource?: string, owner?: string): void;
//# sourceMappingURL=emitter.d.ts.map