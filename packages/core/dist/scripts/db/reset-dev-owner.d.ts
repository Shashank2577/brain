/**
 * Core script: db-reset-dev-owner
 *
 * One-shot fix for local DBs that accumulated rows owned by the dev
 * sentinel `local@localhost`. Pre-changes-53, db-exec / db-query /
 * db-patch silently fell back to that owner when no real identity was
 * present, so any data created via CLI runs (or by older versions of
 * the runner) landed under the sentinel and is now invisible to the
 * actual signed-in user.
 *
 * This script discovers every ownable table (those with an
 * `owner_email` column), then re-points each `local@localhost` row to
 * the email passed via `--to`. Optionally restricted to a single table
 * with `--table`.
 *
 * Local-dev-only safety: refuses to run when `NODE_ENV=production` or
 * when targeting a non-`file:` SQLite URL (no Postgres / Turso /
 * shared-DB writes).
 *
 * Usage:
 *   pnpm action db-reset-dev-owner --to matthew@builder.io
 *   pnpm action db-reset-dev-owner --to matthew@builder.io --dry-run
 *   pnpm action db-reset-dev-owner --to matthew@builder.io --table decks
 *   pnpm action db-reset-dev-owner --to matthew@builder.io --db ./data/app.db
 */
export default function dbResetDevOwner(args: string[]): Promise<void>;
//# sourceMappingURL=reset-dev-owner.d.ts.map