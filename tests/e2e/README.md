# tests/e2e

Playwright end-to-end tests for the fluid-system super-app live here.

This directory is **scaffolded by Phase 7 prep** — the only files at the
moment are this README and `.gitkeep`. Actual test cases land in Phase 7
main; see [`docs/delivery/phase-7-tests.md`](../../docs/delivery/phase-7-tests.md)
for the task list and acceptance criteria.

## Strategy

Read [`docs/testing/e2e-strategy.md`](../../docs/testing/e2e-strategy.md) before
authoring any spec. The strategy covers:

- the five-step per-app ritual (sign-in → create → read → share → delete)
- the canonical cross-app scenario (calendar event → mail compose suggestion)
- selector rules (shadcn semantic roles, never Tailwind classes)
- what e2e must NOT do (no internal SQL assertions, no mocked auth, no `setTimeout` waits)

## Running

```bash
# all e2e specs against the lazy dev gateway on :8080
pnpm test:e2e

# debug a single spec
pnpm exec playwright test --debug tests/e2e/<spec>.spec.ts
```

The HTML report lands in `.test-results/playwright-html/` (gitignored).

## Configuration

The shared config is [`../../playwright.config.ts`](../../playwright.config.ts).
It spins up `pnpm dev:lazy` on port 8080 and runs the chromium project
headless by default.
