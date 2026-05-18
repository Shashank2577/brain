/**
 * Core script: db-wipe-leaked-builder-keys
 *
 * One-shot cleanup for the legacy cross-tenant Builder credential leak.
 *
 * Pre-migration, the Builder OAuth callback wrote BUILDER_PRIVATE_KEY,
 * BUILDER_PUBLIC_KEY, BUILDER_USER_ID, BUILDER_ORG_NAME, BUILDER_ORG_KIND
 * into the unscoped `persisted-env-vars` settings row. On shared-DB
 * hosted templates that row was global, so the first user to connect
 * left their Builder identity sitting in `process.env` for every
 * subsequent tenant on the same serverless instance — anyone without
 * their own per-user app_secrets record fell back to the leaked key.
 *
 * Per-user Builder credentials now live in `app_secrets` (scope=user,
 * scopeId=email). The plugin init scrubs BUILDER_* on every boot, but
 * this script lets you wipe the row immediately, before redeploying.
 *
 * Idempotent. Re-running on a clean row is a no-op.
 *
 * Usage:
 *   DATABASE_URL=postgres://... pnpm action db-wipe-leaked-builder-keys
 *   DATABASE_URL=file:./data/app.db pnpm action db-wipe-leaked-builder-keys
 *   pnpm action db-wipe-leaked-builder-keys --db ./data/app.db
 *   pnpm action db-wipe-leaked-builder-keys --dry-run
 */
export default function dbWipeLeakedBuilderKeys(args: string[]): Promise<void>;
//# sourceMappingURL=wipe-leaked-builder-keys.d.ts.map