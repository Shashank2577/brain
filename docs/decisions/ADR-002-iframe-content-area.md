# ADR-002: Web shell uses iframes for mini-app content area

**Status:** Accepted (2026-05-16, branch `os-shell`). Reversible without touching mini-apps.

## Context

The dispatch web shell needs to render each mini-app's UI inside a persistent shell (left rail for app switching, top bar, agent sidebar). Three approaches:

1. **Iframes** — each mini-app loaded as an `<iframe src="/calendar">`; switching apps changes the iframe src
2. **Module Federation** — apps are remote modules loaded into the dispatch React tree at runtime
3. **Merged React Router tree** — all mini-apps merged into one mega React Router app

Each mini-app currently runs as its own Nitro server on its own port (8082-8099) under the workspace gateway at port 8080 (same-origin).

## Decision

**Use same-origin iframes** for the mini-app content area in the web shell.

The iframe URL maps to the mini-app's existing standalone URL (`/calendar`, `/slides`, etc.). The mini-app's React Router app continues to run unchanged, just embedded.

## Consequences

- **No template refactoring required.** Existing 10 templates work in the new shell with zero code changes beyond an embedded-mode detection (which uses the existing `packages/core/src/client/frame.ts`).
- **Cookie shared** — workspace SSO cookie (`an_session_workspace`, `Path=/`) reaches every iframed mini-app because they're same-origin.
- **postMessage** for parent ↔ iframe communication (URL changes, "what's the user looking at" for the agent, deep-link reflection).
- **Each mini-app's React tree is isolated** — no global state sharing, no module deduplication. This is acceptable; memory cost is bounded by the small number of active mini-apps a user has open.
- **Reversible** — moving from iframes to Module Federation or to a merged React tree is a future change that doesn't require rewriting mini-apps. The contract (mini-app = template = own Nitro server + UI) is preserved.
- **No iframe sandboxing surprises** — same-origin means no cross-origin restrictions.

## Mobile implication

Iframes are a **web-shell-only** tactic. Mobile shells (iOS / Android) will render mini-app UIs differently — likely native React Native screens against the same backend capability API, or WebViews of the same templates. See [ADR-006](ADR-006-mobile-foundation-strategy.md). This decision does not constrain mobile.

## Alternatives considered

- **Module Federation** — Module Federation gives one JS runtime + faster boot but requires every mini-app to be built as an MF remote (Webpack/Vite config burden). Reversible later; not paying that cost now.
- **Merged React Router tree** — would require unifying all 10 templates into one Vite build with one React Router root. Massive refactor. Higher long-term simplicity but unaffordable now.

## References

- [`architecture/01-super-app-and-shells.md`](../architecture/01-super-app-and-shells.md)
- ADR-001 (every mini-app has a UI)
- User direction: "one shell, one-click switching, persistent agent sidebar, mobile foundation"
