/**
 * Core script: db-query
 *
 * Run a read-only SQL query against a SQLite or Postgres database.
 *
 * In production mode, temporary views are created to scope data to the
 * current user (AGENT_USER_EMAIL). Tables with an `owner_email` column
 * and core tables (settings, application_state, etc.) are automatically
 * filtered so queries only return the current user's data.
 *
 * Usage:
 *   pnpm action db-query --sql "SELECT * FROM forms WHERE id = ?" [--args '["abc"]'] [--db path] [--format json] [--limit N]
 */
export default function dbQuery(args: string[]): Promise<void>;
//# sourceMappingURL=query.d.ts.map