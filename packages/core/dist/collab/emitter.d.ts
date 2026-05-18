import { EventEmitter } from "events";
export interface CollabEvent {
    source: "collab";
    type: "yjs-update";
    docId: string;
    /** Base64-encoded Yjs update */
    update: string;
    requestSource?: string;
}
export declare function getCollabEmitter(): EventEmitter;
export declare function emitCollabUpdate(docId: string, update: string, requestSource?: string): void;
//# sourceMappingURL=emitter.d.ts.map