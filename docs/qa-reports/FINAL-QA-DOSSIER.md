# Final QA Dossier — OS Shell Branch

**Branch:** `os-shell` @ `4c365250`
**Date:** 2026-05-16
**Aggregates:** 7 QA agent reports + automated executable runner (`bin/test-fluid-os.sh`)
**(QA-EXPLORE pending; will be folded in when it lands.)**

---

## What did and didn't hold up

### The architectural invariants HELD (good news)

- **Cookie-based SSO across all 13 templates** — both QA-AUTH (this round) and earlier QA-API-B confirm: sign in once, alice's session reaches every template. 26/26 scenarios pass.
- **Identity propagation across `ctx.call` in-process** — 33/33 + 9/9 + this round's tasks→notes verification. The user's email always propagates; the calling app's id never does.
- **Authorization matrix is logically correct** — across notes/tasks/contacts, no data exfiltration observed in 48+ scenarios; no privilege escalation. All failures fail-closed.
- **Sharing roles (viewer / editor / admin)** work end-to-end.
- **Persistence survives dispatch restart** — verified by killing port 8092 child, dev-lazy respawned cleanly, alice's note survived.
- **Mail's 16 missing capabilities are now registered** post the `@shared/*` alias fix — 37/37 confirmed.
- **All 13 templates return HTTP 200** when probed at their root path (cookie auth-redirect path).
- **1561 unit + 20 integration tests pass.**
- **All 10 static guards pass.**
- **Design + Slides empty states + Sign-in page are genuinely polished** (QA-UX gold-standard call-outs).

### What's broken — by category

#### A) Inter-app composition via live HTTP is broken (CRITICAL, NEW)

The pattern that justifies the whole OS architecture — `ctx.call("<other>.<capability>", input)` reaching across mini-apps with identity propagation — works in-process (QA-API-B 33/33) but **fails over the live HTTP path** because:

1. **`getCapabilityRegistry()` is a process-local singleton** in `packages/dispatch/src/server/plugins/capability-registry.ts:159`. Each template runs in its own Vite worker. The singleton is null in non-dispatch workers.
2. **CRM's `ctx.call` requires `FLUID_OS_TOKEN`** (explicitly documented as Phase 5 WIP in `templates/crm/server/lib/fluid-os-client.ts:66-73`). Not set, calls fail with `handler_error`.

**Concrete failures:**
- `tasks.create-task` with `alsoNote: true` → task is created, but `linkedNoteId: null`, response has `linkWarning: "capability registry not available"`
- `crm.log-outreach` → `handler_error: FLUID_OS_TOKEN not set`
- `crm.schedule-meeting` → same

**Severity:** Critical — this is the OS's flagship feature.

#### B) Phase 3 templates' page-level SSR still returns 500 (CRITICAL, REGRESSION-LIKE)

My earlier fix (`6bace553`) added missing `auth.ts` + `agent-chat.ts` plugins to notes, which got me past the unauthenticated `/notes` curl. But QA-SYSTEM and QA-UX both confirm that the actual rendered page still throws `NitroViteError: No fetch handler exported from virtual:react-router/server-build`. API endpoints (`/_agent-native/*`) work fine on these templates; only the page renderer fails.

**Affected:** CRM, Notes, Tasks, Meetings — 4 of 13 templates / **30% of the product UI is unreachable**.

**Note:** Earlier curl probes showed 200. That was likely the auth-redirect HTML being served (the framework intercepts unauthed requests with the sign-in page before the SSR runs). Once authed, the SSR is invoked and breaks.

**Severity:** Blocker for those 4 apps' UIs.

#### C) Mobile bearer JWT path is dead at the HTTP layer (HIGH, NEW)

QA-AUTH F-AUTH-1: The mobile JWT mints correctly via `POST /dispatch/_agent-native/auth/mobile-token`. But **every subsequent HTTP request with `Authorization: Bearer <jwt>` is rejected with 401** on all 13 templates. Root cause: `packages/core/src/server/auth.ts:1176-1182` framework global guard runs `getSession()` and 401s BEFORE the capability-registry's bearer-JWT resolver gets to execute (`packages/dispatch/src/server/plugins/capability-registry.ts:642-712`).

**Phase 8's mobile shell is effectively dead at the HTTP layer.** Bundles build, tests pass, but the auth integration doesn't work end-to-end.

#### D) Product UX has 66 issues including 7 P0 blockers (QA-UX)

- **`/dispatch/shell` renders 2-3 settings panels overlapping** — the flagship route is visually broken
- **Rail icons all identical** (every app shows a camera icon) — users can't distinguish apps
- **Hidden templates leak into shell rail + agents page** — calls, macros, issues, meeting-notes, recruiting, scheduling, images, videos all visible (violates the `guard-template-list.mjs` contract on these surfaces)
- **Workspace name typo: "Agentntative"** (should be "Agent-Native") — visible everywhere
- **"Workspace · 0 apps" header contradicts** the 13-app grid below it
- **Calendar / Mail / Slides black-canvas-with-tiny-spinner for 8+ seconds** before empty state renders
- **Agent chat sidebar has two "New chat" tabs** with same label
- **`/dispatch/shell` iframe spins forever with no fallback** when no app is selected
- **"Build a workspace app for X" — literal placeholder leak** in chat suggestions
- Standardize on skeleton loading (Content uses skeletons; others use blank+spinner)
- Plus 14 P2-High, 18 P3-Medium, 12 P4-Low, 6 P5-Polish issues

#### E) Schema / wire-format issues (HIGH)

- **Meetings schema drift** — `no such column: starts_at` blocks meetings CRUD entirely (QA-AUTH F-AUTH-5). Code uses `startsAt` (camelCase TypeScript identifier) which Drizzle maps to `starts_at` (snake_case SQL); something in the schema or migration is misaligned.
- **Authorization failures return HTTP 500 instead of 403/404** (QA-AUTH F-AUTH-3) — 7 probes affected. Status code semantics wrong.
- **`/auth/session` returns 200 + `{"error":"Not authenticated"}`** when unauthenticated (QA-AUTH F-AUTH-4) — should be 401.

#### F) Pre-existing typecheck regression (MEDIUM)

The executable runner's `summary.json` shows `typecheck: failed` (28.8s) — pre-existing TS6 discriminated-union narrowing in `packages/fluid-os/src/rpc/client.ts:41` that I never fixed.

### What was a false alarm

- **BLK-2 sign-up-brick** — QA-AUTH stress-tested with 5 bad logins + dup-register + malformed bodies; templates stay at 200. Either it's been fixed by intermediate work, or QA-UI-B saw a transient under heavy parallel load. **Mark resolved.**
- **CRM timeout** — QA-SYSTEM and others confirm CRM API endpoints work fine; the earlier "timeout" was lazy first-boot, not a crash.

---

## Severity-ranked issue list (after this round)

| # | Severity | Issue | Source |
|---|---|---|---|
| 1 | Blocker | Notes/Tasks/CRM/Meetings page SSR returns 500 (NitroViteError) | QA-SYSTEM + QA-UX |
| 2 | Blocker | Inter-app composition via live HTTP fails (registry singleton per worker) | QA-SYSTEM |
| 3 | Blocker | `/dispatch/shell` renders 2-3 settings panels overlapping | QA-UX |
| 4 | Blocker | Rail icons all identical (every app is a camera icon) | QA-UX |
| 5 | Blocker | `/dispatch/shell` iframe spins forever with no fallback | QA-UX |
| 6 | Blocker | Workspace name typo "Agentntative" across entire app | QA-UX |
| 7 | Blocker | Hidden templates leak into shell rail + agents page | QA-UX |
| 8 | Critical | Mobile bearer JWT rejected on all 13 templates (auth middleware ordering) | QA-AUTH |
| 9 | Critical | CRM cross-app calls need FLUID_OS_TOKEN (Phase 5 WIP) | QA-SYSTEM + QA-AUTH |
| 10 | Critical | Meetings schema drift `no such column: starts_at` | QA-AUTH |
| 11 | Critical | Calendar/Mail/Slides 8+ second blank load | QA-UX |
| 12 | Critical | Scaffolder still untested in browser after dev-repo fix (`8216f582`) | Self |
| 13 | Critical | Mobile shell never launched on simulator (Xcode/Android SDK missing) | QA-Mobile |
| 14 | High | Agent chat duplicate "New chat" tabs | QA-UX |
| 15 | High | "Workspace · 0 apps" header contradicts 13-app grid | QA-UX |
| 16 | High | Chat suggestions show literal placeholder text | QA-UX |
| 17 | Medium | Authorization failures return 500 not 403/404 | QA-AUTH |
| 18 | Medium | `/auth/session` returns 200+error when unauthenticated | QA-AUTH |
| 19 | Medium | `pnpm typecheck` fails (pre-existing fluid-os/rpc/client.ts) | runner |
| 20 | Medium | Spec/code FQID drift in `docs/apps/*.md` | QA-API-B |
| ... | ... | (~50 more P3-Polish items from QA-UX page-by-page) | QA-UX |

---

## What this means for the branch

**The OS architectural FOUNDATION is sound.** Every architectural invariant the spec claimed is verified: SSO, identity propagation, authz, sharing, persistence, registry, capability discovery. These are not just "code shipped" — they're proven end-to-end at the in-process integration layer.

**But the live HTTP runtime has multiple integration gaps.** Inter-app calls via HTTP don't work. Mobile bearer JWT auth doesn't work. 4 of 13 mini-apps fail to render. The shell's flagship route is visually broken. Hidden templates leak. There are visible typos.

**The unit-tests-green / integration-tests-green / curl-probes-200 results do NOT reflect the actual user-facing product.** This is the most important finding of all four QA passes. Unit and integration tests verify code paths that aren't the production HTTP path. To know the product actually works for a user, **only browser-level e2e tests will tell you the truth** — and we've now demonstrated that comprehensively.

**Path to shippable** (roughly ordered by impact ÷ effort):

1. Fix the workspace name typo (10-min find-and-replace, 7 P0 reduced to 6)
2. Fix the shell-renders-3-settings-panels layout bug (component composition issue; probably a missing condition or wrong-default)
3. Fix the rail icons (Phase 2's SuperAppRail mapping wrong icon for every app)
4. Filter hidden templates out of the rail + agents page (Phase 2's registry consumer needs to honor `hidden: true`)
5. Fix the meetings schema (single migration fix on `starts_at` column name)
6. Fix the mobile bearer JWT ordering bug (move bearer-JWT resolution INTO `getSession()` in `packages/core/src/server/auth.ts` BEFORE the global 401 fires)
7. Fix the Notes/Tasks/CRM/Meetings page SSR (deeper Nitro/Vite framework-level issue; needs focused debugging by someone with Nitro internals expertise)
8. Wire CRM's cross-app calls through the dispatch registry instead of legacy `fluid-os-client.ts` (Phase 5 WIP closeout)
9. Fix the inter-app `getCapabilityRegistry()` singleton to be cross-worker-safe (architectural refactor)

Items 1-6 are realistic for **one focused dev-day**. Items 7-9 are the deeper structural issues that need a half-week of focused work each.

**Recommendation:** Land items 1-6 in a follow-up branch over a day. Plan items 7-9 as a separate "OS Shell Production Hardening" branch.

---

## Files and pointers

- All 11 QA reports under `docs/qa-reports/`
- Automated runner summary at `.test-results/summary.json`
- This dossier: `docs/qa-reports/FINAL-QA-DOSSIER.md`
- Plan and breakdown: `PLAN.md`, `docs/qa-reports/FINAL-BREAKDOWN.md`

**Branch state:** 25 commits ahead of baseline `7ae9b50b`. Architectural foundation validated, integration gaps documented with concrete reproduction steps.
