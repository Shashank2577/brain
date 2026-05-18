import { defineEventHandler, createEventStream } from "h3";
/**
 * Create an H3 event handler that streams Server-Sent Events.
 *
 * Streams events from DB change emitters (application state, settings).
 *
 * Usage:
 *   router.get("/_agent-native/events", createSSEHandler({ extraEmitters }));
 */
export function createSSEHandler(options = {}) {
    return defineEventHandler(async (event) => {
        const stream = createEventStream(event);
        let closed = false;
        // --- Batch mode for startup sync bursts ---
        let batchMode = false;
        const pending = [];
        let flushTimer = null;
        const safePush = (data) => {
            if (closed)
                return;
            try {
                stream.push(data);
            }
            catch {
                // Connection dead — events lost for this client, EventSource will reconnect
            }
        };
        const flush = () => {
            flushTimer = null;
            if (closed || pending.length === 0)
                return;
            const batch = pending.splice(0);
            safePush(JSON.stringify({ type: "batch", events: batch }));
        };
        const send = (evt) => {
            if (closed)
                return;
            if (batchMode) {
                pending.push(evt);
                if (!flushTimer)
                    flushTimer = setTimeout(flush, 150);
            }
            else {
                safePush(JSON.stringify(evt));
            }
        };
        const cleanups = [];
        // Subscribe to extra emitters (DB change events)
        for (const { emitter, event: evtName } of options.extraEmitters ?? []) {
            const handler = (data) => {
                send(data);
            };
            emitter.on(evtName, handler);
            cleanups.push(() => emitter.off(evtName, handler));
        }
        // Listen for batch mode signals from sync engine
        for (const { emitter } of options.extraEmitters ?? []) {
            const startBatch = () => {
                batchMode = true;
            };
            const endBatch = () => {
                batchMode = false;
                if (flushTimer) {
                    clearTimeout(flushTimer);
                    flushTimer = null;
                }
                flush();
            };
            emitter.on("sync-burst-start", startBatch);
            emitter.on("sync-burst-end", endBatch);
            cleanups.push(() => {
                emitter.off("sync-burst-start", startBatch);
                emitter.off("sync-burst-end", endBatch);
            });
        }
        stream.onClosed(() => {
            closed = true;
            if (flushTimer)
                clearTimeout(flushTimer);
            pending.length = 0;
            for (const cleanup of cleanups)
                cleanup();
        });
        return stream.send();
    });
}
//# sourceMappingURL=sse.js.map