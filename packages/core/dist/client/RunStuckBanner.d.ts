import { type RunStuckState } from "./use-run-stuck-detection.js";
/**
 * Surface a user-visible affordance when a chat run hasn't emitted any
 * events for an unusually long time. The adapter's silent reconnect logic
 * keeps trying in the background; this banner is the fallback when those
 * attempts haven't restored progress and the user is staring at a frozen
 * spinner.
 */
export interface RunStuckBannerProps {
    /** The thread to monitor. Pass null/undefined to disable. */
    threadId: string | null | undefined;
    /** API base path. Default `/_agent-native/agent-chat`. */
    apiUrl?: string;
    /**
     * Threshold above which an in-flight run is considered stuck.
     * Defaults to 90s (after the adapter's 75s no-progress reconnect
     * has had a chance to recover).
     */
    stuckThresholdMs?: number;
    /**
     * Called when the user clicks Retry. Implementations should re-prompt
     * the agent (typically via `chatHandle.sendMessage(...)`) — the banner
     * itself only handles aborting the prior run.
     */
    onRetry?: (runId: string) => void;
    /**
     * Called whenever the stuck state transitions. Useful for surfacing
     * observability events (Sentry, PostHog) at the call site.
     */
    onStuckStateChange?: (state: RunStuckState) => void;
    /** Extra class on the outer container. */
    className?: string;
}
export declare function RunStuckBanner({ threadId, apiUrl, stuckThresholdMs, onRetry, onStuckStateChange, className, }: RunStuckBannerProps): import("react/jsx-runtime").JSX.Element;
//# sourceMappingURL=RunStuckBanner.d.ts.map