# OS Shell — Workplan

Branch: `os-shell` (forked from `main` at `7ae9b50b` on 2026-05-16).

Owner: this branch is the integration ground for the `packages/fluid-os/` host
shell, persistence, AI provider integration, scaffolder validation, and a real
test scaffold. The workspace-mode shell at `127.0.0.1:8080` (dispatch + 10
templates with shared DB + Google SSO) is the **production-shaped** stack we
already have working. The fluid-os host at `127.0.0.1:4100` is the **OS
ecosystem layer** we are stabilising on this branch.

---

## Current state

### Working — verified end-to-end this session

1. **Workspace SSO** across 10 templates (dispatch, slides, mail, calendar,
   forms, content, analytics, clips, design, starter)
   - Shared `DATABASE_URL=file:.dev-data/workspace.db` across every
     `templates/*/.env.local`
   - Single `BETTER_AUTH_SECRET` minted once and propagated everywhere
   - Cookie name `an_session_workspace` (workspace-mode default, no per-app
     suffix)
   - Validated as both a local seeded user (`alice@demo.local`) and a real
     Google identity (`shash2577@gmail.com`)

2. **Google OAuth identity** wired across all 10 templates
   - `GOOGLE_CLIENT_ID` / `GOOGLE_CLIENT_SECRET` in every `.env.local`
   - Sign-in via Google works; identity propagates to every template
   - Per-app incremental scope grants work (calendar OAuth captured real
     calendar.readonly + calendar.events + contacts scopes for shash2577)

3. **Calendar Google integration** — live events from your Google Calendar
   render in `/calendar` after OAuth

4. **Mail Google integration** — token covers Gmail scopes (calendar consent
   set granted those too); rate-limited graceful UI ("Try again in 55s") from
   recent commit `2eb5064d`

5. **Slides "Saved versions" panel** from commit `1fd5856d` renders in the
   editor overflow menu (replaces older "Edit history"). Tied to
   `deck_versions` table + `list-deck-versions`/`get-deck-version`/
   `restore-deck-version` actions. Empty-state confirmed.

6. **Forms** — workspace-mode loop fixed (`templates/forms/app/routes/_index.tsx`)

7. **Clips** — `RequireActiveOrg` now supports opt-in `allowSkip`; "Skip for
   now" link unblocks the library without forcing org creation

8. **Extension security/race fixes** (commit `d2f1ff44`)
   - `unhideExtension` now calls `assertAccess("extension", id, "viewer")`
     (closes IDOR-shaped leak)
   - Duplicate save-swap-restore `captureCliOutput` deleted; replaced with the
     ALS-based version in `packages/core/src/server/cli-capture.ts`
   - Runtime-verified by hitting `extensions/sql/query` and seeing the
     correct rows come back

9. **Fluid OS host** (`packages/fluid-os/`) — `pnpm demo:server` on port 4100
   - 9 apps installed, 33 capabilities advertised
   - GET `/_fluid-os/apps` and `/_fluid-os/capabilities` discovery works
   - `POST /_fluid-os/auth/dev` issues a fixed `u_dev` cookie session
   - `POST /_fluid-os/auth/token` mints a per-app JWT
   - `POST /_fluid-os/rpc` dispatches capability invocations (validated with
     `notes.create`)
   - **Inter-app RPC** via `ctx.call(...)` works (`tasks.create` with
     `alsoNote: true` triggers `notes.create` under the hood, returns
     `linkedNoteId`)
   - **Identity propagation across inter-app boundary** — the note created on
     behalf of a user by the tasks app shows `ownerId == user.id`, NOT the
     calling app's id. This is the OS's central invariant and it holds.
   - **Multi-hop chain** verified end-to-end: `crm.log-outreach` returns a
     `messageId` from `mail.send-email`; `crm.schedule-meeting` returns an
     `eventId` from `calendar.create-event`; `calendar.list-events` then
     surfaces that event with attendees inherited from the CRM contact.

### Untested

- **User isolation in fluid-os** — `POST /_fluid-os/auth/dev` ignores the
  posted email/name and produces a fixed `u_dev`; to test isolation we either
  need real GitHub OAuth (`FLUID_OS_GITHUB_CLIENT_ID/_SECRET`) or programmatic
  JWT minting with the dev secret. Data-scoping code is correct by inspection.
- **Shell UI** at `http://127.0.0.1:4100/` — `dist/shell` is not built yet, so
  the root path serves nothing. The HTTP API is the only surface tested.
- **Scaffolder** at `POST /_fluid-os/scaffold` and `POST /_fluid-os/scaffold/suggest`
  — endpoints exist; not exercised.
- **Workspace dispatch occasionally hung after HMR reload** during the session;
  recovered by killing the dispatch child process. Not yet root-caused.

### Broken / open issues (with severity)

| # | Severity | Issue | Where |
| -- | -- | -- | -- |
| 1 | **P0** | All fluid-os apps use in-memory `Map<string, T>` in module scope. Restart the host → every note, task, contact, deal, message, event, recording is lost. Persistence is the immediate must-fix before any further serious testing. | `packages/fluid-os/examples/apps/*/manifest.ts` (all 9) |
| 2 | P1 | Mail app has no `list-sent` capability. `crm.log-outreach` returns a `messageId` but the message itself isn't observable to anyone except a re-dispatched call into the mail handler. Add `mail.list-sent` and persist sent messages. | `packages/fluid-os/examples/apps/mail/manifest.ts` |
| 3 | P1 | RPC server does not enforce `manifest.consumes`. An app can call any capability via `ctx.call(...)` regardless of what it declared. `consumes` currently functions as advisory documentation. | `packages/fluid-os/src/rpc/server.ts` |
| 4 | P2 | Workspace dispatch hangs intermittently after HMR reload from a core-package change. Symptoms: port 8092 stays bound but HTTP requests time out indefinitely. Workaround: kill PID, dev-lazy respawns it. | `scripts/dev-lazy.ts` watchdog or upstream Nitro env-runner |
| 5 | P2 | AWS root-user access key in `~/.aws/credentials`. Bedrock works but root credentials are widely discouraged. Out of scope for this session but recommended rotation to an IAM user/role with `AmazonBedrockReadOnly` + `bedrock:InvokeModel` scopes only. | `~/.aws/` (user infrastructure, not repo) |

---

## Workplan

### Phase 1 — Parallelizable (start now)

- **[P1A] Persistence layer** — replace in-memory `Map`s with SQLite-backed
  storage in every fluid-os app manifest. Path:
  - Schema file per app under `examples/apps/<app>/schema.ts` using Drizzle
  - Each manifest opens its own SQLite file under `.dev-data/fluid-os/<app>.db`
    (per-app DB keeps the OS architecture's "apps are independent" promise)
  - Migrations run on app install via the manifest's `init` hook (add a new
    optional `init(db)` field to `AppManifest`)
  - Each capability handler now reads/writes through `ctx.db` instead of the
    module-scope Map
  - Fixes P0 issue #1.

- **[P1B] Shell UI build** — run `pnpm --filter @agent-native/fluid-os build:shell`
  (compiles the React shell into `dist/shell/`). Restart host. Verify
  `http://127.0.0.1:4100/` renders the app picker, app-detail panes, sign-in
  UI, capability viewer. Capture screenshots.

- **[P1C] Amazon Bedrock provider** — wire Bedrock as an LLM provider:
  - AWS credentials already configured in `~/.aws/credentials` (root key
    flagged but functional)
  - Region pinned to `us-east-1` for Bedrock model availability
  - Find the LLM provider abstraction (likely in
    `packages/core/src/server/agent-chat-plugin.ts` or
    `packages/dispatch/src/server/`)
  - Add provider alongside Claude/OpenAI/Gemini/OpenRouter
  - Default model: `anthropic.claude-3-5-sonnet-20240620-v1:0` or whatever's
    available without further model access requests
  - Surface as a selectable provider in the Dispatch settings panel
  - Smoke-test from the dispatch agent composer

- **[P1D] Mail outbox** — folds into P1A. Persist sent messages to SQLite, add
  `mail.list-sent` and `mail.get-sent` capabilities, verify via
  `crm.log-outreach` → `mail.list-sent` round-trip.

- **[P1E] Scaffolder feature audit** — read `src/cli/create-app.ts`,
  `src/scaffold/template.ts`, and the `POST /_fluid-os/scaffold` server
  endpoint. Map out the create-app-from-template flow. Identify what the
  shell UI needs to expose. (Action item only — implementation in Phase 2.)

### Phase 2 — Sequential, depends on P1A + P1B

- **[P2A]** Restart fluid-os host with persistence + built shell on 4100
- **[P2B]** Re-run all 8 inter-app communication scenarios **in the browser
  via the shell UI** (not curl). Screenshots, pass/fail per scenario.
- **[P2C]** **Browser scenario: create new app from template** via the shell's
  scaffolder UI (per [P1E]). Verify the new app registers in the registry and
  can be invoked.
- **[P2D]** **Browser scenario: Bedrock-backed AI feature** — invoke an
  AI-driven capability (e.g. crm.draft-followup) routed through the Bedrock
  provider [P1C], verify the response renders.

### Phase 3 — Test scaffold (start as soon as P1A schema lands)

- **[P3A]** Vitest unit tests for each app's capabilities (per-app handler
  validation, identity propagation, persistence round-trips)
- **[P3B]** Integration suite that boots the host, exercises all 8 inter-app
  scenarios programmatically, asserts results
- **[P3C]** Executable runner — both a `bin/test-fluid-os.sh` CLI and a `/tests`
  page in the shell UI that triggers the same suite and displays pass/fail per
  scenario with response payloads.

### Phase 4 — Final review

- Commit everything. PR is optional (user's call).
- Final report: per-scenario screenshots, what passes, what regresses, what's
  still on the wishlist.

---

## Pivot triggers

If something in Phase 1 doesn't work, here's what we fall back to so we don't
get stuck. None of these require regressing prior work.

- **Persistence (P1A) can't fit cleanly**: drop the schema-per-app design and
  use a single shared `.dev-data/fluid-os.db` with one table per app namespaced
  by `app_id` prefix. Less faithful to the "apps are independent" promise but
  way simpler.
- **Shell UI (P1B) build fails or renders broken**: skip the shell entirely
  for Phase 2 testing, build a minimal HTML test harness at
  `packages/fluid-os/examples/test-harness.html` that wraps the same RPC calls
  we made via curl into clickable buttons. Same UX win, fraction of the work.
- **Bedrock (P1C) auth fails or model access is denied**: fall back to the
  framework's existing BYOK path (user pastes a Claude/OpenAI key into the
  dispatch settings panel). Bedrock becomes a future TODO.
- **Scaffolder (P1E) is half-built**: skip the create-app-from-template
  scenario in P2C and document the gap.
- **HMR-induced dispatch hang (issue #4) blocks repeated testing**: switch to
  `pnpm --filter <app> dev` per template, skipping the dev-lazy gateway.

---

## Not in scope for this branch

- Rotating the AWS root key (recommend it, but it's user infra)
- Pulling `origin/main` 5 commits ahead (will rebase when ready to ship)
- Capability-isolation enforcement (issue #3) — important but a separate piece
  of work; would gate every `ctx.call(...)` on the calling app's `consumes`
  list
- Real GitHub OAuth for fluid-os user isolation — defer until Phase 4 if at all

---

## Open questions for the user

1. Bedrock model choice — Claude 3.5 Sonnet via Bedrock, or do you want a
   different specific model id? Some models require requesting access per
   AWS account before they're invocable.
2. Persistence scope for fluid-os — per-app SQLite (default in plan) or one
   shared DB?
3. Do you want the fluid-os shell merged into the existing dispatch shell as
   another navigation layer, or kept as a separate origin at 4100?
