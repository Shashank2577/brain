# Phase 4 — Cleanup: Kill the `:4100` Host, Reduce Fluid-OS to a Library

**Goal:** Now that the registry, RPC, and 4 manifest-only apps have all been migrated (Phases 1 + 3), delete the standalone fluid-os host server and the manifest-only example apps. Keep `packages/fluid-os/` as a thin library that exports the registry + RPC + scaffolder primitives.

## Deliverables

- [ ] Delete `packages/fluid-os/examples/host/server.ts` (standalone host server)
- [ ] Delete `packages/fluid-os/examples/apps/` (10 manifest-only apps — notes, tasks, mail, calendar, content, slides, dispatch, crm, meetings) — superseded by `templates/<name>/` versions
- [ ] Delete `packages/fluid-os/src/host/`, `src/auth/`, `src/identity/`, `src/agent/` (host-only code)
- [ ] Delete `packages/fluid-os/src/shell/` (the React shell that the standalone host served — superseded by dispatch shell from Phase 2)
- [ ] Delete `packages/fluid-os/src/cli/create-app.ts` (the manifest-only CLI — superseded by `packages/core/src/cli/create.ts` + dispatch UI in Phase 6)
- [ ] Trim `packages/fluid-os/package.json` exports + scripts:
  - Remove `bin: fluid-os`
  - Remove `demo`, `demo:server`, `dev:shell`, `build:shell` scripts
  - Keep `typecheck` only
  - Exports: `./manifest`, `./registry`, `./rpc/server`, `./rpc/client`, `./scaffold` (the library surface)
- [ ] Update `packages/dispatch/package.json` to import `@agent-native/fluid-os/{registry,rpc/*,scaffold}` instead of duplicating the code
- [ ] Add a static guard `scripts/guard-no-fluid-os-host.mjs` — forbids new files under `packages/fluid-os/{examples,host,auth,identity}/` to prevent regression

## Tasks

| ID | Task | Owner |
|---|---|---|
| T-P4-01 | Verify Phase 1 + Phase 3 fully shipped before any deletion | Architect |
| T-P4-02 | Delete listed files; run typecheck + guards | Product Engineer |
| T-P4-03 | Update dispatch package.json + ensure plugin imports work | Product Engineer |
| T-P4-04 | Add the guard script | Product Engineer |
| T-P4-05 | Update CLAUDE.md to remove references to the `:4100` host | Researcher |
| T-P4-06 | Verify `pnpm dev:lazy` no longer attempts to start anything on 4100 | Product Engineer |

## Acceptance criteria

- [ ] `lsof -i :4100` returns nothing after `pnpm dev:lazy`
- [ ] `pnpm typecheck` clean
- [ ] `pnpm guards` clean (including the new fluid-os-host guard)
- [ ] `pnpm test` clean
- [ ] All 13 mini-apps (10 existing + 4 new) still visible in the dispatch shell rail
- [ ] Inter-app calls still work end-to-end

## Pivot triggers

- **If any code in `packages/fluid-os/src/host/` is unexpectedly referenced by dispatch:** keep that specific file, move it into `packages/dispatch/src/server/lib/` instead of deleting.
- **If the cleanup breaks an existing test:** revert the specific deletion that caused the break, file the issue, ship the rest.

## Risks

- Deleting too much. Mitigated by: do this phase AFTER Phase 1 + 3 are verified working end-to-end. The deletion is the "last mile" cleanup, not an aggressive trim early on.
- Forgotten import paths. Mitigated by: typecheck guard.

## Out of scope

- Renaming `packages/fluid-os/` to something more accurate (e.g. `packages/capability-registry/`). v1: keep the name; rename in a future cleanup PR if it's bothering anyone.

## Estimated effort

0.5 dev-day (Product Engineer) + 0.5 day verification = 1 day.
