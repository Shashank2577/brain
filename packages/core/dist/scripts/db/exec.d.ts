/**
 * Core script: db-exec
 *
 * Execute write SQL statements (INSERT, UPDATE, DELETE, REPLACE)
 * against a SQLite or Postgres database.
 *
 * In production mode, temporary views scope UPDATE/DELETE to the current
 * user's data (AGENT_USER_EMAIL / AGENT_ORG_ID). For INSERT, the
 * `owner_email` and `org_id` columns are auto-injected if the target
 * table uses the ownership convention.
 *
 * Usage:
 *   pnpm action db-exec --sql "UPDATE forms SET status=? WHERE id=?" [--args '["published","abc"]'] [--db path]
 *   pnpm action db-exec --statements '[{"sql":"INSERT INTO notes (id,title) VALUES (?,?)","args":["n1","One"]},{"sql":"UPDATE counters SET value=value+1 WHERE key=?","args":["notes"]}]'
 */
export default function dbExec(args: string[]): Promise<void>;
//# sourceMappingURL=exec.d.ts.map