/**
 * Compute the next occurrence of a cron expression after the given date.
 */
export declare function nextOccurrence(cronExpr: string, after?: Date): Date;
/**
 * Validate a cron expression. Returns true if valid.
 */
export declare function isValidCron(cronExpr: string): boolean;
/**
 * Convert a cron expression to a human-readable description.
 * Handles common patterns; falls back to the raw expression for unusual ones.
 */
export declare function describeCron(cronExpr: string): string;
//# sourceMappingURL=cron.d.ts.map