# Phase 7 Prep — Failing Test Triage

**Captured:** 2026-05-16 (Phase 7 prep scaffold, branch `os-shell`).
**Source command:** `pnpm test` at repo root.
**Headline numbers:** **1496 tests pass, 16 fail** (2 test files / 1 root cause).

> Phase 7 prep does NOT fix these tests. Triage only — fixes belong to
> Phase 7 main task **T-P7-01** in [`docs/delivery/phase-7-tests.md`](../docs/delivery/phase-7-tests.md).

## Root cause (all 16 failures share it)

`TypeError: window.localStorage.clear is not a function` thrown from
`beforeEach` setup. Both failing spec files declare
`// @vitest-environment happy-dom` at the top and call
`window.localStorage.clear()` in their `beforeEach`. happy-dom exposes
`window.localStorage` as a getter that returns a Storage instance, but
in the current vitest / happy-dom combo the returned object lacks the
`.clear` method — likely a happy-dom version mismatch or a missing
shim that the test setup file used to install.

The two impacted files are the **only** consumers of
`window.localStorage.clear()` in `packages/core/src/client/*.spec.ts`,
so this is a localized blast radius — fixing the underlying environment
(or switching both files to `// @vitest-environment jsdom`, which does
implement `localStorage.clear`) will green all 16.

## Likely fix categories

- **A. Switch the two specs to `@vitest-environment jsdom`** — lowest-risk,
  one-line change per file. jsdom's `Storage` has `.clear`. Verify the
  rest of the assertions still pass under jsdom.
- **B. Upgrade happy-dom** in `packages/core` and re-run. The
  `.clear` method may have been restored in a newer release.
- **C. Replace `.clear()` with a manual loop** (`for (const key of Object.keys(window.localStorage)) window.localStorage.removeItem(key);`).
  Works regardless of which env exposes which methods, but masks the
  underlying env regression.

**Recommendation:** A. It's the least invasive and isolates the change
to the two failing files. We can revisit B if happy-dom is needed for
other reasons.

## Failure inventory (16 total)

| #   | File:Line                                                 | Test                                                                                       | Error                                                    | Likely fix          |
| --- | --------------------------------------------------------- | ------------------------------------------------------------------------------------------ | -------------------------------------------------------- | ------------------- |
| 1   | `packages/core/src/client/agent-sidebar-state.spec.ts:32` | `getInitialAgentSidebarOpen > uses the provided default when there is no saved preference` | `TypeError: window.localStorage.clear is not a function` | A (switch to jsdom) |
| 2   | `packages/core/src/client/agent-sidebar-state.spec.ts:32` | `getInitialAgentSidebarOpen > uses the saved desktop preference outside Builder`           | `TypeError: window.localStorage.clear is not a function` | A                   |
| 3   | `packages/core/src/client/agent-sidebar-state.spec.ts:32` | `getInitialAgentSidebarOpen > starts closed on mobile even with a saved open preference`   | `TypeError: window.localStorage.clear is not a function` | A                   |
| 4   | `packages/core/src/client/agent-sidebar-state.spec.ts:32` | `getInitialAgentSidebarOpen > starts closed in Builder even with a saved open preference`  | `TypeError: window.localStorage.clear is not a function` | A                   |
| 5   | `packages/core/src/client/theme.spec.ts:27`               | `getThemeInitScript > resolves system theme before the app mounts`                         | `TypeError: window.localStorage.clear is not a function` | A                   |
| 6   | `packages/core/src/client/theme.spec.ts:27`               | `getThemeInitScript > lets an explicit stored theme override the browser preference`       | `TypeError: window.localStorage.clear is not a function` | A                   |
| 7   | `packages/core/src/client/theme.spec.ts:27`               | `getThemeInitScript > uses the configured default when there is no stored theme`           | `TypeError: window.localStorage.clear is not a function` | A                   |
| 8   | `packages/core/src/client/theme.spec.ts:27`               | `getThemeInitScript > falls back from stored system when system themes are disabled`       | `TypeError: window.localStorage.clear is not a function` | A                   |
| 9   | `packages/core/src/client/theme.spec.ts:27`               | `getThemeInitScript > normalizes legacy auto storage before next-themes reads it`          | `TypeError: window.localStorage.clear is not a function` | A                   |
| 10  | `packages/core/src/client/theme.spec.ts:27`               | `getThemeInitScript > removes invalid stored themes so the provider can use the default`   | `TypeError: window.localStorage.clear is not a function` | A                   |
| 11  | `packages/core/src/client/theme.spec.ts:27`               | `getThemeInitScript > inlines Vite dev recovery outside production`                        | `TypeError: window.localStorage.clear is not a function` | A                   |
| 12  | `packages/core/src/client/theme.spec.ts:27`               | `getThemeInitScript > omits Vite dev recovery in production`                               | `TypeError: window.localStorage.clear is not a function` | A                   |
| 13  | `packages/core/src/client/theme.spec.ts:27`               | `getThemeInitScript > applies a stored appearance preset on init`                          | `TypeError: window.localStorage.clear is not a function` | A                   |
| 14  | `packages/core/src/client/theme.spec.ts:27`               | `getThemeInitScript > clears invalid appearance values from storage`                       | `TypeError: window.localStorage.clear is not a function` | A                   |
| 15  | `packages/core/src/client/theme.spec.ts:27`               | `getThemeInitScript > leaves data-appearance unset when none is stored`                    | `TypeError: window.localStorage.clear is not a function` | A                   |
| 16  | `packages/core/src/client/theme.spec.ts:27`               | `getThemeInitScript > keeps Vite dev recovery deterministic in browsers without process`   | `TypeError: window.localStorage.clear is not a function` | A                   |

## Test files passing (159 → 157)

The agent inventory's earlier number (1496 pass / 16 fail) reproduces
exactly. No new flakes uncovered during this triage.

## Next action

Open a follow-up under **T-P7-01** that:

1. Adds `// @vitest-environment jsdom` (or removes the happy-dom
   directive in favour of the package default) at the top of both
   spec files.
2. Re-runs `pnpm --filter @agent-native/core test` and confirms
   1512 / 1512 pass.
3. Leaves the surrounding test bodies untouched — these tests cover
   real product behaviour and should keep their assertions intact.
