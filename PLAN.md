# OS Shell — Executive Plan

Branch: `os-shell` (forked from `main` at `7ae9b50b` on 2026-05-16).

This file is the executive summary of the work plan. **The detailed spec ecosystem lives in [`docs/`](docs/)** — read [`docs/README.md`](docs/README.md) to navigate.

## What we're building

A **unified super-app** combining all the workspace's mini-apps into one shell. One left rail, one persistent agent sidebar, one signed-in identity, real persistence, inter-app communication via a typed capability registry, scaffolder for creating new mini-apps, AWS Bedrock as an LLM provider, and a mobile-foundation-ready architecture.

See [`docs/architecture/00-overview.md`](docs/architecture/00-overview.md) for the system architecture and [`docs/requirements/BRD.md`](docs/requirements/BRD.md) / [`PRD.md`](docs/requirements/PRD.md) / [`TRD.md`](docs/requirements/TRD.md) for the requirements set.

## Current state (codified, not aspirational)

What's already working as of this branch:

- Workspace SSO across 10 templates with shared SQLite DB + shared `BETTER_AUTH_SECRET`
- Google OAuth identity (live-validated with `shash2577@gmail.com`)
- Per-template Google scope grants (calendar fetches real events end-to-end)
- Fluid OS host on port 4100 with 9 manifest-only apps + capability registry + RPC + inter-app calls + identity propagation across `ctx.call(...)` (validated with 7/8 scenarios passing)
- Slides "Saved versions" panel from commit `1fd5856d`
- Forms workspace-mode redirect loop fixed
- Clips "Skip for now" option on org wall
- Extensions: `unhideExtension` access check + ALS-based `captureCliOutput` race fix

What's broken / open:

- **P0: All fluid-os manifest apps use in-memory `Map<string, T>` — data lost on restart.** Fixed by Phase 3 promoting them to full templates with shared DB persistence.
- P1: Mail has no `list-sent` capability; sent messages not observable. Fixed by Phase 3 mail template having a proper outbox table.
- P1: RPC server doesn't enforce manifest `consumes` whitelist; apps can call anything. Phase 4+ work (advisory for now).
- P1: Two parallel scaffolders exist (`fluid-os/cli/create-app.ts` and `core/cli/create.ts`). Reconciled in Phase 6.
- P2: Dispatch occasionally hangs after HMR. Worked around by killing the PID.

## Phased plan

| Phase | Goal | Detail |
|---|---|---|
| **1** | Move capability registry + RPC into dispatch as a plugin; auto-derive from `actions/` | [phase-1](docs/delivery/phase-1-backend-foundation.md) |
| **2** | Dispatch shell with left rail + iframe + persistent agent sidebar | [phase-2](docs/delivery/phase-2-web-shell.md) |
| **3** | Scaffold notes / tasks / CRM / meetings as full templates (with UIs) | [phase-3](docs/delivery/phase-3-mini-app-promotion.md) |
| **4** | Kill `:4100` host; reduce `packages/fluid-os/` to a library | [phase-4](docs/delivery/phase-4-cleanup.md) |
| **5** | Amazon Bedrock as a first-class LLM provider | [phase-5](docs/delivery/phase-5-bedrock.md) |
| **6** | Scaffolder wired into dispatch "Create app" flow | [phase-6](docs/delivery/phase-6-scaffolder.md) |
| **7** | Test scaffolding — unit + integration + e2e + executable runner + `/tests` page | [phase-7](docs/delivery/phase-7-tests.md) |
| **8** | Mobile shell foundation in `packages/mobile-app/` | [phase-8](docs/delivery/phase-8-mobile-foundation.md) |
| **9** | Final multi-agent QA sweep | [phase-9](docs/delivery/phase-9-final-qa.md) |

## Architecture decisions

Six load-bearing decisions, captured as ADRs:

- [ADR-001](docs/decisions/ADR-001-mini-app-must-have-ui.md) — Every mini-app must have a UI
- [ADR-002](docs/decisions/ADR-002-iframe-content-area.md) — Web shell uses iframes (reversible, not architecturally load-bearing)
- [ADR-003](docs/decisions/ADR-003-shared-workspace-database.md) — One shared workspace DB
- [ADR-004](docs/decisions/ADR-004-capability-registry-in-dispatch.md) — Capability registry + RPC live in dispatch
- [ADR-005](docs/decisions/ADR-005-bedrock-as-llm-provider.md) — Bedrock as a first-class provider
- [ADR-006](docs/decisions/ADR-006-mobile-foundation-strategy.md) — Mobile foundation: lock API, defer UI tech

## Agent team (this autonomous run)

The user authorised up to 20 parallel agents. Standing advisor roles (consulted per phase gate):

| Role | When consulted |
|---|---|
| **Architect** | ADR reviews, technical-disagreement adjudication, regression triage |
| **Product Owner** | Scope tradeoffs, what's a blocker vs ship-with-known-issue |
| **Researcher** | Code archaeology, prior-art lookup |
| **Product Engineer** | Implementation lead (multiple in parallel per phase) |
| **UX Engineer** | UI / accessibility / component patterns |

Plus phase 9's QA agent team: 2 UI agents (different scenarios), 2 API agents (registry + auth matrix), 1 DB agent (persistence + integrity).

## Commit cadence

Each phase produces a commit on `os-shell` prefixed with `[P<n>]`. Spec changes folded into the same commit as the implementation that triggered them. No stash, no force-push, no rebasing of merged history.

## Pivot triggers

Each phase doc has a "Pivot triggers" section. Top-level pivots that affect the whole branch:

- **If Phase 1 reveals the action-discovery approach can't ship cleanly:** fall back to per-template explicit `register-capabilities()` calls instead of auto-discovery.
- **If Phase 2 iframe-based shell has unfixable problems:** fall back to full React-Router-tree merge (one Vite build encompassing all templates). Bigger refactor, single SPA. Defer to a v2 branch.
- **If Phase 5 Bedrock can't be enabled in time:** ship without Bedrock; existing providers cover the agent chat.
- **If Phase 8 mobile shell can't reach the acceptance bar:** ship the bearer-token auth API change anyway (it's framework-level) and defer the mobile shell to a follow-up branch. The architecture is still proven by the API contract.

## What's NOT in scope for this branch

- Pulling `origin/main` (5 commits ahead with PR #1 fluid-os merge) — rebased when ready to ship
- Public marketplace for community mini-apps
- Multi-tenant deployment / per-org sharded DBs
- Native mobile per-mini-app UIs (foundation only — see ADR-006)
- Capability isolation (enforced `consumes` whitelist) — advisory in v1
- Workspace dispatch HMR hang root-cause investigation (worked around)
- AWS root-key rotation (recommended but user infra)

## Open questions for the user

(These can be addressed asynchronously without blocking; sensible defaults are taken otherwise.)

1. Bedrock model preference — defaulting to `anthropic.claude-3-5-sonnet-20240620-v1:0` in `us-east-1`. Change?
2. Whether to merge `templates/meeting-notes/` into the new `templates/meetings/` (P3) or keep them as separate routes during a deprecation window
3. Whether to delete the `wrangler-calorie-tracker.toml` file (referenced no app) and `wrangler-issues.toml` (references a hidden template) at the root — cleanup

---

This file is the canonical entry point. For implementation detail, follow the phase docs. For decisions, the ADRs. For what each mini-app does, the per-app specs in [`docs/apps/`](docs/apps/).
