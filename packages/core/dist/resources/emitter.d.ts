import { EventEmitter } from "events";
export interface ResourceEvent {
    source: "resources";
    type: "change" | "delete";
    id: string;
    path: string;
    owner: string;
    requestSource?: string;
}
export declare function getResourcesEmitter(): EventEmitter;
export declare function emitResourceChange(id: string, path: string, owner: string, requestSource?: string): void;
export declare function emitResourceDelete(id: string, path: string, owner: string, requestSource?: string): void;
//# sourceMappingURL=emitter.d.ts.map