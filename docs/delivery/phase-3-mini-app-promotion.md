# Phase 3 — Promote Manifest-Only Apps to Full Templates

**Goal:** Scaffold notes, tasks, CRM, and meetings as full mini-apps (backend + Drizzle schema + UI + tests) per their specs in `docs/apps/`. P0 persistence problem fixes itself by construction — they now use the shared workspace DB.

## Deliverables

- [ ] `templates/notes/` — full template per [`docs/apps/notes.md`](../apps/notes.md)
- [ ] `templates/tasks/` — full template per [`docs/apps/tasks.md`](../apps/tasks.md)
- [ ] `templates/crm/` — full template per [`docs/apps/crm.md`](../apps/crm.md)
- [ ] `templates/meetings/` — full template per [`docs/apps/meetings.md`](../apps/meetings.md) (starting from existing `templates/meeting-notes/` per the spec's recommendation)
- [ ] Each template registered in:
  - `packages/shared-app-config/templates.ts` with `hidden: false`
  - `packages/core/src/cli/templates-meta.ts` (the dual source enforced by `guard-template-list.mjs`)
- [ ] Each template appears in the dispatch shell rail (from Phase 2)
- [ ] Each template's capabilities auto-derive into the registry (from Phase 1)
- [ ] Inter-app `ctx.call(...)` works between the new templates and existing ones (CRM → mail / calendar / notes / tasks)

## Tasks (parallelizable — 4 Product Engineers, one per app)

| ID | Task | Owner |
|---|---|---|
| T-P3-N | Scaffold `templates/notes/` per spec | Product Engineer A |
| T-P3-T | Scaffold `templates/tasks/` per spec | Product Engineer B |
| T-P3-C | Scaffold `templates/crm/` per spec | Product Engineer C |
| T-P3-M | Scaffold `templates/meetings/` per spec (from `meeting-notes/`) | Product Engineer D |

Each agent's work:

1. Read the spec doc in full
2. Create template directory structure (server/db, actions, app/routes, AGENTS.md, vitest.config.ts)
3. Implement Drizzle schema + migration
4. Implement each capability declared in the spec via `defineAction()`
5. Implement React UI per spec (list view + detail view minimum)
6. Wire embedded-mode detection
7. Implement unit tests for each capability (mocked DB)
8. Implement at least 2 integration tests per app (real ephemeral SQLite)
9. Update `packages/shared-app-config/templates.ts` + `packages/core/src/cli/templates-meta.ts`
10. Verify the app boots via `pnpm dev:lazy` and appears in `/_agent-native/registry/apps`

## Acceptance criteria (per app)

- [ ] Spec's 5+ baseline capabilities all implemented and unit-tested
- [ ] At least 2 integration tests with real DB pass
- [ ] React UI renders cleanly in both embedded (inside dispatch shell) + standalone modes
- [ ] Agent sidebar correctly hidden in embedded mode
- [ ] Inter-app calls declared in the spec work end-to-end (e.g. `tasks.create` with `alsoNote: true` creates a note via `ctx.call("notes.create-note", ...)` AND identity propagates)
- [ ] Mini-app appears in `/dispatch` rail
- [ ] `pnpm guards` passes (template-list guard satisfied)
- [ ] `pnpm test --filter <app>` passes

## QA plan

- Per app: full vitest suite (unit + integration)
- Cross-app: explicit e2e test scenarios for each declared inter-app dependency
- Identity-propagation matrix test: every inter-app call asserts the propagated identity is the original caller, not the calling app

## Pivot triggers

- **If meetings is too complex starting from `meeting-notes`:** start from a clean slate per the spec; cherry-pick `meeting-notes/` for transcript handling code.
- **If an app's data model evolves during implementation:** update the spec doc in the same PR. Spec drift is fatal; we keep specs and code in lockstep.
- **If a new template's migration conflicts with existing tables:** the namespace prefix is wrong; rename. Existing namespace convention: `<app>_<entity>` (`notes_notes`, `crm_contacts`, etc.).

## Risks

- Four agents in parallel may produce inconsistent stylistic decisions. Mitigated by: scaffolder-derived starting templates (Phase 6 prereq partially helps; otherwise hand-curate file layouts during this phase).
- Inter-app `ctx.call(...)` between new apps and existing ones requires Phase 1 registry to be production-ready. T-P3-* blocks on Phase 1 acceptance.

## Out of scope

- Polishing existing mini-apps (calendar, mail, slides, etc.). They stay as-is; just gain registry visibility.
- Migrating the existing `templates/meeting-notes/` users to the new `templates/meetings/`. v1: meeting-notes stays usable; new users use meetings.

## Estimated effort

4 parallel × 1.5 days each = ~2 calendar days with 4 Product Engineers running concurrently.
