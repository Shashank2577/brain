/**
 * Truncate `s` to at most `max` characters, appending an ellipsis when a
 * cut is made. Returns the original reference unchanged when no truncation
 * is needed so identity-sensitive callers (React props, memo keys) don't
 * see a new allocation on every call.
 */
export declare function truncate<S extends string | undefined | null>(s: S, max: number): S;
//# sourceMappingURL=truncate.d.ts.map