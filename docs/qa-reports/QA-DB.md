# QA-DB — Data Integrity Final Report

**Branch:** `os-shell`
**Date:** 2026-05-16
**Workspace DB:** `/Users/shashanksaxena/Documents/Personal/Code/fluid-system/.dev-data/workspace.db`
**Scope:** Persistence, data integrity, schema cleanliness for the four Phase-3 templates promoted to workspace SQLite — `notes`, `tasks`, `crm`, `meetings`.

## TL;DR

**Verdict: Persistence claim is NOT met for notes / tasks / crm / meetings on `os-shell`.**

- The workspace SQLite layer itself is healthy. Tables that exist survive dispatch restarts and full dev-server restarts cleanly. WAL/SHM are well-behaved.
- **None of the four Phase-3 templates' schemas exist in the workspace DB.** Not after a normal restart, not after a wake-probe, not after a fresh boot. The migration plugins (`tasks_migrations`, `notes_migrations`, `_crm_migrations`, `_meetings_migrations`) never run because the four template Nitro servers crash before plugin-bootstrap completes (Vite/React-Router server build is broken — `"No fetch handler exported from virtual:react-router/server-build"`).
- Per-template `.env.local` files for the four templates are inconsistent with ADR-003: two have wrong/missing `BETTER_AUTH_SECRET` and none declare `DATABASE_URL`. The shared workspace SSO contract is partially broken at the env-var layer.
- Scenarios 3–5 (sharing rows, per-user isolation, cross-app cleanup) cannot be executed against a live DB because the underlying tables don't exist. Their **code-level** correctness was verified by reading the relevant `actions/*.ts` + `server/db/schema.ts`; details below.

Severity: **Blocker** for the Phase-3 "promoted to full templates with shared workspace SQLite" claim.

## Test Environment

| Item | Value |
| --- | --- |
| Branch | `os-shell` |
| Gateway | `http://127.0.0.1:8080` (dispatch-as-front-door via `pnpm dev:lazy`) |
| Dispatch dev port | 8092 |
| Notes / Meetings / Tasks / CRM ports | 8102 / 8101 / 8103 / 8104 |
| DB engine | SQLite (libsql) in WAL mode |
| DB file | `<repo>/.dev-data/workspace.db` |
| Demo user (DB seed) | `alice@demo.local` / id `QuBRj30XeQ8Mdi1Jbl5hkr90Tq8KW4Gu` |
| Sessions in DB | 4 (multiple alice tokens) |

## Pre-test table inventory

132 tables present at start. The expected Phase-3 tables (per `templates/{notes,tasks,crm,meetings}/server/db/schema.ts`) are:

| Template | Expected tables | Present in DB? |
| --- | --- | --- |
| notes | `notes_notes`, `notes_note_shares` | **NO** |
| tasks | `tasks_tasks`, `tasks_shares` | **NO** |
| crm | `crm_contacts`, `crm_contact_shares`, `crm_deals`, `crm_deal_shares`, `crm_activities`, `crm_activity_shares` | **NO** |
| meetings (Phase 3 schema) | `meetings`, `meeting_shares`, `meeting_transcripts`, `meeting_attendees`, `meeting_summaries`, `meeting_followups` | only `meetings` + `meeting_shares` present, and **with the legacy Clips-style schema** (`title`, `scheduled_start`, `summary_md`, `bullets_json`, `action_items_json`, `transcript_status` …) — not the Phase-3 schema. `meeting_transcripts`, `meeting_attendees`, `meeting_summaries`, `meeting_followups` do not exist. |

Migration cursors that DID register: `_org_migrations`, `analytics_migrations`, `calendar_migrations`, `clips_migrations`, `content_migrations`, `design_migrations`, `dispatch_migrations`, `forms_migrations`, `mail_migrations`, `slides_migrations`.

Migration cursors that were expected from Phase 3 but are **absent**: `tasks_migrations`, `notes_migrations`, `_crm_migrations`, `_meetings_migrations`.

## Scenario 1 — Persistence across dispatch restart

**Method.** Inserted a probe row into the only Phase-3-adjacent table that actually exists in this DB (the legacy `meetings` table):

```sql
INSERT INTO meetings (id, title, owner_email, org_id, visibility)
VALUES ('qa-db-probe-1778891744', 'QA-DB-RESTART-PROBE-1778891744',
        'alice@demo.local', NULL, 'private');
```

Then `kill <dispatch-vite-pid>` (52913 → respawned as 87721) — dev:lazy auto-restarted the child within ~3s. Re-queried.

**Result.** ✅ **PASS** for the SQLite persistence layer.

```
sqlite3 workspace.db "SELECT id, title, owner_email FROM meetings WHERE id LIKE 'qa-db-probe-%';"
qa-db-probe-1778891744|QA-DB-RESTART-PROBE-1778891744|alice@demo.local
```

- Probe row survived the dispatch process kill/respawn.
- `workspace.db-wal` (~1.2 MB) was preserved across the restart; SQLite WAL recovery worked as expected.
- Dispatch returned to serving on `:8080` (HTTP 302 → `/dispatch`).

**Caveat.** This proves the *workspace SQLite layer* persists. It does **not** prove the Phase-3 templates' data persists — they don't have any tables to test against in this DB. See Scenario 2 for why.

## Scenario 2 — Fresh DB migration cleanliness

**Method.**

1. `sqlite3 ".backup workspace.db.bak"` (consistent snapshot, after `PRAGMA wal_checkpoint(FULL)`).
2. `pkill -f 'node scripts/dev-lazy.ts'`. Confirmed gateway port released.
3. `rm -f workspace.db workspace.db-wal workspace.db-shm`.
4. `pnpm dev:lazy` (background) → waited 20s until gateway answered on 8080.
5. Walked the gateway: `curl /dispatch/`, `/meetings/`, `/crm/`, `/notes/`, `/tasks/`, `/calendar/`, `/mail/`, `/forms/`.
6. Snapshotted `SELECT name FROM sqlite_master WHERE type='table'` of the fresh DB.
7. Restored: `pkill -f 'node scripts/dev-lazy.ts'`; `cp workspace.db.bak workspace.db`; cleaned up backup files; re-started `pnpm dev:lazy`.

**Result.** ❌ **FAIL** for the four Phase-3 templates.

| Template | HTTP response | Migrations executed? | Tables created? |
| --- | --- | --- | --- |
| dispatch | 200 | ✅ `dispatch_migrations` v1, v2 + v1001..v1006 | yes |
| calendar | 000 (timeout but listening port came up) | ✅ `calendar_migrations` registered | yes |
| forms | 000 | ✅ `forms_migrations` registered | yes |
| **notes** | **500** ("No fetch handler exported from virtual:react-router/server-build") | ❌ no | ❌ none |
| **tasks** | **404** (route not found — `tasks` is not `core: true`, dev-lazy never starts it by default) | ❌ no | ❌ none |
| **crm** | **502** (Nitro: `Vite environment "nitro" is unavailable`, status 503 inside the worker) | ❌ no | ❌ none |
| **meetings** | **000** (worker eventually crashed) | ❌ no | ❌ none |

Fresh DB inventory: **61 tables** (vs 132 in the backup). The 61 includes only the templates that successfully booted (dispatch + calendar + forms + framework primitives like `user`, `session`, `account`, `application_state`, `tools`, `bookings`, `oauth_tokens`, `agent_*`, etc.). The legacy Clips-flavoured `meetings` / `meeting_action_items` / `meeting_participants` from the pre-existing backup are **also absent from the fresh DB** — that schema is no longer being applied by anything in the current codebase.

Sample of the `[dispatch] [db] Applied migration` log lines from `/tmp/qa-db-devlazy.log`:

```
[dispatch] [db] Applying 2 migration(s) on SQLite/libsql…
[dispatch] [db] Applied migration v1 (5 statements)
[dispatch] [db] Applied migration v2 (6 statements)
[dispatch] [db] Applying 6 migration(s) on SQLite/libsql…
[dispatch] [db] Applied migration v1001 (1 statement)
… v1002 … v1003 … v1004 … v1005 … v1006 …
```

No `[notes] [db] …`, `[tasks] [db] …`, `[crm] [db] …`, or `[meetings] [db] …` lines appear anywhere in the log. The migration plugins never run because the per-template Nitro worker crashes during dev-server bootstrap.

Representative error from the meetings template:

```
Error: No fetch handler exported from virtual:react-router/server-build
  at .../nitro/dist/runtime/internal/vite/dev-worker.mjs:208:17
```

CRM crashes earlier:

```
[crm] Error [NitroViteError]: Vite environment "nitro" is unavailable
   at httpError (.../nitro/dist/runtime/internal/vite/dev-worker.mjs:208:17)
   at ViteEnvRunner.fetch (.../dev-worker.mjs:77:13)  status: 503
```

**Backup restored.** `workspace.db` is back to 132 tables, probe row deleted as cleanup, dev:lazy running again on 8080 (PID 95373/95392). User and session rows preserved.

### Sub-finding: per-template `.env.local` is inconsistent with ADR-003

ADR-003 ("One shared workspace database across all mini-apps") requires every template's `.env.local` to set
`DATABASE_URL=file:<repo>/.dev-data/workspace.db` and a **shared** `BETTER_AUTH_SECRET`.

Actual state on this branch:

| Template | `.env.local` | `DATABASE_URL` | `BETTER_AUTH_SECRET` |
| --- | --- | --- | --- |
| calendar | present | `file:.../workspace.db` ✅ | `2f124fb62e1709…cd5f` (shared) ✅ |
| dispatch | present | `file:.../workspace.db` ✅ | `2f124fb62e1709…cd5f` (shared) ✅ |
| clips | present | `file:.../workspace.db` ✅ | `2f124fb62e1709…cd5f` (shared) ✅ |
| forms | present | `file:.../workspace.db` ✅ | `2f124fb62e1709…cd5f` (shared) ✅ |
| mail | present | `file:.../workspace.db` ✅ | `2f124fb62e1709…cd5f` (shared) ✅ |
| **meetings** | present | **missing** | `783489c54d9e…3876` (**different**) |
| **crm** | present | **missing** | `5fe2a1c1b8c6…ce5d` (**different**) |
| **notes** | **missing** | n/a | n/a |
| **tasks** | **missing** | n/a | n/a |

Even if the React-Router build issue were fixed, the four Phase-3 templates would not participate in workspace SSO: two have different signing secrets (cookies set by dispatch would fail validation), two have no auth secret at all. The DATABASE_URL omission is currently masked because `AGENT_NATIVE_WORKSPACE=1` resolves the workspace DB path elsewhere, but the divergent secrets are an immediate hazard.

## Scenario 3 — Sharing rows

**Method.** Cannot exercise against the running server (no Phase-3 tables, can't sign in to call actions). Verified by reading the schema and migration plugins.

**Findings (code-level).**

- `templates/notes/server/db/schema.ts:34` — `noteShares = createSharesTable("notes_note_shares")`. Migration v2 in `templates/notes/server/plugins/db.ts` matches: 6 columns, `principal_type`, `principal_id`, `role`, `created_by`, `created_at`. Resource id stored as `resource_id`. Naming is consistent with the framework `sharing` skill.
- `templates/tasks/server/db/schema.ts:38` — `taskShares = createSharesTable("tasks_shares")`. Same shape.
- `templates/crm/server/db/schema.ts` — three shares tables: `crm_contact_shares`, `crm_deal_shares`, `crm_activity_shares`. All three migrations present.
- `templates/meetings/server/db/schema.ts:46` — `meetingShares = createSharesTable("meeting_shares")`. **Name collides with the legacy Clips `meeting_shares`** that already exists in the workspace DB.

⚠️ **Collision risk.** The Phase-3 meetings template plans to create `meeting_shares` via `runMigrations({ table: "_meetings_migrations" })`. Because the legacy `meeting_shares` already exists in the workspace DB (the column shape happens to be identical — both are `createSharesTable` outputs), the `CREATE TABLE IF NOT EXISTS` would silently no-op. That's safe for *this* table by accident, but it means Phase-3 meetings would inherit any garbage data from the legacy schema. If the legacy `meetings` table ever differed in column shape from the Phase-3 schema, the silent-skip would be catastrophic (we'd be reading/writing the wrong layout). Recommend either renaming the Phase-3 prefix (e.g. `mtg_*`) or scrubbing the legacy `meetings`/`meeting_*` tables in a one-time cleanup step before Phase 3 ships.

**Status:** Not exercisable live. Schema looks correct. Risk flagged.

## Scenario 4 — Per-user isolation

**Method.** Cannot exercise against the running server. Reviewed the access-control wiring.

**Findings (code-level).**

- Every Phase-3 schema uses `...ownableColumns()` in its row table (`owner_email`, `org_id`, `visibility`). Verified in all four `schema.ts` files.
- `templates/notes/actions/list-notes.ts`, `templates/tasks/actions/list.ts`, `templates/crm/actions/list-contacts.ts` (per `templates/crm/server/lib/service.ts`), `templates/meetings/actions/list.ts` — none could be run live; sampling the service-layer code shows the framework's `accessFilter(table, sharesTable)` pattern is applied (see `crm/server/lib/service.ts:93`, `:113`, `:170`, `:200`, `:290`, `:376` — every list query also `AND isNull(deletedAt)`).
- `scripts/guard-no-unscoped-queries.mjs` is wired into CI (per repo CLAUDE.md) so unscoped reads should fail the build, but this guard only sees source, not runtime behaviour.

**Status:** Not exercisable live. Code wiring looks correct.

## Scenario 5 — Cross-app cleanup on contact delete

**Method.** Cannot exercise live. Inspected the delete-contact code path.

**Findings (code-level).** `templates/crm/actions/delete-contact.ts` → `deleteContact()` in `templates/crm/server/lib/service.ts:211`:

```ts
await db.update(schema.contacts)
  .set({ deletedAt: now, updatedAt: now })
  .where(eq(schema.contacts.id, row.id));
await db.update(schema.activities)   // <-- ALSO soft-deletes activities
  .set({ deletedAt: now })
  .where(and(eq(schema.activities.contactId, row.id),
             eq(schema.activities.ownerEmail, owner.ownerEmail)));
// NO writes to mail/calendar/notes.
```

Behaviour matches the spec **except** the QA-DB Scenario-5 wording:

- ✅ The contact is **soft-deleted** (`deletedAt` set; row remains).
- ✅ Mail messages, calendar events, notes survive — no `ctx.call("mail.delete-email")` / `notes.delete-note` etc. Code in `crm/CLAUDE.md` is explicit ("does NOT cascade across apps").
- ⚠️ **Discrepancy** with the QA-DB Scenario-5 ask: "The CRM activity row survives (it's historical)". The code **does** soft-delete the activity rows too (`deletedAt` set) so they no longer appear in `list-activities` queries (which filter `isNull(deletedAt)` per `service.ts:200`). Strictly the rows survive in the DB, but they are no longer reachable through the activity feed. If the spec intends an audit trail to remain visible, this is a bug; if "survives" only means "row is still in the DB", this is fine. Flagging for product clarification.

**Status:** Not exercisable live. One spec-vs-code ambiguity to resolve.

## Other observations

1. **Lots of `[capability-registry] Failed to import mail/*` errors.** The capability registry can't load any of `mail/{send-email,find-contact,get-email,get-thread,list-emails,mark-read,move-email,respond-calendar-invite,search-emails,star-email,trash-email,view-screen,send-queued-drafts,send-scheduled-email-now,cancel-scheduled-email}.ts` because `@shared/markdown.js` is missing. This isn't QA-DB's scope, but it cascades — any cross-app capability that calls `mail.send-email` (e.g. `crm.log-outreach` per CRM's CLAUDE.md) will fail to dispatch at the registry level too.

2. **`dispatch` template auto-account creation failed at boot:** `[agent-native] auto dev account skipped: [APIError: Invalid email]`. The `INVALID_EMAIL` body suggests the bootstrap is trying to seed a dev account but hitting Better Auth validation. Doesn't break dispatch itself, but worth flagging.

3. **Tasks template is not in the dev:lazy default core set.** `templates.ts` at line 296-302 declares `tasks` without `core: true`, so `pnpm dev:lazy` won't auto-start it; you'd need `pnpm dev:lazy -- --apps dispatch,tasks` or `--all`. This is configuration, not a code bug, but it means the "out of the box" workspace doesn't even include tasks.

4. **SQLite WAL is healthy.** Across two restarts (one targeted kill of the dispatch child, one full dev-server kill+restart+restore), the WAL/SHM files were recovered cleanly. The `.dev-data/` directory ended in a consistent state.

## Summary

| Scenario | Result | Severity |
| --- | --- | --- |
| 1. Persistence across dispatch restart (SQLite layer) | ✅ PASS | n/a |
| 1. Persistence for Phase-3 mini-app data specifically | ⛔ N/A — no rows exist to test | Blocker |
| 2. Fresh DB migration cleanliness — Phase-3 tables created? | ❌ FAIL — none of `notes_notes`, `tasks_tasks`, `crm_*`, or the new `meeting_*` tables get created | Blocker |
| 3. Sharing rows on share/unshare | ⏸ Not exercisable; schema looks correct; legacy-vs-new `meeting_shares` collision risk flagged | High |
| 4. Per-user isolation | ⏸ Not exercisable; code wiring uses `ownableColumns()` + `accessFilter` correctly | n/a (until 2 is fixed) |
| 5. Cross-app cleanup on contact delete | ⏸ Not exercisable; code soft-deletes contact + activities; spec-vs-code ambiguity on "activity row survives" | Low (clarification) |

**Root cause to investigate first:** the Vite/React-Router dev-worker build for `notes`/`tasks`/`crm`/`meetings` — every other template boots cleanly on the same codebase. Suspect: a missing `react-router.config.ts` export, a stale `node_modules/.vite` cache for those four, or a `package.json` script difference. Once boot works, the second layer of fixes is the `.env.local` cleanup (Scenario-2 sub-finding) so all four templates point at the workspace DB with the shared `BETTER_AUTH_SECRET`.

The persistence story claimed by Phase 3 cannot be demonstrated until both issues are fixed; once they are, all five scenarios should be re-run.

## Artefacts

- `/tmp/qa-db-devlazy.log` — full dev:lazy stdout/stderr captured during Scenario 2 (fresh-DB boot run).
- `/tmp/qa-db-pre-tables.txt` — table inventory before Scenario 2.
- `/tmp/qa-db-post-fresh-tables.txt` — table inventory after Scenario 2 wake probes (61 tables; Phase-3 absent).
- Backup file `workspace.db.bak` was generated and cleanly restored — no stray artefacts left in `.dev-data/`.

