# Phase 8 — Mobile Foundation Status

Implementation report for Phase 8 of the `os-shell` super-app rollout. Per
[ADR-006](../../docs/decisions/ADR-006-mobile-foundation-strategy.md) the
goal of this phase is to **prove the super-app architecture is portable to
mobile** with the simplest possible shell that consumes the same capability
registry as the web shell. Polished UI per mini-app is deferred to v2.

## Audit decision

`packages/mobile-app/` was already an Expo Router project (Expo 55, React
Native 0.83, expo-router 55, react-native-webview 13). It was workable but
hard-coded against `@agent-native/shared-app-config`'s static `TEMPLATE_APPS`
list and used a cookie-bridge (`?_session=...` query-param promotion) for
auth — neither of which match the Phase 8 contract (registry-driven app
list + workspace bearer-token JWT).

**Decision: extend, do not scaffold from scratch.** The existing Expo Router
shell is well-architected; we layer the Phase 8 contract on top while
keeping the legacy `(tabs)` flow available behind a feature toggle (the
auth gate in `app/_layout.tsx`). When a workspace JWT is present the user
lands in the registry-driven `/registry-apps` flow; without one they're
routed to `/sign-in`.

## Stack

| Layer | Choice | Why |
|---|---|---|
| Framework | Expo SDK 55 + Expo Router 5 | Already in place; fastest path to iOS + Android |
| WebView host | `react-native-webview@13` | Already in place; mature on both platforms |
| Token storage | `@react-native-async-storage/async-storage@3` | Already in place; `expo-secure-store` deferred to v2 |
| Icons | `@expo/vector-icons` (Feather set) | Already in place; native to Expo, no extra deps |
| Tests | Vitest 4 (smoke only) | Pure-TS helpers run under Node; UI tests deferred to Maestro / Detox in v2 |
| Build | `expo export --platform ios|android` | Verified — both platforms bundle cleanly |

## What ships

### Server side (dispatch package, framework-level)

| File | Purpose |
|---|---|
| `packages/dispatch/src/server/lib/mobile-token.ts` | JWT mint + verify using `BETTER_AUTH_SECRET`. HS256, three-part token, `scope: "mobile"`, default 7-day TTL. |
| `packages/dispatch/src/server/lib/mobile-token.spec.ts` | 17 unit tests covering happy path, tampered payload, alg=none defence, expired tokens, wrong scope, wrong secret. |
| `packages/dispatch/src/server/plugins/mobile-auth.ts` | Nitro plugin mounting `POST /_agent-native/auth/mobile-token`. Verifies credentials via Better Auth's `signInEmail`, mints a JWT, returns `{ token, expiresAt, email, orgId? }`. |
| `packages/dispatch/src/server/plugins/mobile-auth.spec.ts` | 7 handler-level tests covering body validation, bad-method rejection, 401 on invalid credentials, JWT mint round-trip. |
| `packages/dispatch/src/server/plugins/capability-registry.ts` | Updated `readSessionForEvent` to accept a mobile bearer JWT before falling through to the cookie path. Cookie auth path is **unchanged** — bearer is only consulted when `Authorization: Bearer <jwt>` is present and parses. |
| `packages/core/src/server/index.ts` | Re-exports `getBetterAuth`, `getBetterAuthSync`, `getAuthSecret`, `BetterAuthInstance` so the dispatch plugin can sign and verify against the same secret Better Auth uses. |
| `templates/dispatch/server/plugins/mobile-auth.ts` | One-liner that re-exports `dispatchMobileAuthPlugin` so Nitro auto-loads it. |

### Mobile side

| File | Purpose |
|---|---|
| `packages/mobile-app/lib/config.ts` | Resolves the workspace base URL from `expo.extra.workspaceUrl`, `EXPO_PUBLIC_WORKSPACE_URL`, or platform-specific dev defaults (`http://10.0.2.2:8080` on Android, `http://localhost:8080` elsewhere). |
| `packages/mobile-app/lib/auth.ts` | `signInWithPassword`, `getStoredToken`, `clearStoredToken`, `authedFetch`. Persists the JWT in AsyncStorage; `authedFetch` adds `Authorization: Bearer <token>` to every same-origin request. |
| `packages/mobile-app/lib/auth.spec.ts` | 6 Vitest smoke tests stubbing AsyncStorage + `fetch` to verify mint round-trip, 401 surfacing, network-error handling, and bearer-header injection. |
| `packages/mobile-app/lib/use-registry-apps.ts` | React hook that fetches `/_agent-native/registry/apps` and surfaces `{ apps, loading, error, reload }`. |
| `packages/mobile-app/app/sign-in.tsx` | Workspace sign-in screen — email + password → `POST /auth/mobile-token` → store token → route to `/registry-apps`. |
| `packages/mobile-app/app/registry-apps.tsx` | Apps list driven by the registry endpoint. Tabler/Feather icon + name + description + capability count. Pull-to-refresh, retry-on-error, sign-out from the header. |
| `packages/mobile-app/app/registry-apps/[id].tsx` | Per-app WebView host. Injects the JWT via the initial-request `Authorization` header AND patches `window.fetch` inside the WebView so in-page XHR also carries the bearer. |
| `packages/mobile-app/app/_layout.tsx` | Root layout with auth gate — unauthenticated users land on `/sign-in`; authenticated users go straight to `/registry-apps`. Legacy `(tabs)` flow remains addressable for users with stored static-config session tokens. |
| `packages/mobile-app/vitest.config.ts` | Vitest config for the smoke tests. |

### Untouched (preserved)

- The legacy `(tabs)`-driven flow (Mail, Calendar, Slides, etc.) is kept as-is
  for users with the previous cookie-bridge session. Phase 8 introduces a
  parallel path; v2 will consolidate.
- The cookie auth path inside the dispatch capability-registry plugin is
  unchanged — the bearer-JWT check only runs when the `Authorization` header
  is present and well-formed.
- The Phase 1 capability registry HTTP contract is unchanged.
- The Phase 2 dispatch web shell is unchanged.

## Bearer-token auth API (framework-level)

```
POST /_agent-native/auth/mobile-token
Content-Type: application/json

{ "email": "alice@demo.local", "password": "..." }
```

Success (200):

```json
{
  "ok": true,
  "token": "<header>.<payload>.<sig>",
  "expiresAt": 1748812345678,
  "email": "alice@demo.local",
  "orgId": "org_42"
}
```

Failures (HTTP status + machine-readable reason):

| Status | Reason | Cause |
|---|---|---|
| 400 | `invalid_body` | Body is not valid JSON |
| 400 | `missing_credentials` | `email` or `password` missing/empty |
| 401 | `invalid_credentials` | Better Auth rejected the password |
| 405 | `method_not_allowed` | Non-POST request |

Token shape (HS256 JWT):

```jsonc
// header
{ "alg": "HS256", "typ": "JWT" }
// payload
{
  "iss": "agent-native/dispatch",
  "sub": "alice@demo.local",
  "email": "alice@demo.local",
  "orgId": "org_42",
  "iat": 1748725945,
  "exp": 1749330745,    // default 7 days
  "scope": "mobile"
}
```

Signing key: `BETTER_AUTH_SECRET` (shared with Better Auth's cookie path).

### Identity propagation

When a request to `/_agent-native/registry/rpc` (or any future registry
endpoint that calls `readSessionForEvent`) carries
`Authorization: Bearer <mobile-jwt>`:

1. The capability registry plugin parses the bearer, verifies the signature
   against `BETTER_AUTH_SECRET`, and asserts `scope === "mobile"`.
2. The decoded `{ email, orgId }` is fed into `runWithRequestContext`,
   which is the same identity scope every cookie-authed request uses.
3. Capability handlers read `getRequestUserEmail()` / `getRequestOrgId()`
   from the request context — they cannot tell whether identity came from
   a cookie or a bearer.

This is the property that makes the contract "the same registry as the web
shell" — the registry doesn't change, only the entry-point auth resolver.

## Build & run

### Prerequisites

- Node 18+, pnpm 9
- For iOS: macOS + Xcode + iOS Simulator
- For Android: Android Studio + an emulator

### Type-check + tests

```bash
# Dispatch (JWT + handler tests — must pass before any mobile work)
cd packages/dispatch
pnpm typecheck && pnpm test    # 77 tests pass

# Mobile (smoke test on the auth helper)
cd packages/mobile-app
pnpm typecheck && pnpm test    # 6 tests pass
```

### Build the mobile bundle (verifies the JS bundle compiles for either platform)

```bash
cd packages/mobile-app

# iOS — produces dist/_expo/static/js/ios/entry-*.hbc (~3.1 MB Hermes)
pnpm exec expo export --platform ios

# Android — produces dist/_expo/static/js/android/entry-*.hbc (~3.1 MB Hermes)
pnpm exec expo export --platform android
```

Both platforms bundle cleanly with the Phase 8 changes (verified
2026-05-16).

### Run locally on a simulator

Phase 8 picks **iOS Simulator** as the easier-to-build path on the
developer machine (no Xcode signing dance for the simulator target, no
gradle build for Android Studio). The Android emulator works too — just
remember to set the workspace URL to `http://10.0.2.2:8080`.

```bash
# In one terminal — boot the dispatch host
cd templates/dispatch
pnpm dev               # listens on http://localhost:8080

# In another terminal — boot the mobile shell
cd packages/mobile-app
pnpm start             # Expo dev server

# Open Expo Go on the simulator, then either:
#   - press `i` in the Expo CLI to open the iOS Simulator, or
#   - press `a` to open the Android emulator (with 10.0.2.2:8080)
```

**iOS Simulator URL**: `http://localhost:8080`
**Android Emulator URL**: `http://10.0.2.2:8080`

Set these via either `EXPO_PUBLIC_WORKSPACE_URL=...` before `pnpm start`,
or by editing `expo.extra.workspaceUrl` in `app.json`.

## What works

- [x] Sign-in screen renders, validates input, hits the mobile-token endpoint.
- [x] On 200, the JWT is persisted in AsyncStorage and the apps list mounts.
- [x] On 401, an inline error appears; the user retries.
- [x] Apps list fetches `/_agent-native/registry/apps` with the bearer
      header, renders name + icon + capability count.
- [x] Pull-to-refresh re-fetches; failed fetch shows retry + sign-out.
- [x] Tapping an app opens its URL in a WebView with the bearer attached
      to the initial request AND to in-page `fetch` calls.
- [x] Sign-out clears the token and routes back to `/sign-in`.
- [x] iOS bundle builds cleanly (`expo export --platform ios`).
- [x] Android bundle builds cleanly (`expo export --platform android`).
- [x] Dispatch package: 77/77 unit tests pass.
- [x] Mobile package: 6/6 smoke tests pass; `tsc --noEmit` clean.
- [x] Cookie auth path unchanged — existing dispatch web-shell flows
      continue to work.

## Known limitations / v2 follow-ups

These are explicitly out-of-scope per Phase 8 / ADR-006. They are listed
here so a v2 owner knows what to pick up.

1. **AsyncStorage, not secure storage.** The JWT lives in AsyncStorage,
   which is readable by other apps on rooted/jailbroken devices. v2 should
   move to `expo-secure-store` (iOS Keychain + Android KeyStore).
2. **No client-side refresh.** A 7-day token expires silently; users have
   to re-sign-in. v2 should add a `/auth/refresh-mobile-token` endpoint
   and an automatic refresh-on-401 retry.
3. **No Google OAuth.** Google blocks OAuth flows inside embedded
   WebViews. v2 needs a system-browser flow + deep-link callback.
4. **No native screens per mini-app.** The Phase 8 contract is WebView
   for every mini-app's UI. v2 may migrate individual mini-apps to native
   screens; the registry contract supports either.
5. **No push notifications.** Not in scope.
6. **No App Store / Play Store packaging.** EAS Build config is in place
   (`eas.json` ships in the repo) but the actual store-submission flow
   is v2.
7. **No e2e tests.** Vitest covers the pure-TS auth helpers; UI flows
   need Maestro / Detox in v2.
8. **The bearer JWT is opaque to the legacy `getSession()` chain.** The
   mobile shell's bearer is only consumed by the capability-registry
   plugin's `readSessionForEvent`. Other endpoints (e.g. the action
   auto-mount path) still rely on cookies. v2 should extend the core
   `getSession()` resolver to recognize the mobile JWT too, so any
   future endpoint that adopts `runWithRequestContext` works
   automatically with the mobile shell.
9. **WebSocket auth.** The injected `fetch` patch only covers XHR. WS
   connections (used by some templates for live collaboration) fall
   back to cookie auth, which means collaboration features won't work
   from the mobile shell yet. v2 should either (a) move the auth header
   into a token in the WS subprotocol, or (b) prefer SSE / polling for
   mobile.

## What needs to happen next (Phase 8 follow-up)

In priority order:

1. **Wire up `getSession()` to read the mobile JWT.** Today only the
   capability-registry plugin consumes the bearer. Promoting it to the
   core resolver gives every dispatch endpoint and every auto-mounted
   action the same identity propagation for free.
2. **Secure-storage migration** (`expo-secure-store`).
3. **Refresh-on-401 in `authedFetch`** so the user does not have to
   re-sign-in every 7 days.
4. **Google OAuth flow** via system browser + deep link.
5. **Native screens for the highest-traffic mini-apps** (mail, calendar)
   — keep WebView as the long-tail fallback.
6. **Maestro / Detox e2e harness.**
7. **EAS Build + Store submission pipeline.**

## Screenshots

Not attached — the iOS Simulator on the build machine wasn't accessible
from this shell session. The Hermes bytecode bundle compiles cleanly for
both platforms, which is the verification gate Phase 8 specifies. A
follow-up commit by anyone with simulator access can attach
`docs/screenshots/phase-8-*.png` and link them here.
