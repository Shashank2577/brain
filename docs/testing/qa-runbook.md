# QA Runbook

Operational guide for the human or agent running quality checks before a PR lands. Pairs with `unit-strategy.md`, `integration-strategy.md`, and `e2e-strategy.md`.

## Static guards (already wired)

The repo ships ten static guards under `scripts/guard-*.mjs`. They run in CI and locally via `pnpm guards`, and they protect against regressions that have already cost production data or hidden-template leaks:

| Guard                              | What it blocks                                                          |
| ---------------------------------- | ----------------------------------------------------------------------- |
| `guard:no-drizzle-push`            | `drizzle-kit push` in any build / install / deploy script               |
| `guard:no-unscoped-queries`        | Reads of `ownableColumns()` tables that skip `accessFilter` / `assertAccess` |
| `guard:no-env-credentials`         | Hard-coded credentials in env templates                                  |
| `guard:no-unscoped-credentials`    | Secret lookups that ignore the per-user / per-org scope                  |
| `guard:no-env-mutation`            | Runtime mutation of `process.env`                                        |
| `guard:no-localhost-fallback`      | `localhost` default URLs leaking into shipped templates                  |
| `guard:db-tool-scoping`            | Extension SQL helpers that bypass tool-data scoping                      |
| `guard:template-list`              | Hidden templates leaking into the public allow-list                      |
| `guard:no-generated-artifacts`     | Committed files from `.generated/`                                        |
| `guard:extension-no-public`        | Extensions setting `allowPublic` or cross-org user shares                |

Run all guards: `pnpm guards`. Run one: `pnpm guard:<name>`.

## Pre-PR checklist

Before opening a PR, the contributor (or `babysit-pr`) confirms all six gates pass locally:

1. `pnpm fmt` — Prettier writes consistent style across every changed file.
2. `pnpm typecheck` — every workspace compiles cleanly. No `// @ts-ignore` without a referenced ticket.
3. `pnpm test` — root tier (`core` + `docs` + `dispatch`). Per-template tests are exercised by the runner below.
4. `pnpm guards` — every static guard green.
5. `bin/test-fluid-os.sh` — the executable runner described below (full pyramid).
6. `pnpm changeset:status` — every changed publishable package has a matching `.changeset/<slug>.md`.

`pnpm prep` is the convenience target that runs `fmt`, `typecheck`, `test`, and `guards` in parallel. Add `bin/test-fluid-os.sh` to the list once it lands.

## `bin/test-fluid-os.sh` (executable runner)

A single shell entry point that runs all four levels in order, fails fast, and prints a compact summary the `/tests` UI can ingest.

```bash
#!/usr/bin/env bash
set -euo pipefail
ROOT="$(cd "$(dirname "${BASH_SOURCE[0]}")/.."; pwd)"
OUT="$ROOT/.test-results"
mkdir -p "$OUT"

echo "::group::guards"
pnpm guards | tee "$OUT/guards.log"

echo "::group::unit"
pnpm -r --reporter=json test 2>&1 | tee "$OUT/unit.json"

echo "::group::integration"
pnpm -r --filter='./templates/*' test -- --testPathPattern int 2>&1 | tee "$OUT/integration.json"

echo "::group::e2e"
pnpm exec playwright test --reporter=json --output-dir="$OUT/e2e" 2>&1 | tee "$OUT/e2e.json"

node scripts/qa-summarize.mjs "$OUT" > "$OUT/summary.json"
echo "Done — results in $OUT/summary.json"
```

What it spec'd to do:

- **Layers in order**: guards → unit → integration → e2e. Skipping a stage is opt-in (`--only=unit`).
- **Machine-readable output** in `.test-results/*.json` so both CI and the in-app `/tests` shell can render the run without re-parsing tap logs.
- **A summary writer** (`scripts/qa-summarize.mjs`, to be added) aggregates pass / fail / skipped counts per template into `summary.json`.
- **No teardown stale state** — each Vitest worker and each Playwright worker owns a temp SQLite file under `.e2e/` and cleans it on exit.
- **CI-friendly** but works locally; `--ci` flag flips on retries and uploads to the artifact dir CI expects.

Existing one-off QA scripts (`scripts/qa-cli-smoke.ts`, `scripts/qa-template-route-matrix.ts`, `scripts/qa-public-share-smoke.ts`, `scripts/qa-frame-desktop-smoke.ts`) keep running as **smoke** under `bin/test-fluid-os.sh --smoke` — they catch CLI scaffold drift and public-share regressions that don't surface in unit / integration.

## The `/tests` shell UI page

Spec for the in-app QA dashboard mounted in the OS shell at `/tests`:

- Renders the most recent `.test-results/summary.json` plus a list of historical runs (keyed by git SHA, stored in the shared SQLite DB as `qa_runs`).
- Top strip: four large status pills — Guards, Unit, Integration, E2E — each green / amber / red with the failure count.
- Body: a grid of mini-apps (one card per template) with last-run duration, pass / fail count, and a "Run now" button that POSTs to `POST /_agent-native/actions/run-qa --scope=<template>` (an action wrapping `pnpm --filter <template> test`).
- Drill-down: click a card to see the failed test names and the captured logs. Stack traces stay inside a `<details>` for density.
- Trend sparkline at the top: 14-day pass rate per layer. Sourced from `qa_runs`.
- Uses standard shadcn primitives — `Card`, `Tabs`, `Collapsible`, `Sheet` for the drill-down. No custom positioned overlays.
- All data scoped through `accessFilter` so a viewer of the workspace can see results but only admins can hit "Run now".

## CI hookup (placeholder)

Deferred to a follow-up. The shape we'll wire when we get there:

- One workflow `qa.yml` triggered on every PR, three jobs in series with `fail-fast: false`: `guards-and-unit`, `integration`, `e2e`.
- Cache `node_modules` keyed on `pnpm-lock.yaml`; cache the Playwright browsers under `~/.cache/ms-playwright`.
- Upload `.test-results/` as an artifact for the `/tests` page to consume.
- The `babysit-pr` agent watches the workflow and addresses failures in-loop.

Until CI lands, the rule is **run `bin/test-fluid-os.sh` before pushing**; the workspace's pre-push hook (to be added in the same change that introduces the runner) will enforce it.

## When things go wrong

- **Vitest worker hangs** — a template is missing the `runWithRequestContext` wrap around an async DB call. `pnpm --filter <template> test --pool=threads --reporter=verbose` surfaces it.
- **Playwright flakes on the sign-in flow** — almost always a stale dev-auth cookie. Delete `.e2e/` and rerun.
- **Guard fails for a "legitimate" reason** — push back. Each guard exists because the codebase lost real data, leaked a hidden template, or shipped a credential. Add a `// guard:allow-unscoped — <reason>` only with reviewer sign-off.
- **One template's tests fail in isolation but pass in `pnpm test`** — module side effects (an import is mutating shared state). Hoist mocks with `vi.hoisted` (see `templates/slides/actions/create-deck.test.ts`).
