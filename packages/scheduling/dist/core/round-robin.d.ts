/**
 * Round-robin host assignment.
 *
 * For a given event type, pick the host who should take the next booking.
 *
 * Strategies:
 *   - "lowest-recent-bookings" — host with fewest bookings in the rolling
 *     window (default 30 days) wins; tie-break by priority then weight.
 *   - "weighted" — distribute by relative weight; random weighted draw that's
 *     deterministic-per-timestamp (seeded for reproducibility in tests).
 *   - "calibrated" — weighted but scaled by no-show rate; hosts with high
 *     no-show rates receive fewer bookings until their rate recovers.
 *
 * Out-of-office hosts are filtered out before selection.
 */
import type { Host, RoundRobinStrategy } from "../shared/index.js";
export interface HostMetrics {
    recentBookingCount: number;
    /** 0–1; fraction of recent bookings that were no-shows */
    noShowRate: number;
}
export interface AssignRoundRobinInput {
    hosts: Host[];
    metrics: Map<string, HostMetrics>;
    excludeEmails?: Set<string>;
    strategy: RoundRobinStrategy;
    /** Deterministic seed (e.g. booking timestamp) for reproducible weighted picks */
    seed?: number;
}
export declare function assignRoundRobin(input: AssignRoundRobinInput): Host | null;
//# sourceMappingURL=round-robin.d.ts.map