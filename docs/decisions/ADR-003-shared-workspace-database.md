# ADR-003: One shared workspace database across all mini-apps

**Status:** Accepted (2026-05-16). Codified during this session as part of the workspace-SSO fix.

## Context

The framework supported two patterns:

1. **Per-template database** — each `templates/<name>/.env.local` declared its own `DATABASE_URL=file:./data/app.db`. Each mini-app had its own user / session / account tables. No SSO between apps.
2. **Shared workspace database** — all templates point at one `DATABASE_URL`. One set of framework tables (`user`, `session`, `account`, `oauth_tokens`). SSO works.

Originally we were on pattern 1. Workspace SSO required pattern 2.

## Decision

In workspace mode (`AGENT_NATIVE_WORKSPACE=1`), **every mini-app uses the same `DATABASE_URL` and the same `BETTER_AUTH_SECRET`**. Mini-app-specific tables are namespaced by app (e.g. `notes_notes`, `tasks_tasks`, `crm_contacts`).

The local dev value is:
```
DATABASE_URL=file:<repo>/.dev-data/workspace.db
BETTER_AUTH_SECRET=<32-byte hex shared across all templates>
```

The `.dev-data/` directory is gitignored. Production deployments use a managed Postgres (Neon / Turso / similar).

## Consequences

- **Workspace SSO works** — signing in at dispatch is recognised by every mini-app (verified live in this branch with `alice@demo.local` and Google OAuth `shash2577@gmail.com`).
- **Migration discipline matters more** — every mini-app's `server/plugins/db.ts` runs migrations against the same database. They must not collide. Mini-app tables are explicitly namespaced (`<app>_*`); framework tables are shared.
- **Migrations are additive-only.** Hosted templates share their production DB across deploy contexts; destructive migrations cause incidents (see CLAUDE.md 2026-04-21). Two static guards enforce this: `guard-no-drizzle-push.mjs` blocks `drizzle-kit push`, and `createDrizzleConfig()` throws at runtime if invoked against a Neon URL.
- **A single misbehaving migration affects the whole workspace.** Mitigated by per-app migration tracking inside each template's `db.ts` plugin.
- **Mini-apps cannot directly query each other's tables.** They must go through the capability registry (ADR-004). The `guard-no-unscoped-queries.mjs` static check enforces ownership scoping.

## Migration path

Pattern 1 → pattern 2 was done in this branch. Steps:

1. Generate one shared `BETTER_AUTH_SECRET` (32 bytes hex)
2. Set `DATABASE_URL=file:<repo>/.dev-data/workspace.db` in every `templates/*/.env.local`
3. Set the shared `BETTER_AUTH_SECRET` in every `.env.local`
4. Delete per-template `templates/*/data/app.db` files
5. Restart `pnpm dev:lazy` — the first template that boots runs framework migrations; subsequent templates add their domain tables

## Alternatives considered

- **Keep per-template databases + use Better Auth's organization plugin to glue them together.** Operationally fragile — session tokens minted by one BA instance don't validate against another's tables.
- **One shared database for framework tables, separate per-app databases for app tables.** Adds split-brain complexity for inter-app queries; rejected.

## References

- [`architecture/04-data-and-auth.md`](../architecture/04-data-and-auth.md)
- [`testing/qa-runbook.md`](../testing/qa-runbook.md) — guard checks
- CLAUDE.md 2026-04-21 destructive-migration incident
