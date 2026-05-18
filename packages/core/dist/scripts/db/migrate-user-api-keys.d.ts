/**
 * Core script: db-migrate-user-api-keys
 *
 * One-shot migration: copy legacy `user-api-key:<provider>:<email>` and
 * `user-anthropic-api-key:<email>` rows from the unscoped `settings` table
 * into `app_secrets` (encrypted, scope=user, scopeId=email), then delete
 * the legacy rows.
 *
 * Background. The pre-secrets-migration `agent-chat-plugin` save-key endpoint
 * persisted user-pasted LLM API keys to `settings` under email-prefixed
 * keys. The `app_secrets` system (encrypted, properly scoped) now owns
 * user-pasted credentials. `getOwnerApiKey()` reads `app_secrets` first
 * and falls back to the legacy settings rows for compat. This script
 * clears that compat tail so the legacy rows don't sit around indefinitely.
 *
 * Idempotent — re-running on an already-migrated DB is a no-op.
 *
 * Usage:
 *   DATABASE_URL=postgres://... pnpm action db-migrate-user-api-keys
 *   pnpm action db-migrate-user-api-keys --db ./data/app.db
 *   pnpm action db-migrate-user-api-keys --dry-run
 */
export default function dbMigrateUserApiKeys(args: string[]): Promise<void>;
//# sourceMappingURL=migrate-user-api-keys.d.ts.map