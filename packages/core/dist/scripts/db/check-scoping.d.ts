/**
 * Core script: db-check-scoping
 *
 * Validates that all template tables have the required ownership columns
 * (owner_email, org_id) for per-user and per-org data scoping.
 *
 * Tables without these columns are denied to raw db-* tools by default. If a
 * table should be queryable/writable through raw DB tools, add explicit
 * owner_email/org_id scoping columns and an additive migration.
 *
 * Usage:
 *   pnpm action db-check-scoping [--db path] [--require-org] [--format json]
 */
export default function dbCheckScoping(args: string[]): Promise<void>;
//# sourceMappingURL=check-scoping.d.ts.map