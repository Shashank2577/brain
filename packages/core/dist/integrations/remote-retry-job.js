import { retryStaleRemoteCommands } from "./remote-commands-store.js";
const RETRY_INTERVAL_MS = 60_000;
let retryInterval = null;
let initialTimer = null;
export async function retryRemoteCommands() {
    try {
        return await retryStaleRemoteCommands();
    }
    catch (err) {
        if (process.env.DEBUG) {
            console.log("[integrations] remote command retry job: tables not ready, skipping");
        }
        return { retried: 0, failed: 0 };
    }
}
export function startRemoteCommandsRetryJob() {
    if (retryInterval)
        return;
    initialTimer = setTimeout(() => {
        void retryRemoteCommands().catch((err) => {
            console.error("[integrations] Remote command retry job error:", err);
        });
    }, 10_000);
    unrefTimer(initialTimer);
    retryInterval = setInterval(() => {
        void retryRemoteCommands().catch((err) => {
            console.error("[integrations] Remote command retry job error:", err);
        });
    }, RETRY_INTERVAL_MS);
    unrefTimer(retryInterval);
}
export function stopRemoteCommandsRetryJob() {
    if (initialTimer) {
        clearTimeout(initialTimer);
        initialTimer = null;
    }
    if (retryInterval) {
        clearInterval(retryInterval);
        retryInterval = null;
    }
}
function unrefTimer(timer) {
    timer.unref?.();
}
//# sourceMappingURL=remote-retry-job.js.map