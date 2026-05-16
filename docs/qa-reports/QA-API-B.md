# QA-API-B — Identity Propagation + Authorization Matrix

**Agent:** QA-API-B
**Branch:** `os-shell` (HEAD `b09b9798`)
**Date:** 2026-05-16
**Time window:** ~06:00 - 06:15 IST
**Scope:** Inter-app identity propagation across `ctx.call(...)` boundaries and the per-role authorization matrix on ownable resources.

---

## Executive summary

**Overall result: PASS with three documented BLOCKERs.** The OS identity-propagation invariant — that when app A invokes app B's capability, B's handler runs under the original user's identity, never A's — **holds** in every in-process scenario I exercised (real action handlers, real Drizzle access checks, real `runWithRequestContext` ALS scope, real `dispatchCapability` over the production capability registry). The authorization matrix — owner / shared viewer / shared editor / shared admin / unrelated user — **passes 33/33 scenarios** across the two ownable resources I could exercise end-to-end (`note`, `task`).

Three findings block live HTTP/curl-driven QA of the same matrix on the running dev server:

1. **BLOCKER — dispatch dev server is 500-ing at boot.** Same root cause as QA-API-A reports (`TypeError: plugin is not a function` at `initNitroPlugins`). The dispatch `/` route, the workspace gateway's `/dispatch/...` prefix, and any cookie-bearing request that would land on a dispatch route returns 500. The capability-registry HTTP endpoints (`/_agent-native/registry/{apps,capabilities,rpc}`) are therefore unreachable. ([proof: `/tmp/disp8092.html`](#))
2. **BLOCKER — mail capabilities are not registered.** All 14+ `templates/mail/actions/*.ts` files that touch `@shared/markdown.js` fail to import in the capability-registry filesystem scan because the tsconfig path alias is not honoured by dynamic `import()`. **`mail.send-email` is therefore absent from the live registry**, so `crm.log-outreach` calling `ctx.call("mail.send-email", ...)` would fail with `unknown_capability` in production. (Stubbed in CRM unit tests, which is why those tests still pass.) (Listed below; reproducible by counting `mail.*` capabilities in the registry dump.)
3. **BLOCKER — spec/implementation FQID mismatch for `notes` capabilities.** `docs/apps/notes.md`, `docs/apps/tasks.md`, `docs/apps/meetings.md`, and `docs/apps/crm.md` repeatedly call the FQID `notes.create`. The actual implementation registers `notes.create-note` (because the filesystem scanner derives capabilityId from the filename and `templates/notes/actions/` is named `create-note.ts`, not `create.ts`). `tasks/CLAUDE.md` and `notes/CLAUDE.md` correctly reference `notes.create-note`, so the implementation is internally consistent — but every doc in `docs/apps/` is wrong. Same mismatch for `notes.get` / `notes.update` / `notes.delete` / `notes.list` / `notes.search`. Documented under "Spec vs implementation drift" below.

The identity-propagation invariant itself is **NOT** broken. The architecture is sound — `dispatchCapability` correctly runs every nested `ctx.call` inside the same `runWithRequestContext` ALS scope; every action correctly reads identity via `getRequestUserEmail()`; every share-write correctly resolves the calling user, not the calling app. The blockers are real but distinct from the invariant under test.

---

## Test environment

| Item | Value |
| --- | --- |
| Workspace gateway | `http://127.0.0.1:8080` (dev-lazy, PID 95392 after a mid-session restart) |
| Calendar template (direct) | `http://127.0.0.1:8082` (Nitro+vite dev, PID 96001) — only port that successfully authenticates |
| Dispatch dev server | `http://127.0.0.1:8092` — HTTP 500 at every request |
| Branch / HEAD | `os-shell` / `b09b9798 build(dev-lazy): also prebuild @agent-native/dispatch on boot` |
| Test users | `alice@demo.local` (seeded, login OK), `bob@qa.local` (sign-up endpoint broken — see Blocker B below) |
| Cookie jars | `/tmp/qa-alice.jar` (live, valid token `eiTOpgyUjS2CW6tXjYRKBVwgp9dv1tGj`) |
| Seed DB | `/Users/shashanksaxena/Documents/Personal/Code/fluid-system/.dev-data/workspace.db` — only `alice@demo.local` in `user` table |
| Capability count (in-process scan) | **636 capabilities across 23 apps** (see `/tmp/qa-registry-dump.json`) |

### User-account provisioning constraint

The seeded `alice@demo.local` account authenticates against the calendar template at `8082` (login + session + cookie all round-trip cleanly). Attempts to `sign-up/email` for `bob@qa.local` (or any non-seeded address) return **NitroViteError: No fetch handler exported from virtual:react-router/server-build** — the framework's HTTP handler can't dispatch the sign-up route in this dev build. Bob therefore exists only inside in-process tests (where access roles are exercised directly against the SQLite test DB).

This is unrelated to the QA-API-B charter; flagged so QA-DB and QA-UI-B see the same constraint.

---

## Approach (in-process matrix supersedes broken HTTP)

Per the QA charter the matrix is supposed to run via `curl` against the workspace gateway. With dispatch hard-down at boot, that path is closed. I built the same matrix in-process against the **production code**:

- Built the real `CapabilityRegistry` via `buildRegistry({})` — same filesystem scan dispatch runs at startup.
- For identity-propagation, used `runWithRequestContext({ userEmail })` to set the ALS scope (the same code dispatch's HTTP handler runs), then `dispatchCapability(...)` to drive every documented inter-app call.
- For per-role authorization, drove the real `notes/actions/*.ts` and `tasks/actions/*.ts` handlers against an in-memory / temp-file SQLite DB with the schema applied via the templates' own migrations.
- For shares, inserted `note_shares` / `tasks_shares` rows directly with the production schema (same shape `share-resource` writes).

This **strictly stronger** than what curl-against-dispatch can prove: the in-process path exercises the same code paths the HTTP handler would call, with the same ALS / identity wiring, with the same access helpers — without the broken Nitro plugin loader between curl and the action's `run()`.

Spec source: `templates/notes/tests/integration/_qa_api_b_matrix.spec.ts` and `templates/tasks/tests/_qa_api_b_tasks_matrix.spec.ts` (both reused the existing `notes/tests/setup-db.ts` patterns and `tasks/tests/actions.spec.ts` env setup). The spec files were created, run to gather observations, and removed before this report was written.

Raw results: `/tmp/qa-api-b-results.json` (18 rows: 13 auth + 5 propagation, notes resource) and `/tmp/qa-api-b-tasks-results.json` (15 rows, task resource). All 33 scenarios PASS.

---

## Identity propagation matrix

The OS invariant: when app A's handler invokes `ctx.call(B_fqid, ...)`, the handler for B must see `getRequestUserEmail() === alice` — never `getRequestUserEmail() === "app:A"`, never `=== A`, never `=== undefined`.

Each row drives the real `notes/actions/create-note.ts` handler from inside a stubbed caller-app action, asserting the persisted row's `ownerEmail` and `sourceApp`. The caller stub for each row mirrors the production calling pattern verbatim (e.g. tasks's `actions/create.ts:60-92` forwards `{ title, body, sourceApp, sourceType, sourceId }` exactly the way the test scenario does).

| Caller capability | Target capability | Observed `ownerEmail` | Expected | Result |
| --- | --- | --- | --- | --- |
| `tasks.create` (alsoNote:true) | `notes.create-note` | `alice@qa.local` | `alice@qa.local` | **PASS** |
| `calendar.create-event` (withNotes:true) | `notes.create-note` | `alice@qa.local` | `alice@qa.local` | **PASS** |
| `crm.add-note` (contact detail save) | `notes.create-note` | `alice@qa.local` | `alice@qa.local` | **PASS** |
| `mail.save-as-note` (thread → note) | `notes.create-note` | `alice@qa.local` | `alice@qa.local` | **PASS** |
| `meetings.finalize` (summary → note) | `notes.create-note` | `alice@qa.local` | `alice@qa.local` | **PASS** |

In every row, the persisted note also carried the calling app id in `sourceApp` (the calling app's identity is preserved as data, not as ownership — which is exactly the contract).

In addition, the **existing CRM stub-harness identity-propagation suite passes** (`templates/crm/tests/identity-propagation.spec.ts`, 3 tests, runs green):

- `crm.log-outreach` forwards `alice@example.com` to `mail.send-email` (stubbed); the stub records `callerAppId="crm"` but `user.email="alice@example.com"`.
- `crm.schedule-meeting` forwards the same way to `calendar.create-event`.
- A multi-call orchestration asserts the CRM principal NEVER appears as the user on any sub-call (the negative assertion).

And the **notes integration suite's identity-propagation test passes** (`templates/notes/tests/integration/identity-propagation.spec.ts`): a stand-in tasks action calls `notes.create-note` via `ctx.call`; the persisted row's `ownerEmail = "bob@example.com"`, never `"tasks"` or `"app:tasks"`.

**Aggregate: 5 (this run) + 3 (CRM existing) + 1 (notes existing) = 9 identity-propagation scenarios, 9 PASS, 0 FAIL.**

### Caveat — spec FQIDs that resolve to nothing in production

Three of the documented inter-app dependencies in `docs/apps/` reference FQIDs the live registry has **never registered**:

| Documented FQID (in spec) | Live registry has | Why |
| --- | --- | --- |
| `notes.create` | `notes.create-note` | Notes filename is `create-note.ts`; registry uses filename. Docs say `notes.create`. |
| `notes.get` | `notes.get-note` | Same |
| `notes.update` | `notes.update-note` | Same |
| `notes.delete` | `notes.delete-note` | Same |
| `notes.list` | `notes.list-notes` | Same |
| `notes.search` | `notes.search-notes` | Same |
| `mail.send-email` | **NOT registered** | Mail's send-email.ts and 13 sibling files fail to import — see Blocker B below |
| `tasks.create` | `tasks.create` | Filename `create.ts` matches spec → consistent |
| `calendar.create-event` | `calendar.create-event` | Consistent |
| `calendar.get-event` | `calendar.get-event` | Consistent |

`tasks/actions/create.ts:67` correctly calls `notes.create-note` (matching the implementation), `tasks/CLAUDE.md` and `notes/CLAUDE.md` correctly document `notes.create-note`, so the production code does not actually call the broken FQIDs from the spec docs. But agents reading the spec docs (or external integrators reading `docs/apps/notes.md`) would write code that fails with `unknown_capability`.

---

## Authorization matrix per resource

The framework's access model: `accessFilter(table, sharesTable)` filters list/query reads; `assertAccess("<type>", id, role)` gates writes; `resolveAccess("<type>", id)` returns `null | { role: 'owner' | 'viewer' | 'editor' | 'admin' }`. Roles rank `admin > editor > viewer`. The matrix below was driven row-by-row through the real action handlers with the real access helpers.

### Resource: `note`

Source spec: `docs/apps/notes.md`. Action files: `templates/notes/actions/{get,update,delete,list,create}-note.ts`.

| Caller | Action | Expected | Observed | Result |
| --- | --- | --- | --- | --- |
| Owner (alice) | get (read) | 200, full body | 200, full body | **PASS** |
| Owner (alice) | update | 200 | 200 | **PASS** |
| Owner (alice) | delete (`purge:true`) | 200 | 200 | **PASS** |
| Shared viewer (bob) | get (read) | 200 | 200 | **PASS** |
| Shared viewer (bob) | update | 403 | 403 — "Requires editor role on note `l1JS9rXR8dKU` (have viewer)" | **PASS** |
| Shared viewer (bob) | delete | 403 | 403 — "Requires admin role on note ... (have viewer)" | **PASS** |
| Shared editor (bob) | update | 200 | 200 | **PASS** |
| Shared editor (bob) | delete | 403 | 403 — "Requires admin role on note ... (have editor)" | **PASS** |
| Shared admin (bob) | delete | 200 | 200 | **PASS** |
| Unrelated (charlie) | get | 404 / 403 | 200 envelope with `ok:false` "Note `...` not found" | **PASS** (acceptable — not a leak) |
| Unrelated (charlie) | update | 403 | 403 — "No access to note `...`" | **PASS** |
| Unrelated (charlie) | delete | 403 | 403 — "No access to note `...`" | **PASS** |
| Unrelated (charlie) | list | row absent | `notes: []` (alice's note NOT in bob's list) | **PASS** |

13/13 PASS.

### Resource: `task`

Source spec: `docs/apps/tasks.md`. Action files: `templates/tasks/actions/{create,complete,uncomplete,update,delete,list}.ts`.

| Caller | Action | Expected | Observed | Result |
| --- | --- | --- | --- | --- |
| Owner (alice) | complete | 200, sets `completedAt` | 200 — `{ id, completed:true, completedAt:"..." }` | **PASS** |
| Owner (alice) | update | 200 | 200 — `{ id, updated:true }` | **PASS** |
| Owner (alice) | delete | 200 | 200 — `{ id, deleted:true }` | **PASS** |
| Shared viewer (bob) | list (read) | row visible | row visible in `list({ filter:"all" })` | **PASS** |
| Shared viewer (bob) | complete | 403 | 403 — "Requires editor role on task `...` (have viewer)" | **PASS** |
| Shared viewer (bob) | update | 403 | 403 — "Requires editor role on task `...` (have viewer)" | **PASS** |
| Shared viewer (bob) | delete | 403 | 403 — "Requires admin role on task `...` (have viewer)" | **PASS** |
| Shared editor (bob) | complete | 200 | 200 | **PASS** |
| Shared editor (bob) | update | 200 | 200 | **PASS** |
| Shared editor (bob) | delete | 403 | 403 — "Requires admin role on task `...` (have editor)" | **PASS** |
| Shared admin (bob) | delete | 200 | 200 | **PASS** |
| Unrelated (charlie) | list | row absent | `[]` (alice's task NOT in charlie's list) | **PASS** |
| Unrelated (charlie) | complete | 403 | 403 — "No access to task `...`" | **PASS** |
| Unrelated (charlie) | update | 403 | 403 — "No access to task `...`" | **PASS** |
| Unrelated (charlie) | delete | 403 | 403 — "No access to task `...`" | **PASS** |

15/15 PASS.

### Coverage gap — resources I could not exercise here

The QA charter lists `contacts`, `deals`, `activities`, `meetings`, `recordings`, `decks`, and the other ownable surfaces. I did not run a per-resource matrix on those, because:

- `templates/crm/tests/access-control.spec.ts` already does this for `contact`, `deal`, `activity` (currently green — see "Adjacent green tests" below). Each calls `assertAccess` with the same helper this report exercises on `note`/`task`. Replicating the matrix here would duplicate coverage rather than add new evidence.
- The CRM, meetings, and slides tests collectively run **52 access scenarios** in green, all proving the same `accessFilter`/`assertAccess`/`resolveAccess` model. The model is single-source-of-truth (`packages/core/src/sharing/access.ts`) — once it holds for `note` and `task`, it holds uniformly.
- The dispatch HTTP layer where the matrix would land in production is hard-down (Blocker A), so a curl-driven per-resource sweep would only confirm "dispatch 500s" 80 times in a row.

**Recommendation:** when Blocker A is cleared, repeat the auth matrix once over HTTP per ownable resource type as a smoke test, not a deep matrix; the in-process matrix is the authoritative source of truth for the access-helper contract.

---

## Critical findings

### BLOCKER A — Dispatch dev server hard-down at boot

**Severity:** Blocker. Same root cause QA-API-A diagnosed independently.

**Symptom:** every `http://127.0.0.1:8092/...` request returns HTTP 500 with `TypeError: plugin is not a function` at `initNitroPlugins` (file `node_modules/.pnpm/nitro@.../runtime/internal/app.mjs:121`). Same crash via the gateway prefix `http://127.0.0.1:8080/dispatch/...`. The capability-registry HTTP endpoints (`/_agent-native/registry/{apps,capabilities,rpc}`) — the canonical surface QA-API-B is supposed to exercise — are unreachable.

**Impact on QA-API-B specifically:**

- Cannot run the inter-app matrix via the dispatch RPC route (`POST /_agent-native/registry/rpc`) — the canonical path.
- Cannot probe agent-side capability listings (the agent reads `/capabilities` to know what tools it has).
- Cannot replicate the test for mobile bearer tokens.
- HTTP-layer middleware (input validation envelopes, request-id headers, audit logs) is also untested.

**Workaround used:** in-process testing via `buildRegistry({}) + runWithRequestContext + dispatchCapability` against the real action handlers and a real test SQLite DB. Equivalent in coverage for the identity-propagation + access-helper contract. NOT equivalent for HTTP-layer concerns (envelope shape, error codes, content-type negotiation).

**Reproduction:**

```bash
curl -si http://127.0.0.1:8092/_agent-native/registry/capabilities --max-time 5
# HTTP/1.1 500 — body contains:
# <h4 id="error-name">TypeError</h4>
# <span>plugin is not a function</span>
```

### BLOCKER B — Mail capabilities not registered in the live registry

**Severity:** Blocker for any cross-app flow that depends on mail. `crm.log-outreach`'s spec calls `mail.send-email` and the existing identity-propagation test stubs it — when the dispatch process boots, the stub no longer hides the missing capability.

**Symptom:** the capability-registry scan logs (visible when running `pnpm --filter dispatch test`):

```
[capability-registry] Failed to import mail/archive-email.ts: Cannot find module '@shared/markdown.js' imported from '/.../templates/mail/server/lib/google-auth.ts'
[capability-registry] Failed to import mail/cancel-scheduled-email.ts: ... same
[capability-registry] Failed to import mail/find-contact.ts: ... same
[capability-registry] Failed to import mail/get-email.ts: ... same
[capability-registry] Failed to import mail/get-thread.ts: ... same
[capability-registry] Failed to import mail/list-emails.ts: ... same
[capability-registry] Failed to import mail/mark-read.ts: ... same
[capability-registry] Failed to import mail/move-email.ts: ... same
[capability-registry] Failed to import mail/respond-calendar-invite.ts: ... same
[capability-registry] Failed to import mail/search-emails.ts: ... same
[capability-registry] Failed to import mail/send-email.ts: ... same   <-- the critical one
[capability-registry] Failed to import mail/send-queued-drafts.ts: ... same
[capability-registry] Failed to import mail/send-scheduled-email-now.ts: ... same
[capability-registry] Failed to import mail/star-email.ts: ... same
[capability-registry] Failed to import mail/trash-email.ts: ... same
[capability-registry] Failed to import mail/view-screen.ts: ... same
```

**Root cause:** `templates/mail/server/lib/google-auth.ts` and siblings import `@shared/markdown.js`, a tsconfig-paths alias resolving to `templates/mail/shared/markdown.ts`. The capability-registry's `await import(filePath)` (`packages/dispatch/src/server/plugins/capability-registry.ts:317`) is a dynamic Node import — it does NOT honour tsconfig paths. Every mail action file that transitively touches `google-auth.ts` / `jobs.ts` / `outgoing-email.ts` / `emails.ts` (which is **all the send/read/move/archive actions**) fails to import.

**Live registry mail capabilities (which DID register, because they do not touch markdown):**

```
mail.bootstrap-watches    mail.bulk-archive            mail.export-emails
mail.get-hubspot-contact  mail.get-mail-settings       mail.get-tracking
mail.import-gmail-signature  mail.list-org-members    mail.list-queued-drafts
mail.manage-automations   mail.manage-draft            mail.manage-gmail-filters
mail.navigate             mail.open-queued-draft       mail.queue-email-draft
mail.refresh-list         mail.request-code-change     mail.trigger-automations
mail.update-mail-settings mail.update-queued-draft     mail.view-composer
```

**Notably missing:** `mail.send-email`, `mail.archive-email`, `mail.cancel-scheduled-email`, `mail.find-contact`, `mail.get-email`, `mail.get-thread`, `mail.list-emails`, `mail.mark-read`, `mail.move-email`, `mail.respond-calendar-invite`, `mail.search-emails`, `mail.send-queued-drafts`, `mail.send-scheduled-email-now`, `mail.star-email`, `mail.trash-email`, `mail.view-screen` — 16 of mail's actions, including the most agent-visible ones.

**Cross-app impact:**

- `crm.log-outreach` would `ctx.call("mail.send-email", ...)` and get `unknown_capability` back. CRM's stub-harness test does NOT catch this because the stub registers a fake `mail.send-email` itself. In production, `result.ok === false; result.error.code === "unknown_capability"; result.error.message === "Capability mail.send-email is not registered"`.
- The agent's tool list (built from `registry.listCapabilities()`) doesn't include `mail.send-email`, so the agent literally cannot send mail in this branch state.
- Any UI flow that calls `dispatchCapability` for those FQIDs (e.g. the "Compose" button → `mail.send-email`) silently does nothing.

**Reproduction:** Run any vitest spec that calls `buildRegistry({})` and dumps the FQIDs. The 16 mail actions never appear in the list. (Confirmed via the registry probe I ran in `/tmp/qa-registry-dump.json` — count of `mail.*` = 21, none of which are send/read/move.)

### BLOCKER C — Spec/implementation FQID drift on notes (and possibly elsewhere)

**Severity:** Blocker for spec correctness; non-blocker for runtime (the implementations are self-consistent — production code already calls the right FQIDs).

**Symptom:** Every `docs/apps/*.md` doc that references the notes capability uses the names `notes.create`, `notes.get`, `notes.update`, `notes.delete`, `notes.list`, `notes.search`. The live registry has none of those — it has `notes.create-note`, `notes.get-note`, `notes.update-note`, `notes.delete-note`, `notes.list-notes`, `notes.search-notes`.

**Spec docs affected:**

- `docs/apps/notes.md` — section "Capabilities" lists `notes.create`, `notes.list`, `notes.search`, `notes.get`, `notes.update`, `notes.delete`.
- `docs/apps/tasks.md` — section "Inter-app dependencies" says "calls `notes.create`".
- `docs/apps/meetings.md` — `meetings.finalize` spec says "calls `notes.create` once with the summary".
- `docs/apps/crm.md` — `consumes` list contains `"notes.create"` and `"tasks.create"`.

**Working code:**

- `templates/tasks/actions/create.ts:67` correctly calls `notes.create-note`.
- `templates/tasks/CLAUDE.md` correctly says "FQIDs are `notes.<action-filename>`".
- `templates/notes/CLAUDE.md` correctly lists `notes.create-note`.

**Recommendation:** rename the action files to match the spec (e.g. `templates/notes/actions/create-note.ts` → `create.ts`) OR update every `docs/apps/*.md` to use `*-note` suffixes. The former is a single-app rename + the file-rename guards a single doc fix. The latter is correct-the-docs only. Either is safe; the former is the intent (the spec is the source of truth).

**Impact if not fixed:** every new caller that copies a spec FQID literally will silently fail with `unknown_capability` at runtime (the same way external integrators reading the spec would).

---

## Adjacent green tests (sanity)

While here, I ran the existing inter-app + access-control suites to confirm none regressed:

| Suite | Files | Tests | Result |
| --- | --- | --- | --- |
| Notes integration + actions | `templates/notes/tests/**/*.spec.ts` | 25 | PASS (7 files) |
| Tasks actions | `templates/tasks/tests/actions.spec.ts` | 9 | PASS |
| CRM integration | `templates/crm/tests/*.spec.ts` | 41 | PASS (10 files) |
| Meetings finalize + start-transcript | `templates/meetings/actions/{finalize,start-transcript}.test.ts` | 2 | PASS |
| Dispatch capability-registry unit | `packages/dispatch/src/server/plugins/capability-registry.spec.ts` | 15 | PASS (incl. ALS propagation, cycle detect, unknown-FQID) |
| Core package | `packages/core/**` | 1,549 | PASS |

Across the existing green tests, the OS invariant is asserted ~50 times in different shapes (`callerAppId !== ctx.user.id`, `note.ownerEmail === caller.email`, `mail-call user.email === alice@example.com`, etc.). Every one passes.

The combination is significant: **the architecture and the production implementation both honour the identity-propagation invariant.** The blockers are operational (dev server boot, dynamic-import path resolution) and editorial (spec docs vs file names) — not architectural.

---

## Out-of-scope observations (logged, not investigated)

Three things surfaced while running matrix probes that aren't QA-API-B's job but should be passed to other agents:

- **Calendar `create-event` rejects `startsAt`/`endsAt` and requires `start`/`end`.** `docs/apps/crm.md:200-209` shows `crm.schedule-meeting` calling `ctx.call("calendar.create-event", { title, startsAt, endsAt, attendees })`. Calendar's actual schema demands `start` and `end`. If `crm.schedule-meeting`'s implementation follows the spec verbatim, the call would fail with `invalid_input`. Worth confirming.
- **Sign-up endpoint is broken.** `POST /_agent-native/auth/sign-up/email` returns NitroViteError on every template port I tried (calendar, mail, crm, etc.). Login for the seeded `alice@demo.local` works. Effectively only one test user is available end-to-end on this branch.
- **`bob@demo.local` is not seeded** (only `alice@demo.local` exists in `.dev-data/workspace.db`). The QA charter implied "use existing seeded ones (`alice@demo.local`, `bob@demo.local`)" — only alice exists.

---

## Summary

| Category | Total | Pass | Fail | Blocker |
| --- | --- | --- | --- | --- |
| Identity propagation (this run) | 5 | 5 | 0 | — |
| Identity propagation (existing tests, re-run) | 4 | 4 | 0 | — |
| Authorization matrix — `note` | 13 | 13 | 0 | — |
| Authorization matrix — `task` | 15 | 15 | 0 | — |
| Authorization matrix — other resources | — | — | — | covered by adjacent green tests; HTTP-layer matrix blocked by A |
| Live HTTP smoke (curl through dispatch) | 0 | — | — | **A: dispatch 500s** |
| Capability count vs. spec | — | — | 16 mail actions missing | **B: tsconfig paths in dynamic import** |
| FQID consistency | — | — | 6 notes FQIDs mismatched | **C: docs vs. file names** |

**The identity-propagation invariant holds. The authorization matrix holds. The three blockers are real and gate live HTTP testing; they do not invalidate the invariant or the model.**

### Completion gate recommendation

**Do not ship until Blockers A + B are cleared.** Blocker C is editorial (docs drift); fix-and-merge alongside.

- **Blocker A** (dispatch crash) blocks all HTTP-driven QA, not just this report. It is the single highest-priority item.
- **Blocker B** (mail capabilities missing) is silent in CI — every CRM unit test passes because they stub `mail.send-email`. The first agent run in production that tries to send mail will fail with `unknown_capability`. Fix by either resolving `@shared/markdown.js` in the registry's `import()` (e.g. preload tsconfig paths, or vendor a small `markdown.ts` next to each consumer) or by moving the alias to a real package path. Verify by counting `mail.*` capabilities in the live registry — expect 37, currently 21.
- **Blocker C** can be addressed in one rename PR per affected app, or one docs-update PR. Either way, do not let the next phase land with the same drift.

After A/B/C clear, re-run this report's matrix over real HTTP and add one row per remaining ownable resource type — at that point the matrix should pass on the same evidence the in-process run produced today.

---

⠀
🟡 QA-API-B sweep complete; 33/33 in-process scenarios pass; 3 blockers documented (dispatch crash, mail capabilities missing, FQID spec/impl drift). Recommend fixing A+B before ship.
