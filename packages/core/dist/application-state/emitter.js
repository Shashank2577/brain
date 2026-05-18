import { EventEmitter } from "events";
/**
 * Singleton EventEmitter for application-state DB changes.
 * The SSE handler subscribes to this via extraEmitters.
 */
const _emitter = new EventEmitter();
export function getAppStateEmitter() {
    return _emitter;
}
export function emitAppStateChange(key, requestSource, owner) {
    const event = {
        source: "app-state",
        type: "change",
        key,
        ...(owner && { owner }),
        ...(requestSource && { requestSource }),
    };
    _emitter.emit("app-state", event);
}
export function emitAppStateDelete(key, requestSource, owner) {
    const event = {
        source: "app-state",
        type: "delete",
        key,
        ...(owner && { owner }),
        ...(requestSource && { requestSource }),
    };
    _emitter.emit("app-state", event);
}
//# sourceMappingURL=emitter.js.map