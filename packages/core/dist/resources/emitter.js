import { EventEmitter } from "events";
/**
 * Singleton EventEmitter for resources DB changes.
 * The SSE handler subscribes to this via extraEmitters.
 */
const _emitter = new EventEmitter();
export function getResourcesEmitter() {
    return _emitter;
}
export function emitResourceChange(id, path, owner, requestSource) {
    const event = {
        source: "resources",
        type: "change",
        id,
        path,
        owner,
        ...(requestSource && { requestSource }),
    };
    _emitter.emit("resources", event);
}
export function emitResourceDelete(id, path, owner, requestSource) {
    const event = {
        source: "resources",
        type: "delete",
        id,
        path,
        owner,
        ...(requestSource && { requestSource }),
    };
    _emitter.emit("resources", event);
}
//# sourceMappingURL=emitter.js.map