# Phase 7 — Test Scaffold + Executable Runner

**Goal:** Establish a uniform testing baseline across the super-app per [`docs/testing/`](../testing/). Wire it up as an executable runner from both CLI and a `/tests` page inside the shell, so QA cycles are one-button-press.

## Context (from agent inventory)

- Vitest is the established test runner; ~1496 tests currently pass, 16 fail (concentrated in `packages/core/src/client/theme.spec.ts` — jsdom `window.localStorage.clear` issue)
- No Playwright installed at the root yet — Phase 7 adds it
- 10 `guard:*` scripts already exist; cover schema safety, env credentials, unscoped queries, etc.

## Deliverables

- [ ] Fix the 16 currently-failing unit tests (theme.spec.ts + 14 others — triage at task start)
- [ ] Add Playwright to root `package.json` + `playwright.config.ts`
- [ ] Per-template Vitest config standardised (some have it, some don't — finish covering all 13 mini-apps after Phase 3)
- [ ] **Cross-template integration tests** in `tests/integration/` at repo root: capability registry RPC round-trip per app, identity propagation matrix, sharing matrix
- [ ] **E2E tests** in `tests/e2e/`: sign-in → create → read → share → delete per mini-app + cross-app dataflow tests
- [ ] `bin/test-fluid-os.sh` — executable runner (per `docs/testing/qa-runbook.md`): runs guards → unit → integration → e2e in sequence, emits machine-readable JSON to `.test-results/`
- [ ] `/tests` page inside dispatch shell — renders the latest `.test-results/` JSON as a pass/fail matrix with click-to-see-output. Visible only in development / when `ENABLE_TESTS_UI=1`.
- [ ] CI scaffold: `.github/workflows/test.yml` placeholder (referenced in `qa-runbook.md`)

## Tasks

| ID | Task | Owner |
|---|---|---|
| T-P7-01 | Triage + fix the 16 failing unit tests | Product Engineer |
| T-P7-02 | Add Playwright dependency + config | Product Engineer |
| T-P7-03 | Author baseline integration tests per app spec | Product Engineer (4 parallel, one per new template; 1 for existing-template coverage gaps) |
| T-P7-04 | Author the cross-app capability-registry test matrix | Product Engineer |
| T-P7-05 | Author e2e tests for each public allow-listed template | Product Engineer (split among 2 engineers) |
| T-P7-06 | Implement `bin/test-fluid-os.sh` executable runner | Product Engineer |
| T-P7-07 | Implement `/tests` shell UI page | UX Engineer + Product Engineer |
| T-P7-08 | Set up `.github/workflows/test.yml` (placeholder, behind a feature branch) | Product Engineer |

## Acceptance criteria

- [ ] `pnpm test` reports 0 failures (from current 16)
- [ ] `pnpm test:integration` runs across all 13 mini-apps; ≥ 90% pass
- [ ] `pnpm test:e2e` runs Playwright suite; ≥ 85% pass (allow for known flakes documented in qa-runbook)
- [ ] `bin/test-fluid-os.sh` runs end-to-end in < 15 min; produces JSON output
- [ ] `/tests` page renders results, navigable per app, drill-down into failure details
- [ ] At least 1 integration test per inter-app dependency declared in mini-app specs (CRM→mail, CRM→calendar, tasks→notes, meetings→notes+tasks)

## QA plan

- Self-test: the test runner runs itself in CI to verify it doesn't false-positive
- Coverage target: 60% lines across the framework + mini-apps (deliberately moderate; quality of tests matters more than absolute coverage)

## Pivot triggers

- **If Playwright is too heavy / slow for local dev:** use a lighter alternative for e2e (Vitest browser mode + Testing Library; ~20% the install footprint). Trade-off: smaller ecosystem, slower iteration on visual tests.
- **If the `/tests` page is non-trivial to embed in the shell:** ship the runner-only first (CLI), add the UI page in a follow-up phase.

## Risks

- Test infrastructure regressions when running 16+ Nitro servers concurrently for e2e (one per template). Mitigated by: e2e tests run serially against a single fresh `dev:lazy` instance, NOT in parallel.
- E2E test flakiness around iframe-based UI interactions. Mitigated by: deterministic wait selectors, no `setTimeout` waits.

## Out of scope

- Visual regression testing (Percy, Chromatic) — v2
- Load / performance testing — measured ad-hoc; formal perf suite is future work
- Mutation testing — not justified at this scale

## Estimated effort

3 dev-days across multiple engineers (test code is parallelizable per app) + 1 day for runner + UI = 4 days total wall-clock with parallelism.
