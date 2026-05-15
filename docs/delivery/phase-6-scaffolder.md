# Phase 6 — Scaffolder Wired into Dispatch "Create App" Flow

**Goal:** Make creating a new mini-app a first-class action in the dispatch shell. The user clicks "+ Create app", picks a template + name + icon, the scaffolder produces a working full template (per [`docs/onboarding/creating-a-new-mini-app.md`](../onboarding/creating-a-new-mini-app.md)), and the new app appears in the rail.

## Context

Two parallel scaffolders exist today and need reconciling (per onboarding spec):
- `packages/fluid-os/src/cli/create-app.ts` — manifest-only, deprecated by Phase 4
- `packages/core/src/cli/create.ts` + `workspacify.ts` — full template, what dispatch's existing `CreateAppPopover` already drives via `pnpm exec agent-native add-app`

The right move: **build on the existing core scaffolder**, retire the fluid-os CLI. Add starter-template variety: blank, CRUD-list, blog-post, dashboard.

## Deliverables

- [ ] `packages/core/src/cli/starter-templates/` directory with starter templates:
  - `blank/` — minimal scaffold (one route, one action, one table, basic UI)
  - `crud-list/` — list view + detail/edit page; standard CRUD baseline (the most common pattern)
  - `dashboard/` — analytics-style; sample queries + charts
  - `agent-tool/` — backend + minimal UI for an agentic service mini-app (the ADR-001 exception case)
- [ ] `packages/core/src/cli/create.ts` updated to accept `--template <name>` to pick a starter
- [ ] `packages/dispatch/src/components/CreateAppPopover.tsx` updated to expose template picker (currently only routes through the agent)
- [ ] After scaffold completes:
  - Updates `packages/shared-app-config/templates.ts` + `packages/core/src/cli/templates-meta.ts` (the dual sources)
  - Runs migrations on the shared workspace DB
  - Restarts the workspace gateway to pick up the new template directory
  - Triggers a registry rescan
- [ ] Scaffolder produces a test file with at least 3 passing tests in the new app
- [ ] Each starter has its own `AGENTS.md` that explains the starting capabilities

## Tasks

| ID | Task | Owner |
|---|---|---|
| T-P6-01 | Reconcile the two scaffolders; document deprecation of `fluid-os/cli/create-app.ts` | Researcher |
| T-P6-02 | Build the 4 starter-template directories with full file trees | Product Engineer |
| T-P6-03 | Update `core/cli/create.ts` to support `--template <name>` | Product Engineer |
| T-P6-04 | Update CreateAppPopover UI: pre-prompt screen with template picker (4 cards) | UX Engineer |
| T-P6-05 | Add post-scaffold registry rescan trigger | Product Engineer |
| T-P6-06 | Add e2e test: click Create app, pick crud-list, name it `widgets`, verify new app appears in rail | Product Engineer |
| T-P6-07 | Golden-file tests for each starter template (asserts the produced file tree matches snapshot) | Product Engineer |

## Acceptance criteria

- [ ] In dispatch shell, "+ Create app" opens a dialog with 4 starter cards
- [ ] Selecting `crud-list`, entering name `widgets`, hitting Create:
  - Scaffolds `templates/widgets/` with full file tree
  - Updates allow-list (both sources of truth)
  - Runs migration cleanly
  - New app appears in the rail within ≤ 5 s
- [ ] The new app's UI loads when its rail icon is clicked
- [ ] The new app's 5 baseline capabilities (list/get/create/update/delete) are auto-registered and callable
- [ ] User can call `widgets.create` from the agent chat immediately
- [ ] Inter-app: another template's action can call `widgets.list` via `ctx.call` and get a typed response

## QA plan

- Golden-file: each starter's generated file tree matches a snapshot
- Build-and-run: after scaffold, `pnpm typecheck` + `pnpm test --filter widgets` both pass
- E2E: full Create-app workflow click-through in browser

## Pivot triggers

- **If reconciling the two scaffolders is too risky in one phase:** ship blank + crud-list only via the core scaffolder; defer dashboard + agent-tool to a later phase. Deprecate the fluid-os CLI behind a warning rather than deleting (keeps it accessible for emergency fallback).
- **If the registry rescan can't be triggered without server restart:** require explicit reload after scaffold; show a banner "App created — reloading workspace…" with a button.

## Risks

- The existing `CreateAppPopover` routes through the agent chat for natural-language scaffolding ("build me a Pokemon collection app"). Don't lose that. The template picker should be a complement, not a replacement.
- Scaffolder writes inside `templates/` — must respect git status. Mitigation: scaffolder runs `git status --porcelain templates/<name>` first and refuses to overwrite uncommitted work.

## Out of scope

- Installing a scaffolded app from a remote registry (marketplace) — that's a v2 concern
- AI-generated scaffolds beyond what the existing agent-chat path produces

## Estimated effort

1.5 dev-days (Product Engineer) + 0.5 day UX + 0.5 day review = 2.5 days.
