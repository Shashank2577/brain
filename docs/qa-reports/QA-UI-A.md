# QA-UI-A Report — BOOT FAILED

> **Status:** BOOT FAILED — dispatch shell never reaches a healthy state. All HTTP probes against `/dispatch` return **HTTP 500** with `TypeError: plugin is not a function` from Nitro `initNitroPlugins`. Zero of the planned mini-app happy-path scenarios could be exercised end-to-end. This is a **Blocker** for Phase 9.

---

## Test environment

| Item | Value |
| ---- | ----- |
| Repo | `/Users/shashanksaxena/Documents/Personal/Code/fluid-system` |
| Branch | `os-shell` (`HEAD = c2526661`) |
| Workspace gateway URL | `http://127.0.0.1:8080` |
| Default dispatch URL | `http://127.0.0.1:8080/dispatch` |
| Dispatch backend URL | `http://127.0.0.1:8092` (lazy-spawned) |
| Test user (planned) | `alice@demo.local` / `demo1234` |
| Dev script | `pnpm dev:lazy` → `node scripts/dev-lazy.ts` |
| Browser | Chrome (claude-in-chrome MCP) |
| Workspace DB | `.dev-data/workspace.db` — never created (boot failed before app code ran) |
| Dev log | `/tmp/fluid-dev.log` (full log preserved); last 80 lines also at `docs/qa-reports/QA-UI-A-fluid-dev-tail.log` |
| QA run date | 2026-05-16 |

---

## Top-level finding

**Blocker — dispatch's Nitro app cannot initialize.** Every request through the workspace gateway to `/dispatch` (and any path proxied through dispatch) returns HTTP 500 rendering Nitro's built-in error page. The root error is:

```
TypeError: plugin is not a function
    at initNitroPlugins (.../nitro/dist/runtime/internal/app.mjs:121:4)
    at useNitroApp     (.../nitro/dist/runtime/internal/app.mjs:19:3)
```

Visual evidence: the in-browser dispatch page renders only Nitro's red "An error has occurred — plugin is not a function" stack-trace shell. The left-rail, iframe content area, and agent sidebar are never mounted.

### Root cause (high confidence)

The dispatch template `templates/dispatch/server/plugins/` re-exports Nitro plugins from the built dispatch package:

```ts
// templates/dispatch/server/plugins/tests-runner.ts
export { dispatchTestsRunnerPlugin as default } from "@agent-native/dispatch/server";

// templates/dispatch/server/plugins/mobile-auth.ts
export { dispatchMobileAuthPlugin as default } from "@agent-native/dispatch/server";
```

The matching named exports exist in **`packages/dispatch/src/server/index.ts`** (source):

```ts
export { default as dispatchTestsRunnerPlugin } from "./plugins/tests-runner.js";
export { default as dispatchMobileAuthPlugin,  buildMobileTokenHandler } from "./plugins/mobile-auth.js";
```

…but those exports are **missing from the built `packages/dispatch/dist/server/index.js`**:

```
$ ls packages/dispatch/dist/server/plugins/
agent-chat.js  auth.js  capability-registry.js  core-routes.js  db.js  integrations.js
# (no tests-runner.js, no mobile-auth.js)

$ grep -E "tests-runner|mobile-auth" packages/dispatch/dist/server/index.js
# (no matches)
```

So when Nitro auto-loads the dispatch template plugins, those two `export default` re-exports resolve to `undefined`. Nitro's `initNitroPlugins` then runs `undefined(app)` and dies with "plugin is not a function". The error stops Nitro before any of the working plugins (`auth`, `agent-chat`, `db`, `capability-registry`, `core-routes`, `integrations`, `setup-dispatch`) can run.

The dispatch dist appears to be stale relative to source — `tests-runner.ts` (Phase 7) and `mobile-auth.ts` (Phase 8) were added to source but never made it into the published `dist/`. `pnpm dev:lazy` ran the prebuild script (`pnpm --filter @agent-native/core build`) but did **not** rebuild `@agent-native/dispatch`, so the stale `dist/` is what's loaded at runtime.

### Why this affects QA

This single error means:

- The dispatch shell never serves a page → cannot sign in, cannot see rail, cannot reach any iframe.
- Every gateway path that proxies to dispatch returns 500 (e.g. `/notes` returned 500 in my probe).
- Lazy-spawned mini-app backends (calendar/forms/meetings/etc.) finished migrations and look healthy in their own logs, but they cannot be reached through the shell. Direct port probes (`127.0.0.1:8082..8104`) all return `000` — the lazy gateway only spawns those processes when a request arrives, and the dispatch failure means nothing routes to them.
- `_agent-native/registry/*` endpoints return 404 through the gateway (because the dispatch backend that hosts the registry is 500'ing).

### Secondary finding (would surface once boot is fixed)

The mail capability registry boot logs ~16 `Cannot find module '@shared/markdown.js'` errors. Affected actions: `archive-email`, `cancel-scheduled-email`, `find-contact`, `get-email`, `get-thread`, `list-emails`, `mark-read`, `move-email`, `respond-calendar-invite`, `search-emails`, `send-email`, `send-queued-drafts`, `send-scheduled-email-now`, `star-email`, `trash-email`, `view-screen`. The chain is `mail/actions/*.ts → templates/mail/server/lib/google-auth.ts → @shared/markdown.js` (with `jobs.ts` and `handlers/emails.ts` on the same broken chain). None of these will register as capabilities until the import is resolved, so every mail flow in QA-API-A's matrix will also fail. This does not crash dispatch — the capability-registry try-catches around each import — but it will fail QA-API-A "capability count match" and every cross-app workflow that hits mail in QA-UI-B / QA-API-B.

---

## Reproduction

```bash
cd /Users/shashanksaxena/Documents/Personal/Code/fluid-system
git checkout os-shell                      # already on os-shell
pnpm dev:lazy > /tmp/fluid-dev.log 2>&1 &  # start gateway + lazy backends
curl -s -o /dev/null -w "%{http_code}\n" --max-time 15 http://127.0.0.1:8080/dispatch
# expected: 200 or 302 (redirect to /auth/signin)
# actual:   500
```

In Chrome, navigating to `http://127.0.0.1:8080/dispatch` renders the Nitro red error page:

> **TypeError — An error has occurred — plugin is not a function**
> Stack-trace top frame: `initNitroPlugins` at `node_modules/.pnpm/nitro@3.0.260415-beta_.../nitro/dist/runtime/internal/app.mjs:121:4`

(See the recorded screenshot via the claude-in-chrome MCP — screenshot id `ss_6813oedp5` captured during this run on tab `654414980`. The screenshot is referenced by tool-result image only; no on-disk copy was created.)

### Suggested fix (advisory — out of scope for QA)

```bash
pnpm --filter @agent-native/dispatch build
# or, if turborepo-style: pnpm -r build
```

…and ensure `pnpm dev:lazy`'s prebuild step (currently `pnpm --filter @agent-native/core build` only) also builds dispatch (and likely other framework packages such as `@agent-native/fluid-os`).

---

## Scenarios tested

The full scenario matrix that was planned for this agent is below. Every UI scenario is **BLOCKED** because the dispatch shell never serves a page.

| # | Scenario | Mini-app | Result | Severity | Screenshot | Notes |
| - | -------- | -------- | ------ | -------- | ---------- | ----- |
| 0 | Boot dev server (`pnpm dev:lazy`) | shell / framework | **FAIL** | **Blocker** | error page captured via MCP `ss_6813oedp5` | dispatch 500s; see "Top-level finding" |
| 1 | Sign in at `/dispatch` | shell / auth | **BLOCKED** | Blocker | — | dispatch never reaches auth/signin route — 500 short-circuits before routing |
| 2 | Click rail icons; iframe updates < 1 s; tooltips + active state | shell | **BLOCKED** | Blocker | — | rail never mounts (page 500) |
| 3 | `Cmd+1` … `Cmd+9` keyboard shortcuts | shell | **BLOCKED** | Blocker | — | shell never mounts |
| 4 | Deep link `?app=calendar&path=/booking/abc` | shell | **BLOCKED** | Blocker | — | shell never mounts |
| 5 | Switch apps + refresh → active app + URL persists | shell | **BLOCKED** | Blocker | — | shell never mounts |
| 6 | Persistent agent sidebar across app switches | shell | **BLOCKED** | Blocker | — | shell never mounts |
| 7 | Dispatch happy path (overview render, no console errors) | dispatch | **BLOCKED** | Blocker | — | page renders Nitro error instead of dispatch overview |
| 8 | Calendar — open, create event, edit, delete | calendar | **BLOCKED** | Blocker | — | unreachable through gateway |
| 9 | Mail — open, draft, edit, archive | mail | **BLOCKED** | Critical (also dependent on `@shared/markdown.js` capability-registry fix) | — | unreachable through gateway; capability registry also missing all mail actions (see secondary finding) |
| 10 | Slides — open, create deck, edit slide, delete | slides | **BLOCKED** | Blocker | — | unreachable through gateway |
| 11 | Forms — open, create form, edit, delete | forms | **BLOCKED** | Blocker | — | unreachable through gateway |
| 12 | Content — open, create page, edit, delete | content | **BLOCKED** | Blocker | — | unreachable through gateway |
| 13 | Design — open, create design, edit, delete | design | **BLOCKED** | Blocker | — | unreachable through gateway |
| 14 | Analytics — open, create dashboard, edit, delete | analytics | **BLOCKED** | Blocker | — | unreachable through gateway |
| 15 | Clips — open, create recording, edit, delete | clips | **BLOCKED** | Blocker | — | unreachable through gateway |
| 16 | Notes — open, create note, rename, delete | notes | **BLOCKED** | Blocker | — | unreachable through gateway; gateway returned 500 on direct `/notes` probe |
| 17 | Tasks — open, create task, edit, delete | tasks | **BLOCKED** | Blocker | — | unreachable through gateway |
| 18 | CRM — open, create contact, edit, delete | crm | **BLOCKED** | Blocker | — | unreachable through gateway; crm backend itself migrated cleanly per logs |
| 19 | Meetings — open, create meeting, edit, delete | meetings | **BLOCKED** | Blocker | — | unreachable through gateway |

---

## Critical findings

### F-1 — Dispatch Nitro boot fails on every request (Blocker)

- **Symptom:** `GET /dispatch` returns HTTP 500. In-browser the dispatch URL renders Nitro's red "An error has occurred — plugin is not a function" page (TypeError) with a deep Vite/Nitro stack trace.
- **Repeats:** Every request — there is no recovery. 95 distinct "TypeError: plugin is not a function" entries in the dev log within the first 60 seconds of boot.
- **Root cause (high confidence):** The dispatch template auto-loads `templates/dispatch/server/plugins/tests-runner.ts` and `templates/dispatch/server/plugins/mobile-auth.ts`. Both re-export the default from `@agent-native/dispatch/server`. The corresponding named exports exist in source (`packages/dispatch/src/server/index.ts` exports `dispatchTestsRunnerPlugin` and `dispatchMobileAuthPlugin`), but neither the built `packages/dispatch/dist/server/index.js` nor `dist/server/plugins/` contains them. Result: the re-exports resolve to `undefined`, and Nitro's `initNitroPlugins` throws when it calls `undefined(app)`.
- **Reproduction:** see "Reproduction" section above.
- **Suggested fix:** Rebuild `@agent-native/dispatch` (e.g. `pnpm --filter @agent-native/dispatch build` or `pnpm -r build`). Optionally extend `scripts/dev-lazy.ts`'s prebuild step (currently `pnpm --filter @agent-native/core build`) to also include dispatch and any other internal framework packages that templates re-export from.

### F-2 — Mail capability registry imports fail at boot (Critical)

- **Symptom:** Dispatch's capability registry logs 16 distinct `Failed to import` lines for `templates/mail/actions/*.ts` files. Each one traces to `Cannot find module '@shared/markdown.js' imported from 'templates/mail/server/lib/google-auth.ts'` (with a couple of variants pointing at `lib/jobs.ts` and `handlers/emails.ts`).
- **Affected actions (all unregistered):** `archive-email`, `cancel-scheduled-email`, `find-contact`, `get-email`, `get-thread`, `list-emails`, `mark-read`, `move-email`, `respond-calendar-invite`, `search-emails`, `send-email`, `send-queued-drafts`, `send-scheduled-email-now`, `star-email`, `trash-email`, `view-screen`.
- **Impact:** All `mail.*` capabilities will be missing from `/_agent-native/registry/capabilities`. Every QA-UI-B cross-app flow that goes through mail (CRM → "Log outreach" → send email → assert in Mail Sent tab) will fail at the capability-resolution step. Every QA-API-A mail-action probe will fail. Authorization-matrix tests against mail will be unrunnable.
- **Note:** This is not what crashed dispatch — `capability-registry.ts` `try/catch`es around each action import so missing actions just log and continue. Mail capability registry would still be broken even if F-1 were fixed.
- **Suggested fix:** Either resolve the `@shared/markdown.js` alias for the mail template (likely a missing `paths` entry in `templates/mail/tsconfig.json` or a missing `markdown.ts/.js` file in the workspace's `shared/` directory), or convert the imports to a concrete path.

### F-3 — Lazy mini-app backends never become directly reachable (Medium — by design, but worth noting)

- **Symptom:** `127.0.0.1:8082..8104` all return `000` (connection refused) until something requests them through the gateway. This is the documented behaviour of `dev:lazy`, but combined with F-1 it means no mini-app is reachable at all (gateway proxies all 500, which never causes the lazy backends to spawn cleanly for end-to-end testing).
- **Suggested fix:** Document this clearly for future QA agents; alternatively offer a `pnpm dev` (eager) mode QA can use to validate mini-apps even when dispatch is broken.

---

## Console errors / warnings

The browser tab at `127.0.0.1:8080/dispatch` only shows Nitro's static error HTML — no application JS executes, so there are no app-level console errors to capture. The captured errors are all server-side (Nitro stderr) and are listed above.

For completeness, the dev log (`/tmp/fluid-dev.log`) contained:

- 95 × `TypeError: plugin is not a function` (every request to dispatch)
- ~30 × `NitroViteError: Vite environment "nitro" is unavailable` with `status: 503` — these came from the gateway proxying requests during the brief window where the Nitro dev worker was reloading after each plugin crash.
- 16 × `[capability-registry] Failed to import mail/<action>.ts: Cannot find module '@shared/markdown.js'` — see F-2.

The last 80 lines of the dev log are saved at: `docs/qa-reports/QA-UI-A-fluid-dev-tail.log`.

---

## Summary

| Outcome | Count |
| ------- | ----- |
| Pass | 0 |
| Fail | 1 (F-1 — dev server boot) |
| Blocked | 19 (every planned UI scenario) |
| Skipped | 0 |

**Qualitative assessment:** The QA-UI-A pass for the `os-shell` branch is effectively un-runnable in its current state. A single root-cause issue — the published `packages/dispatch/dist/server/index.js` not exporting the two newest Nitro plugins (`dispatchTestsRunnerPlugin`, `dispatchMobileAuthPlugin`) that the dispatch template re-exports — crashes the dispatch Nitro app at every request. Because dispatch is the workspace gateway's default destination *and* the registry host, the entire user-facing shell, every iframed mini-app, and every cross-app RPC is unreachable. Fixing this is almost certainly a one-line rebuild step (`pnpm --filter @agent-native/dispatch build` or equivalent), after which the QA-UI-A scenarios in this report should be re-run from scratch. Secondary issue F-2 (`@shared/markdown.js` resolution in the mail template) blocks all mail capabilities even after F-1 is resolved and should be fixed in the same pass; QA-API-A will hit it again otherwise.

I am leaving the `pnpm dev:lazy` process running per the instructions so the other four QA agents can use it. They will see the same boot failure, so coordinating one fix-and-restart between them is the efficient path forward.
