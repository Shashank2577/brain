import { useEffect, useState, useCallback } from "react";
import { agentNativePath } from "./api-path.js";
const DEFAULT_STUCK_THRESHOLD_MS = 90_000;
const DEFAULT_POLL_INTERVAL_MS = 5_000;
const IDLE_BACKOFF_INTERVAL_MS = 15_000;
const EMPTY_STATE = {
    isStuck: false,
    runId: null,
    status: null,
    lastProgressAt: null,
    stuckSinceMs: null,
    heartbeatAt: null,
};
export function useRunStuckDetection({ threadId, stuckThresholdMs = DEFAULT_STUCK_THRESHOLD_MS, pollIntervalMs = DEFAULT_POLL_INTERVAL_MS, apiUrl, }) {
    const [state, setState] = useState(EMPTY_STATE);
    useEffect(() => {
        // Reset on every thread change so the previous thread's stuck banner
        // doesn't bleed onto the new one before the first poll completes.
        setState(EMPTY_STATE);
        if (!threadId)
            return;
        const base = apiUrl ?? agentNativePath("/_agent-native/agent-chat");
        let cancelled = false;
        let timer = null;
        const poll = async () => {
            if (cancelled)
                return;
            let nextDelay = pollIntervalMs;
            try {
                const res = await fetch(`${base}/runs/active?threadId=${encodeURIComponent(threadId)}`, { credentials: "same-origin" });
                if (cancelled)
                    return;
                if (res.ok) {
                    const data = (await res.json());
                    const lastProgressAt = data.lastProgressAt ?? null;
                    const stuckSinceMs = lastProgressAt != null ? Date.now() - lastProgressAt : null;
                    const isStuck = Boolean(data.active &&
                        data.status === "running" &&
                        stuckSinceMs != null &&
                        stuckSinceMs > stuckThresholdMs);
                    setState({
                        isStuck,
                        runId: data.runId ?? null,
                        status: data.status ?? null,
                        lastProgressAt,
                        stuckSinceMs,
                        heartbeatAt: data.heartbeatAt ?? null,
                    });
                    // Back off polling when nothing is in flight — there's no point
                    // hammering the endpoint while the chat is idle. We still poll
                    // occasionally so a fresh run started in another tab is picked up.
                    if (!data.active || data.status !== "running") {
                        nextDelay = IDLE_BACKOFF_INTERVAL_MS;
                    }
                }
            }
            catch {
                // Network blip — leave previous state. Next tick will retry.
            }
            if (!cancelled) {
                timer = setTimeout(poll, nextDelay);
            }
        };
        // Stagger the first poll so a freshly-started run isn't immediately
        // classified as stuck before the server has had a chance to record
        // any progress events.
        timer = setTimeout(poll, 2_000);
        return () => {
            cancelled = true;
            if (timer)
                clearTimeout(timer);
        };
    }, [threadId, stuckThresholdMs, pollIntervalMs, apiUrl]);
    return state;
}
/**
 * POST `/runs/:id/abort` so the server flips the run to "aborted" and the
 * adapter's reconnect loop exits cleanly. Returns the run id that was
 * aborted (or null on failure) so callers can correlate observability
 * events. Best-effort — failures are swallowed, since the user's intent
 * is already captured locally.
 */
export function useAbortRun(apiUrl) {
    return useCallback(async (runId, reason = "user") => {
        const base = apiUrl ?? agentNativePath("/_agent-native/agent-chat");
        try {
            const res = await fetch(`${base}/runs/${encodeURIComponent(runId)}/abort`, {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                credentials: "same-origin",
                body: JSON.stringify({ reason }),
            });
            if (!res.ok)
                return null;
            return runId;
        }
        catch {
            return null;
        }
    }, [apiUrl]);
}
//# sourceMappingURL=use-run-stuck-detection.js.map