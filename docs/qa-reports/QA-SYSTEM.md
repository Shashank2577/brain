# QA-SYSTEM — Final System QA Report

End-to-end system testing of the Fluid super-app. Verifies the full stack works through real flows (auth, SSO, registry, capability RPC, inter-app composition, per-user isolation, persistence, and shell pages).

## Test Environment

| Field | Value |
| --- | --- |
| Gateway URL | `http://127.0.0.1:8080` |
| Branch | `os-shell` |
| Branch tip | `4c365250` (docs(qa): plain-English final breakdown — plan vs done vs broken) |
| Working tree | clean (5 untracked files, all under `docs/qa-reports/` + `.omc/` + `packages/mobile-app/dist-*`) |
| Workspace DB | `/Users/shashanksaxena/Documents/Personal/Code/fluid-system/.dev-data/workspace.db` |
| Gateway PID | `33630` (`node scripts/dev-lazy.ts`) |
| Dispatch PID (pre-restart) | `68963` (vite child of pnpm) |
| Dispatch PID (post-restart) | `1808` (re-spawned by `dev-lazy.ts`) |
| Seeded user | `alice@demo.local` / `demo1234` |
| Sister user (created in flow 8) | `bob@qa-system.local` / `demo1234` |
| Date | 2026-05-16 |
| Concurrent agents | QA-AUTH + QA-EXPLORE running in parallel; some rows in workspace.db were written by them during this run |

## Summary

| Metric | Count |
| --- | --- |
| Total scenarios run | 14 |
| Pass | 9 |
| Fail | 5 |
| Blocked | 0 |

Critical findings:
1. **Inter-app capability composition is broken in this dev configuration** (Flows 5, 6, 7) — both the in-process-registry path (`tasks.create → notes.create-note`) and the HTTP-RPC path (`crm.log-outreach → mail.send-email`, `crm.schedule-meeting → calendar.create-event`) fail.
2. **Notes / Tasks / CRM / Meetings page-level routes return HTTP 500** (BLK-2-style `NitroViteError: No fetch handler exported from virtual:react-router/server-build`). API endpoints under `/_agent-native/*` on the same templates work fine. This contradicts the FINAL-BREAKDOWN claim that "all 13 templates return HTTP 200" — that probe was hitting the auth endpoint, not the root page.

## Per-Flow Result Table

### API-LEVEL FLOWS

| # | Scenario | Result | Response shape sample | Severity (if fail) | Reproduction |
| --- | --- | --- | --- | --- | --- |
| 1 | Sign-in roundtrip — `POST /dispatch/_agent-native/auth/login` with `alice@demo.local`/`demo1234`, then `GET /dispatch/_agent-native/auth/session` | PASS | login: `{"ok":true}` + `Set-Cookie: an_session_workspace=...` HttpOnly; session: `{"email":"alice@demo.local","token":"QlZTxJE95HhHKQlDmYTBXJZX09X41VRr"}` | — | `curl -c jar -X POST -H 'Content-Type: application/json' -d '{"email":"alice@demo.local","password":"demo1234"}' http://127.0.0.1:8080/dispatch/_agent-native/auth/login && curl -b jar http://127.0.0.1:8080/dispatch/_agent-native/auth/session` |
| 2 | Cross-template SSO — same cookie carries to all 13 templates | PASS | All 13 templates return identical `{"email":"alice@demo.local","token":"QlZTxJE95HhHKQlDmYTBXJZX09X41VRr"}` from `/_agent-native/auth/session` | — | `for app in dispatch calendar mail slides forms content design analytics clips notes tasks crm meetings; do curl -b jar http://127.0.0.1:8080/$app/_agent-native/auth/session; done` |
| 3 | Registry inventory — `/dispatch/_agent-native/registry/apps` and `/registry/capabilities` | PASS (with note) | `/registry/apps` returns 23 apps (not 13 — registry catalogs every template in the workspace, including the hidden ones: `calls`, `images`, `issues`, `macros`, `meeting-notes`, `recruiting`, `scheduling`, `starter`, `videos`, `voice`); `/registry/capabilities` returns 652 capability defs | — | `curl -b jar http://127.0.0.1:8080/dispatch/_agent-native/registry/apps`; `curl -b jar http://127.0.0.1:8080/dispatch/_agent-native/registry/capabilities` |
| 4 | Single-app capability — `notes.create-note` via `/registry/rpc` | PASS | `{"ok":true,"output":{"id":"RfyIC8ZKWMih","title":"QA-SYSTEM smoke test","body":"",...,"ownerEmail":"alice@demo.local","urlPath":"/notes/RfyIC8ZKWMih"}}` — `ownerEmail` correctly stamped to the calling user | — | `curl -b jar -X POST -H 'Content-Type: application/json' -d '{"capability":"notes.create-note","input":{"title":"QA-SYSTEM smoke test","content":"flow-4 verification"}}' http://127.0.0.1:8080/dispatch/_agent-native/registry/rpc` |
| 5 | Inter-app capability — `tasks.create` with `alsoNote: true` (note: brief said `tasks.create-task` but actual FQID is `tasks.create`) | **FAIL** | `{"ok":true,"output":{"id":"task_HlJwrDAuAo","text":"Flow-5 inter-app task","linkedNoteId":null,"linkWarning":"capability registry not available",...}}` — task itself is created and owned by alice, but cross-app link to `notes.create-note` failed. Verified in SQL (`workspace.db`): `task_HlJwrDAuAo` exists with `owner_email = alice@demo.local`, `linked_note_id IS NULL`; alice's `notes_notes` count only includes the Flow-4 note (no task-linked note appeared) | **Critical (P1)** — inter-app composition is the headline feature of the registry and it does not work in dev | `curl -b jar -X POST -H 'Content-Type: application/json' -d '{"capability":"tasks.create","input":{"text":"Flow-5 inter-app task","alsoNote":true}}' http://127.0.0.1:8080/dispatch/_agent-native/registry/rpc` |
| 6 | CRM → mail chain — `crm.create-contact` then `crm.log-outreach` | **FAIL** | create-contact: `{"ok":true,"output":{"id":"contact_FDpdR5qR0Q",...}}`; log-outreach: `{"ok":false,"error":{"code":"handler_error","message":"FLUID_OS_TOKEN not set — cannot make cross-app RPC call from standalone template. Run via the fluid-os host (or set FLUID_OS_TOKEN to a dev token)."}}`; `crm.list-activities` returns `{"activities":[]}` (no email activity logged because the upstream call threw) | **Critical (P1)** — same root cause class as Flow 5 but different mechanism (CRM uses HTTP RPC fallback, not the in-process singleton) | `curl -b jar -X POST -H 'Content-Type: application/json' -d '{"capability":"crm.create-contact","input":{"name":"Carol QA","email":"carol+qa@example.com","company":"Acme"}}' http://127.0.0.1:8080/dispatch/_agent-native/registry/rpc`; then same with `crm.log-outreach` |
| 7 | CRM → calendar chain — `crm.schedule-meeting` for the same contact | **FAIL** | `{"ok":false,"error":{"code":"handler_error","message":"FLUID_OS_TOKEN not set — cannot make cross-app RPC call from standalone template. Run via the fluid-os host (or set FLUID_OS_TOKEN to a dev token)."}}` — same blocker as Flow 6 | **Critical (P1)** | `curl -b jar -X POST -H 'Content-Type: application/json' -d '{"capability":"crm.schedule-meeting","input":{"contactId":"contact_FDpdR5qR0Q","title":"QA Sync","startsAt":1747700000000,"endsAt":1747703600000}}' http://127.0.0.1:8080/dispatch/_agent-native/registry/rpc` |
| 8 | Per-user isolation — create Bob, Bob calls `notes.list-notes` | PASS | Bob signup via `/dispatch/_agent-native/auth/signup` succeeded (`{"ok":true}` though without `Set-Cookie`); login via `/auth/login` returned cookie; Bob's `notes.list-notes` returned `{"ok":true,"output":{"notes":[]}}`; Alice's notes did not leak | — | (a) `curl -c bob.jar -X POST -d '{"email":"bob@qa-system.local","password":"demo1234","name":"Bob QA-System"}' /dispatch/_agent-native/auth/signup`; (b) login; (c) `notes.list-notes` |
| 9 | Persistence — kill dispatch's vite child, wait for respawn, verify Alice's notes survive | PASS | Pre-restart: 1 note (`RfyIC8ZKWMih`); killed PID 68963 at 08:24:51; gateway returned `{}` quickly on first probe (8s later) and dispatch PID 1808 respawned via `dev-lazy.ts`; post-restart: same note id `RfyIC8ZKWMih` returned by `notes.list-notes`, `owner_email = alice@demo.local`. Session cookie still valid (Better-Auth state is in SQL). | — | `kill 68963; for i in 1..12; do curl -m5 -b alice.jar /dispatch/_agent-native/auth/session; sleep 3; done`; then re-run `notes.list-notes` |
| 10 | Mail capability count post-fix | PASS | `/registry/capabilities` filtered by `appId == "mail"` → 37 capabilities (matches expected count from commit `67e96bd0` `@shared` alias fix) | — | `curl -b jar /dispatch/_agent-native/registry/capabilities | jq '[.capabilities[] | select(.appId == "mail")] | length'` |

### SHELL-LEVEL CHECKS

| # | Scenario | Result | Response | Severity (if fail) | Reproduction |
| --- | --- | --- | --- | --- | --- |
| 11 | All 13 templates return 200 on fresh probe of the root page | **FAIL** | Without follow-redirects: dispatch 302, calendar 200, mail 302, slides 200, forms 200, content 200, design 200, analytics 200, clips 302, **notes 500, tasks 500, crm 500, meetings 500**. With `-L` follow: 9/13 = 200, **4/13 still 500** (notes, tasks, crm, meetings). 302s on dispatch/mail/clips redirect to `/login` or signed-in shell — fine. The 500s reproduce on three consecutive probes spaced 5–8s apart, so it is not first-hit cold-boot. | **High (P2)** — the four newest templates have a regressed page-level SSR even though their API surfaces work | `for app in dispatch calendar mail slides forms content design analytics clips notes tasks crm meetings; do curl -sSL -b alice.jar -o /dev/null -w '%-12s %s\n' http://127.0.0.1:8080/$app; done` |
| 12 | `GET /dispatch/shell?app=calendar` returns shell layout HTML | PASS | HTTP 200, ~12 KB body, `<title>Dispatch — Workspace</title>`, full app shell with manifest/icons | — | `curl -sSL -b alice.jar 'http://127.0.0.1:8080/dispatch/shell?app=calendar'` |
| 13 | `GET /dispatch/manage-apps` returns management page | PASS | HTTP 200, ~12 KB body, `<title>Apps — Dispatch</title>`, references `manage-apps` route | — | `curl -sSL -b alice.jar http://127.0.0.1:8080/dispatch/manage-apps` |

### BONUS CHECK (verification of Flow 5 root cause)

| Scenario | Result | Notes |
| --- | --- | --- |
| Read tasks action source to confirm linkWarning origin | Confirmed | `templates/tasks/actions/create.ts:60-63` imports `@agent-native/dispatch/server`, calls `getCapabilityRegistry()`, and when it returns `null` sets `linkWarning = "capability registry not available"`. The registry is a process-local singleton (`packages/dispatch/src/server/plugins/capability-registry.ts:159–162` — `let activeRegistry: CapabilityRegistry | null = null`), so in the multi-process dev layout (tasks runs in its own lazy-spawned vite worker), the singleton is always null in any non-dispatch process. |

## Critical Findings

### Finding 1 (Critical, P1): Inter-app capability composition does not work in dev — affects every `alsoNote`-style and CRM-→-mail/calendar flow

**Symptom.** `tasks.create` with `alsoNote: true` creates the task but never the linked note; the response carries `linkWarning: "capability registry not available"` and `linkedNoteId: null`. `crm.log-outreach` and `crm.schedule-meeting` return `handler_error` with `FLUID_OS_TOKEN not set`.

**Root cause (verified in source).** The framework has two distinct in-process paths for inter-app calls and both fail in the dev configuration:
1. **In-process singleton (tasks → notes path).** `templates/tasks/actions/create.ts` imports `getCapabilityRegistry()` from `@agent-native/dispatch/server`. The registry is a process-local singleton inside the dispatch package. The dev gateway (`dev-lazy.ts`) spawns each template in its own vite worker, so `getCapabilityRegistry()` in the `tasks` worker always returns `null` — only the dispatch worker has the registry populated. The action gracefully degrades with a `linkWarning` instead of throwing, which is why the user-visible outcome is "task created without the linked note" rather than an error.
2. **HTTP RPC fallback (crm → mail/calendar path).** `templates/crm/server/lib/fluid-os-client.ts:66-73` (`callerFromEnv`) requires `process.env.FLUID_OS_TOKEN` to be set so it can issue authenticated HTTP RPC calls to the fluid-os host. The comment in that file explicitly says: _"For now this throws unless `FLUID_OS_TOKEN` is set (workspace dev mode pre-issues a session). Wiring up real per-user token mint will land with Phase 5's identity work — see docs/delivery/phase-5-*."_ No FLUID_OS_TOKEN is set in the running gateway environment.

**Impact.** Every advertised inter-app composition flow is non-functional in this dev configuration:
- `tasks.create` + `alsoNote` (advertised in `templates/tasks/CLAUDE.md` as a "load-bearing" feature).
- `meetings.finalize-transcript` → `tasks.create` (listed as a consumer in `templates/tasks/CLAUDE.md`).
- `crm.log-outreach` → `mail.send-email`.
- `crm.schedule-meeting` → `calendar.create-event`.
- Any other action that calls `dispatchCapability(...)` from a non-dispatch worker.

**Severity rationale.** The capability registry is the headline architectural feature of the os-shell branch (Phase 1, see FINAL-BREAKDOWN). Single-app capabilities work fine via the gateway's `/dispatch/_agent-native/registry/rpc` endpoint, but the composition story — the one that justifies having a registry rather than direct app-to-app HTTP — is silently broken in dev. Production behaviour depends on whether the deploy target colocates all templates in one process (in which case the singleton populates) or runs them separately (in which case it does not). This needs explicit confirmation from the Phase 1 design notes before claiming the registry works end-to-end.

**Reproduction.** `curl -b alice.jar -X POST -H 'Content-Type: application/json' -d '{"capability":"tasks.create","input":{"text":"x","alsoNote":true}}' http://127.0.0.1:8080/dispatch/_agent-native/registry/rpc`

### Finding 2 (High, P2): Notes / Tasks / CRM / Meetings page routes return HTTP 500 with `NitroViteError: No fetch handler exported from virtual:react-router/server-build`

**Symptom.** Three back-to-back fresh probes of `http://127.0.0.1:8080/{notes,tasks,crm,meetings}` (with Alice's session cookie, follow-redirects on) all return HTTP 500 with the error page `NitroViteError: No fetch handler exported from virtual:react-router/server-build`. The same templates serve `/_agent-native/auth/session`, `/_agent-native/registry/rpc`, and other API endpoints with HTTP 200. The other 9 templates (dispatch, calendar, mail, slides, forms, content, design, analytics, clips) return 200 on the root page.

**Apparent root cause.** This is the BLK-2 issue called out in `FINAL-BREAKDOWN.md` ("`NitroViteError: No fetch handler` on failed POSTs"), now showing up on the root GET as well for the four most-recently-promoted templates. The stack trace points into `node_modules/.../nitro/dist/runtime/internal/vite/dev-worker.mjs:82` and `packages/core/src/server/framework-request-handler.ts:285`, which indicates the React Router 7 SSR virtual module never registers its fetch handler when the template's framework plugin bootstraps. Notes was previously fixed in commit `6bace553` (added missing `auth.ts` + `agent-chat.ts` server plugins), but the same class of failure is back on the four newest templates today.

**Impact.** A signed-in user navigating directly to `/notes`, `/tasks`, `/crm`, or `/meetings` gets an error page. The agent's UI parity claim ("everything the UI can do, the agent can do") is half-broken: the agent can call the actions, but the UI to inspect the same data is not reachable.

**Reproduction.** `curl -sSL -b alice.jar -o /dev/null -w '%{http_code}\n' http://127.0.0.1:8080/notes` (returns 500). Repeat 3× with 5–8s between calls to confirm it is not first-hit lazy-boot.

### Finding 3 (Low, P3): Registry returns 23 apps, not the 13-template public set

**Symptom.** `/dispatch/_agent-native/registry/apps` enumerates every template directory in the workspace (`calls`, `images`, `issues`, `macros`, `meeting-notes`, `recruiting`, `scheduling`, `starter`, `videos`, `voice` are listed alongside the 13 public templates). FINAL-BREAKDOWN states only 13 templates serve HTTP 200; the registry surface does not match the public-list allow-list documented in the root `CLAUDE.md`.

**Impact.** Low — these capabilities are still callable through the RPC endpoint (any signed-in user can invoke them), and the registry endpoint is not the public template list. But it does mean the agent's tool surface inside dispatch will see ~652 capabilities from 23 apps including hidden ones, which contradicts the "strict allow-list" rule for the public template surface. Likely a documentation / scope clarification issue rather than a security bug — the apps are gated by per-user auth and access filters — but worth flagging.

**Reproduction.** `curl -b alice.jar http://127.0.0.1:8080/dispatch/_agent-native/registry/apps | jq '.apps | length'`

### Finding 4 (Low, P3 — spec drift, not a runtime bug): Brief uses `tasks.create-task`, runtime exposes `tasks.create`

**Symptom.** The QA-SYSTEM brief and parts of `docs/apps/*.md` reference `tasks.create-task`, but the live registry only exposes `tasks.create`. This matches the FINAL-BREAKDOWN note "Spec/code FQID drift in `docs/apps/*.md` — docs say `notes.create`, runtime is `notes.create-note`" — same class of issue in the opposite direction for tasks.

**Impact.** Low — runtime is canonical. Just a brief-vs-code naming mismatch.

## Notes Observed In Passing (not part of the scored flows)

- **Concurrent-agent activity.** Between Flow 4 (1 alice note) and the final sanity check at the end of the run, Alice's note count grew to 3 — QA-AUTH or QA-EXPLORE created two more notes for her during the run. Confirmed safe (same `ownerEmail`); flagged here so the persistence finding in Flow 9 isn't misread as "alice has multiple notes".
- **Schema split: `notes.list-notes` vs `tasks.list` response shape.** `notes.list-notes` returns `{ notes: [...] }`; `tasks.list` returns the array directly (`{ ok: true, output: [...] }`). Both contracts work; just inconsistent.
- **Better-Auth signup quirk.** `/auth/signup` succeeds (`{"ok":true}`) but does *not* set a session cookie — the client has to follow up with `/auth/login` to get one. Slightly surprising UX; not a blocker.
- **Dispatch DB is empty for app data.** The workspace shares a single SQLite at `.dev-data/workspace.db` across all templates. `packages/dispatch/data/app.db` only carries the auth tables (`user`, `session`, `account`, `member`, `organization`, ...). Confirmed alice's task / note / contact rows all live in workspace.db with `owner_email = alice@demo.local`.

## Files Referenced (absolute paths)

- `/Users/shashanksaxena/Documents/Personal/Code/fluid-system/templates/tasks/actions/create.ts` — lines 55–97 contain the `getCapabilityRegistry()` fallback that produces `linkWarning: "capability registry not available"`.
- `/Users/shashanksaxena/Documents/Personal/Code/fluid-system/packages/dispatch/src/server/plugins/capability-registry.ts` — lines 159–163 expose the process-local singleton.
- `/Users/shashanksaxena/Documents/Personal/Code/fluid-system/templates/crm/server/lib/fluid-os-client.ts` — lines 62–74 throw the `FLUID_OS_TOKEN not set` error.
- `/Users/shashanksaxena/Documents/Personal/Code/fluid-system/templates/tasks/CLAUDE.md` — advertises `tasks.create` + `alsoNote: true` as the load-bearing inter-app feature.
- `/Users/shashanksaxena/Documents/Personal/Code/fluid-system/templates/crm/CLAUDE.md` — explicitly states "**CRM owns contacts, deals, and activity history. It does NOT own email or calendar — it composes them.**"
- `/Users/shashanksaxena/Documents/Personal/Code/fluid-system/.dev-data/workspace.db` — the actual shared template database (8 MB) where `tasks_tasks`, `notes_notes`, `crm_contacts`, etc. live.
- `/Users/shashanksaxena/Documents/Personal/Code/fluid-system/docs/qa-reports/FINAL-BREAKDOWN.md` — pre-existing context that called out the BLK-2 NitroViteError as still open.
