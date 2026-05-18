import { EventEmitter } from "events";
export interface ChatThreadEvent {
    source: "chat-threads";
    type: "change";
    key: string;
}
export declare function getChatThreadsEmitter(): EventEmitter;
export declare function emitChatThreadChange(threadId: string): void;
//# sourceMappingURL=emitter.d.ts.map