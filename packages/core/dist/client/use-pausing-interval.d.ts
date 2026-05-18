/**
 * Runs `callback` on an interval, pausing when the tab becomes hidden and
 * resuming (with an immediate re-run) when the tab becomes visible again.
 * Fires `callback` once immediately on mount (if the tab is visible).
 *
 * Pass `pollMs=0` to disable. Pass `pauseWhenHidden=false` to keep the
 * interval running even when the tab is hidden — the bell's browser-
 * notification popup loop uses that to still reach backgrounded tabs.
 */
export declare function usePausingInterval(callback: () => void | Promise<void>, pollMs: number, pauseWhenHidden?: boolean): void;
//# sourceMappingURL=use-pausing-interval.d.ts.map