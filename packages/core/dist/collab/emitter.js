import { EventEmitter } from "events";
const _emitter = new EventEmitter();
export function getCollabEmitter() {
    return _emitter;
}
export function emitCollabUpdate(docId, update, requestSource) {
    const event = {
        source: "collab",
        type: "yjs-update",
        docId,
        update,
        ...(requestSource && { requestSource }),
    };
    _emitter.emit("collab", event);
}
//# sourceMappingURL=emitter.js.map