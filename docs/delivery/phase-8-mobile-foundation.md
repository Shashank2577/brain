# Phase 8 — Mobile Foundation

**Goal:** Prove the super-app architecture is portable by shipping a minimal mobile shell that consumes the same capability registry as the web shell. This is the **foundation**, not feature-complete mobile UI.

Per [ADR-006](../decisions/ADR-006-mobile-foundation-strategy.md), the final mobile UI strategy (WebView vs native vs React Native) is deferred until first contact with the implementation. Phase 8 ships the simplest possible thing that proves the architecture works on mobile.

## Deliverables

- [ ] `packages/mobile-app/` — assessed, refactored or extended to:
  - Sign in via workspace auth (Better Auth-compatible — bearer token flow)
  - Fetch the installed apps list from `/_agent-native/registry/apps`
  - Render a native scrollable list of mini-app entries with name + icon
  - Tapping an entry opens the mini-app's URL in an in-app WebView (initial strategy per ADR-006)
  - Bottom tab bar for switching apps (drives the same in-app WebView host)
- [ ] Workspace auth changes (one-time, framework level):
  - Bearer-token auth endpoint at `/_agent-native/auth/token` produces a JWT redeemable in subsequent requests (lighter than the existing session-cookie flow for mobile)
  - Existing cookie auth unchanged
- [ ] At minimum: builds and runs on the user's local iOS simulator OR Android emulator (developer's choice for this phase). Full multi-platform packaging deferred.
- [ ] A `docs/mobile-foundation-status.md` capturing: what works, what doesn't, what the next phase needs to address

## Tasks

| ID | Task | Owner |
|---|---|---|
| T-P8-01 | Audit existing `packages/mobile-app/` — what's there, what tech stack, what state | Researcher |
| T-P8-02 | Decide React Native vs Swift+Kotlin native for this phase based on audit | Architect |
| T-P8-03 | Implement bearer-token auth in workspace (in-process — framework-level change) | Product Engineer |
| T-P8-04 | Build the minimal mobile shell (sign-in screen + apps list + WebView host) | Product Engineer (mobile-focused) |
| T-P8-05 | Wire it to the dispatch host (local dev: phone hits `http://10.0.2.2:8080` on Android, `http://localhost:8080` on iOS simulator) | Product Engineer |
| T-P8-06 | Verify each mini-app's UI renders inside the mobile WebView (some templates may need responsive-CSS fixes) | UX Engineer |
| T-P8-07 | Document the mobile foundation status; flag what's not yet done | Product Engineer |

## Acceptance criteria

- [ ] The mobile shell builds + boots on iOS Simulator OR Android Emulator (one is enough for foundation)
- [ ] User signs in once (via bearer token); identity persists across app sessions
- [ ] `/_agent-native/registry/apps` is fetched and rendered as a tappable list
- [ ] Tapping notes / tasks / calendar opens each one and renders the corresponding template's UI
- [ ] Inter-app calls inside a mini-app's WebView still work (they go through the dispatch backend, same as on web)
- [ ] No console-level errors on iOS or Android during the basic flow

## QA plan

- Manual: the developer who implements it walks through sign-in + 3 mini-apps; screenshots committed alongside `mobile-foundation-status.md`
- Automated: e2e tests via Maestro / Detox deferred to v2 — out of scope here

## Pivot triggers

- **If `packages/mobile-app/` is not in a workable state:** scaffold a fresh minimal shell from scratch using Expo / React Native (fastest path to a working app on both platforms). Document the choice.
- **If WebView rendering is broken for one or more templates:** flag the specific responsive-CSS issues; fix in the templates if quick, otherwise document for a follow-up phase.
- **If bearer-token auth is hard to add cleanly:** for v1 mobile, use the cookie via WebView only (every mini-app loaded in WebView gets the cookie automatically); add a native-friendly auth in v2.

## Risks

- Mobile dev tooling (Xcode, Android Studio) is platform-specific and may slow this phase. Acceptable — Phase 8 is foundational, not feature-complete.
- WebView rendering quality varies on lower-end Android. v1 doesn't need to look perfect; v2 polishes.

## Out of scope

- App Store / Play Store distribution
- Push notifications
- Native widgets / app extensions
- Polished native UI per mini-app

## Estimated effort

3 dev-days (mobile-focused Product Engineer) + 0.5 day architect review = 3.5 days. Highly dependent on what `packages/mobile-app/` already contains.
