# Phase 9 — Final QA Sweep (Multi-Agent)

**Goal:** Validate the complete super-app end-to-end after Phases 1-8 land. Five+ parallel QA agents probe different surfaces with rigorous test plans, producing a final QA report with reproducible scenarios and screenshots.

This is the final gate before reporting completion to the user.

## Agent team

| Agent | Role | Focus |
|---|---|---|
| **QA-UI-A** | UI Tester (browser, Chrome) | Happy paths per mini-app: sign-in → create → edit → share → delete. Captures screenshots per scenario. |
| **QA-UI-B** | UI Tester (browser, second instance) | Cross-app workflows: CRM → mail send, calendar → meetings transcript, tasks → notes linked creation. Captures GIFs / screenshots of multi-step flows. |
| **QA-API-A** | API Tester | Capability registry coverage: every registered FQID called at least once with valid + invalid inputs; assert correct shapes + errors |
| **QA-API-B** | API Tester | Identity propagation matrix: for every declared inter-app dependency, call via `ctx.call` and assert ownership is the user's. Authorization matrix: viewer / editor / admin / unauthorized roles. |
| **QA-DB** | Data Integrity | Persistence: restart dispatch, verify all created data survives. Migration cleanliness: fresh DB → run all migrations → assert schema matches expected. Sharing model: spot-check `tool_shares`, `<app>_shares` tables for proper rows on share / unshare. |

Plus standing advisor agents available for consultation:

- **Architect** — reviews QA findings against ADRs; rules on whether a finding is a regression vs accepted scope
- **Product Owner** — prioritises which QA findings block "completion" vs ship-as-known-issue
- **Researcher** — answers code-trace questions as they arise during testing
- **Product Engineer** — pulled in to fix critical bugs found during QA
- **UX Engineer** — adjudicates UX-quality findings vs functional bugs

## Inputs each QA agent receives

- The full spec ecosystem (`docs/`)
- The relevant mini-app specs in `docs/apps/`
- The integration + e2e test patterns from `docs/testing/`
- Seeded demo identities (`alice@demo.local` / `demo1234`, etc.)
- The dispatch shell URL (`http://127.0.0.1:8080/dispatch`)

## Deliverables (per agent)

- `docs/qa-reports/QA-<role>-<date>.md` — structured findings doc with:
  - Scenarios tested (numbered list)
  - Pass / fail per scenario with evidence (screenshot / response body / log snippet)
  - Severity (Blocker / Critical / High / Medium / Low / Polish)
  - Reproduction steps for failures
  - Recommendation per finding

The main orchestrator (this agent) then synthesises:

- `docs/qa-reports/QA-FINAL-<date>.md` — combined view, prioritised, with the **completion gate decision**: ship or fix-and-retry

## Sample QA scenarios per agent

### QA-UI-A (UI happy paths)
- Sign in via Google OAuth → land in dispatch shell
- Click each rail icon (10+ mini-apps), screenshot the loaded view
- In each app, perform the canonical happy-path workflow
- Test rail keyboard shortcuts (`Cmd+1` through `Cmd+9`)
- Test deep-linking: load `/dispatch?app=calendar&path=...` directly; verify state

### QA-UI-B (cross-app workflows)
- In CRM, create a contact → click "Log outreach" → write email → send → assert email appears in Mail's Sent tab
- In CRM, click "Schedule meeting" → fill form → verify event appears in Calendar
- In Calendar, click an event → use the agent to start a transcript (delegates to Meetings) → verify meeting created
- In Tasks, create with `alsoNote: true` → verify a Note was created and visible in Notes' list view
- Each multi-app flow captures a GIF / sequence of screenshots

### QA-API-A (API coverage)
- Programmatic exhaustive test of every registered capability
- For each: valid input → expected output shape; invalid input → expected validation error; missing input → expected error
- Capability count match: `(GET /_agent-native/registry/capabilities).length === expected`
- A spot-check that the agent's tool list matches the registry's capability list

### QA-API-B (identity propagation + authorization)
- For each declared inter-app dependency in spec docs: invoke via `ctx.call`; assert the target action saw `getRequestUserEmail()` == calling user, not the calling app
- Authorization matrix: for each ownable resource type (notes, tasks, contacts, deals, meetings, etc.):
  - Owner accesses → 200
  - Shared viewer accesses → 200 read, 403 write
  - Shared editor accesses → 200 read, 200 write
  - Unrelated user accesses → 403 / row absent in list
- Confirm no IDOR shaped vulnerabilities in unhide/share/update endpoints

### QA-DB (persistence + data integrity)
- Restart dispatch server; verify ALL data created during QA-UI passes survives
- Fresh DB run: delete `.dev-data/workspace.db`, restart, run all migrations, verify schema matches expectation (table count, column types)
- Sharing rows: after a share, query `<app>_shares` table; assert exactly one row exists for the new principal
- Orphan check: after deleting a parent (contact), assert child rows (activities) are either cascade-deleted or correctly orphaned per spec
- No mini-app's data leaks across owners (sample SELECTs as user A's row count vs user B's row count for each table)

## Acceptance criteria for shipping

- All Blocker / Critical findings either fixed or explicitly accepted as known issues with user signoff
- ≥ 90% of declared inter-app workflows pass
- ≥ 90% of mini-apps' happy-path UI flows pass
- All inter-app identity-propagation assertions pass
- Persistence holds across restart
- Authorization matrix passes
- The completion report has: what works, what's known-broken, what's untested, what's recommended next

## Pivot triggers

- **If multiple agents report contradictory findings on the same scenario:** Architect adjudicates, decision recorded in an ADR if it represents an architectural call.
- **If a Blocker is found that requires > 2 hours to fix:** stop QA, fix the blocker, restart the affected agent's run from the beginning. The other agents continue on independent scenarios.
- **If the user becomes available before QA completes:** surface progress + ask whether to continue or pause.

## Out of scope

- Penetration testing (out of scope for v1; flagged as future work in BRD risks)
- Load / stress testing (separate phase)
- Cross-browser compatibility beyond Chrome + Safari + Firefox (latest 2 versions)

## Estimated effort

QA agents run for 1-3 hours each in parallel (≈ 1 wall-clock evening). Architect / Product Owner adjudication adds 1-2 hours. Bug fixes during QA add unknown time depending on severity.
