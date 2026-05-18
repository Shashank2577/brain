/**
 * Format a `Date` as `YYYY-MM-DD` in the given IANA timezone.
 *
 * Uses `Intl.DateTimeFormat` with the `en-CA` locale because it natively
 * emits `YYYY-MM-DD` order, which avoids reassembling parts by hand. Falls
 * back to the host timezone if `tz` is omitted.
 */
export declare function formatDateInTimezone(date: Date, tz?: string): string;
/**
 * Return today's date as `YYYY-MM-DD` in the given IANA timezone.
 * If `tz` is omitted, falls back to `getRequestTimezone()` (set from the
 * `x-user-timezone` header on action requests), then to the host timezone.
 */
export declare function todayInTimezone(tz?: string): string;
//# sourceMappingURL=date-utils.d.ts.map