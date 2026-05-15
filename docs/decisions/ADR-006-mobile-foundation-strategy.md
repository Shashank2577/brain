# ADR-006: Mobile foundation strategy — defer UI tech, lock in API contract

**Status:** Accepted (2026-05-16). Final UI-tech decision deferred to Phase 8 implementation gate.

## Context

The user envisions iOS and Android shells as part of the super-app strategy. The repo already has `packages/mobile-app/` indicating prior planning. Mobile shells need to:

- Show the same registered mini-apps as the web shell
- Allow one-click switching between mini-apps
- Render each mini-app's UI somehow
- Talk to the same backend (workspace SSO, capability registry, persistence)

Three UI strategies for mobile mini-app screens:

1. **WebView of the existing template** — load the web mini-app inside a `WKWebView` / Android `WebView`. Single source of truth for UI. Feels not-native.
2. **Native rewrite per mini-app** — SwiftUI / Jetpack Compose / React Native screens that hit the same backend API. Maximal native feel; maximal effort per app.
3. **React Native cross-platform** — one RN codebase rendering web (via RN Web) + iOS + Android. Middle ground. Existing web templates would need significant rewrites to be RN-compatible.

## Decision

**Lock in the backend contract now. Defer the UI tech decision until the first mobile shell is implemented in Phase 8.** The foundation is the registry + capability RPC + workspace SSO — none of which care which UI tech the mobile shell uses.

Phase 8 ships a **minimal mobile shell** that:
- Lists installed mini-apps from `/_agent-native/registry/apps`
- Renders each app as a tab / nav-rail entry
- Loads each app's UI via WebView initially (fastest path; proves the architecture)

Subsequent phases (beyond `os-shell` branch) may migrate individual mini-app UIs to native screens if a mini-app's UX demands it. WebView and native screens can coexist within the same shell.

## Consequences

- **No constraint on web shell tech.** Iframes (ADR-002) are fine for web; they have nothing to do with mobile.
- **Backend stays the single source of truth.** Every mini-app's actions are callable from any shell via HTTP RPC. Identity propagation works the same way.
- **WebView is acceptable for v1 mobile.** The cost of feeling not-native is offset by zero rewrites. We measure user feedback before investing in native rewrites.
- **Mini-app contract is platform-agnostic** — backend + manifest + UI (web). Mobile shells consume the backend + manifest; UI is shell's responsibility, not the mini-app's.
- **`packages/mobile-app/` is the implementation home** for the iOS + Android shells. Single codebase if RN; two codebases if going native. Out of scope to commit now.

## Constraints this places on Phase 1-7 work

- Capability registry must be exposed as **clean HTTP API** (not just in-process function calls). Mobile shells consume the same endpoints the web shell uses internally.
- Workspace SSO must work over **HTTP bearer tokens** in addition to cookies, for the mobile shell which can't easily share cookies with a server (or chooses not to).
- Mini-app backend responses must be **mobile-friendly JSON** — no HTML-embedded payloads, no assumptions about a browser environment.

## Alternatives considered

- **Commit to React Native cross-platform now.** Rejected — would require rewriting every existing template's UI (Tailwind classes wouldn't work in RN, React DOM components wouldn't work in RN). Massive scope creep.
- **Commit to native-only (no WebView).** Rejected — too much work for v1; we don't yet have user feedback to justify it.
- **Skip mobile entirely for v1.** Rejected — the user explicitly listed mobile as a foundational concern. Even a minimal Phase 8 shell proves the architecture's portability.

## References

- ADR-002 (web iframes), ADR-004 (registry in dispatch)
- [`architecture/06-mobile-foundation.md`](../architecture/06-mobile-foundation.md)
- Phase 8 delivery doc
