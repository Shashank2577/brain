import { EventEmitter } from "events";
const _emitter = new EventEmitter();
export function getChatThreadsEmitter() {
    return _emitter;
}
export function emitChatThreadChange(threadId) {
    const event = {
        source: "chat-threads",
        type: "change",
        key: threadId,
    };
    _emitter.emit("chat-threads", event);
}
//# sourceMappingURL=emitter.js.map