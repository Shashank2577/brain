/**
 * Advance a source counter. Called by `useDbSync` for every change event;
 * may also be called from templates that learn of a server-side change via
 * a custom path (e.g. an in-process mutation that already happened — bump
 * the counter so other components refetch without waiting for the poll
 * cycle).
 */
export declare function bumpChangeVersion(source: string, version: number): boolean;
/**
 * Get the current counter for a source without subscribing. Use inside
 * event handlers / callbacks; in render code use `useChangeVersion`.
 */
export declare function getChangeVersion(source: string): number;
/**
 * Subscribe to a source's change counter. Returns an integer that
 * increments every time the server emits an event with `source === <source>`
 * — including (by design) the agent's own action calls, since the agent
 * runner emits `source: "action"` after every successful mutating action.
 *
 * Fold the return value into a React Query `queryKey` to make the query
 * refetch whenever that source advances:
 *
 * ```ts
 * const v = useChangeVersion("dashboards");
 * useQuery({
 *   queryKey: ["dashboard", id, v],
 *   queryFn: () => fetchDashboard(id),
 *   placeholderData: keepPreviousData,
 * });
 * ```
 */
export declare function useChangeVersion(source: string): number;
/**
 * Convenience for queries that should refetch on multiple sources — returns
 * the sum of each source's counter so React Query treats every advance as a
 * key change.
 *
 * ```ts
 * const v = useChangeVersions(["dashboards", "action"]);
 * useQuery({ queryKey: ["dashboard", id, v], ... });
 * ```
 */
export declare function useChangeVersions(sources: readonly string[]): number;
/** Internal test helper — reset all counters. Do not use in app code. */
export declare function _resetChangeVersionStoreForTests(): void;
//# sourceMappingURL=use-change-version.d.ts.map